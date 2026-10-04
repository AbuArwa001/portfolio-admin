"use client";

import * as React from "react";
import { Terminal, Copy, RotateCcw, Download, Check } from "lucide-react";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
type Mode =
  | "user_exec"
  | "privileged_exec"
  | "global_config"
  | "interface_config"
  | "vlan_config"
  | "router_config"
  | "line_config";

interface DeviceState {
  hostname: string;
  vlans: Record<number, { name: string; active: boolean }>;
  interfaces: Record<
    string,
    {
      description: string;
      ip?: string;
      mask?: string;
      shutdown: boolean;
      mode?: "access" | "trunk";
      vlan?: number;
      duplex?: string;
      speed?: string;
    }
  >;
  routes: Array<{ network: string; mask: string; next_hop: string; metric: number }>;
  enable_password: string;
  bannerMotd: string;
  spanningTree: Record<number, string>;
  runningConfig: string[];
}

interface TerminalLine {
  type: "input" | "output" | "error" | "info" | "prompt";
  content: string;
}

interface CiscoCliTerminalProps {
  deviceName?: string;
  vendor?: "cisco" | "juniper" | "aruba";
  initialConfig?: string;
  onConfigChange?: (config: string) => void;
  labObjectives?: string[];
  className?: string;
}

// ──────────────────────────────────────────────────────────────
// Cisco IOS command sets for tab completion
// ──────────────────────────────────────────────────────────────
const USER_COMMANDS = ["enable", "show", "exit", "logout", "ping", "traceroute", "telnet", "ssh"];
const PRIV_COMMANDS = [
  "configure terminal",
  "show",
  "no",
  "copy",
  "write",
  "reload",
  "ping",
  "traceroute",
  "debug",
  "undebug",
  "clear",
  "erase",
  "clock",
  "disable",
  "exit",
];
const GLOBAL_COMMANDS = [
  "hostname",
  "interface",
  "vlan",
  "ip route",
  "ip default-gateway",
  "spanning-tree",
  "banner motd",
  "enable secret",
  "enable password",
  "username",
  "line",
  "service password-encryption",
  "no",
  "do show",
  "exit",
  "end",
];

const SHOW_COMMANDS = [
  "show version",
  "show running-config",
  "show startup-config",
  "show interfaces",
  "show ip interface brief",
  "show ip route",
  "show vlan brief",
  "show vlan",
  "show spanning-tree",
  "show mac address-table",
  "show arp",
  "show cdp neighbors",
  "show cdp neighbors detail",
  "show etherchannel summary",
  "show ip ospf neighbor",
  "show ip ospf database",
  "show ip bgp",
  "show ip protocols",
  "show ip nat translations",
  "show access-lists",
  "show clock",
  "show users",
  "show history",
  "show flash",
  "show processes cpu",
  "show processes memory",
];

// ──────────────────────────────────────────────────────────────
// Helper: build default device state
// ──────────────────────────────────────────────────────────────
function buildDefaultState(hostname: string, vendor: string): DeviceState {
  const ifaces: DeviceState["interfaces"] = {};
  if (vendor === "cisco") {
    for (let i = 0; i < 4; i++) {
      ifaces[`GigabitEthernet0/${i}`] = {
        description: "",
        shutdown: i > 1,
        duplex: "auto",
        speed: "auto",
      };
    }
    for (let i = 0; i < 24; i++) {
      ifaces[`FastEthernet0/${i}`] = {
        description: "",
        shutdown: false,
        mode: "access",
        vlan: 1,
        duplex: "auto",
        speed: "auto",
      };
    }
  }
  return {
    hostname,
    vlans: {
      1: { name: "default", active: true },
      1002: { name: "fddi-default", active: false },
      1003: { name: "token-ring-default", active: false },
      1004: { name: "fddinet-default", active: false },
      1005: { name: "trnet-default", active: false },
    },
    interfaces: ifaces,
    routes: [],
    enable_password: "cisco",
    bannerMotd: "",
    spanningTree: {},
    runningConfig: [],
  };
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function padEnd(str: string, len: number) {
  return str.length >= len ? str : str + " ".repeat(len - str.length);
}

function getPrompt(mode: Mode, state: DeviceState, currentIface?: string): string {
  const h = state.hostname;
  switch (mode) {
    case "user_exec":
      return `${h}>`;
    case "privileged_exec":
      return `${h}#`;
    case "global_config":
      return `${h}(config)#`;
    case "interface_config":
      return `${h}(config-if)#`;
    case "vlan_config":
      return `${h}(config-vlan)#`;
    case "router_config":
      return `${h}(config-router)#`;
    case "line_config":
      return `${h}(config-line)#`;
    default:
      return `${h}>`;
  }
}

// ──────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────
export function CiscoCliTerminal({
  deviceName = "Switch",
  vendor = "cisco",
  initialConfig = "",
  onConfigChange,
  labObjectives = [],
  className = "",
}: CiscoCliTerminalProps) {
  const [state, setState] = React.useState<DeviceState>(() =>
    buildDefaultState(deviceName, vendor)
  );
  const [mode, setMode] = React.useState<Mode>("user_exec");
  const [lines, setLines] = React.useState<TerminalLine[]>([]);
  const [input, setInput] = React.useState("");
  const [history, setHistory] = React.useState<string[]>([]);
  const [histIndex, setHistIndex] = React.useState(-1);
  const [currentIface, setCurrentIface] = React.useState<string | undefined>();
  const [currentVlan, setCurrentVlan] = React.useState<number | undefined>();
  const [currentLine, setCurrentLine] = React.useState<string | undefined>();
  const [awaitingPassword, setAwaitingPassword] = React.useState(false);
  const [passwordBuffer, setPasswordBuffer] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [commandCount, setCommandCount] = React.useState(0);

  const termRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // ── Boot message ─────────────────────────────────────────────
  React.useEffect(() => {
    const bootLines: TerminalLine[] = [
      { type: "info", content: "" },
      { type: "info", content: `  Cisco IOS Software, Version 15.2(7)E4` },
      { type: "info", content: `  Copyright (c) 1986-2021 by Cisco Systems, Inc.` },
      { type: "info", content: `  Device: ${deviceName}  |  Vendor: ${vendor.toUpperCase()}` },
      { type: "info", content: "" },
      { type: "info", content: `  Type 'enable' to enter privileged EXEC mode.` },
      { type: "info", content: `  Type '?' for help, or 'show ?' for show commands.` },
      { type: "info", content: "" },
    ];

    if (state.bannerMotd) {
      bootLines.push({ type: "info", content: state.bannerMotd });
    }
    setLines(bootLines);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scroll to bottom ─────────────────────────────────────────
  React.useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [lines]);

  // ── Apply initial config from lab ────────────────────────────
  React.useEffect(() => {
    if (initialConfig && initialConfig.trim()) {
      // Parse common startup config lines
      const configLines = initialConfig.split("\n");
      setState((prev) => {
        const next = { ...prev };
        configLines.forEach((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("hostname ")) {
            next.hostname = trimmed.slice(9).trim();
          }
        });
        return next;
      });
    }
  }, [initialConfig]);

  // ── Notify config change ─────────────────────────────────────
  React.useEffect(() => {
    if (onConfigChange) {
      onConfigChange(buildRunningConfig(state));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ──────────────────────────────────────────────────────────────
  // Build running-config output
  // ──────────────────────────────────────────────────────────────
  function buildRunningConfig(s: DeviceState): string {
    const lines: string[] = [
      "!",
      "version 15.2",
      "!",
      `hostname ${s.hostname}`,
      "!",
    ];
    if (s.enable_password !== "cisco") {
      lines.push(`enable secret 5 ${btoa(s.enable_password)}`);
    }
    if (s.bannerMotd) {
      lines.push(`banner motd ^C${s.bannerMotd}^C`);
    }
    lines.push("!");

    // VLANs
    Object.entries(s.vlans).forEach(([id, vlan]) => {
      const numId = Number(id);
      if (numId > 1 && numId < 1002) {
        lines.push(`vlan ${id}`);
        lines.push(` name ${vlan.name}`);
        if (!vlan.active) lines.push(` shutdown`);
        lines.push("!");
      }
    });

    // Interfaces
    Object.entries(s.interfaces).forEach(([name, iface]) => {
      lines.push(`interface ${name}`);
      if (iface.description) lines.push(` description ${iface.description}`);
      if (iface.ip && iface.mask) lines.push(` ip address ${iface.ip} ${iface.mask}`);
      if (iface.mode === "access" && iface.vlan) {
        lines.push(` switchport mode access`);
        lines.push(` switchport access vlan ${iface.vlan}`);
      }
      if (iface.mode === "trunk") {
        lines.push(` switchport mode trunk`);
      }
      if (iface.shutdown) lines.push(` shutdown`);
      lines.push("!");
    });

    // Static routes
    s.routes.forEach((r) => {
      lines.push(`ip route ${r.network} ${r.mask} ${r.next_hop}`);
    });

    lines.push("!");
    lines.push("end");
    return lines.join("\n");
  }

  // ──────────────────────────────────────────────────────────────
  // Output helpers
  // ──────────────────────────────────────────────────────────────
  function out(content: string) {
    setLines((prev) => [...prev, { type: "output", content }]);
  }
  function err(content: string) {
    setLines((prev) => [...prev, { type: "error", content }]);
  }
  function info(content: string) {
    setLines((prev) => [...prev, { type: "info", content }]);
  }

  // ──────────────────────────────────────────────────────────────
  // Tab completion
  // ──────────────────────────────────────────────────────────────
  function getCompletions(partial: string): string[] {
    const lower = partial.toLowerCase();
    let pool: string[] = [];

    if (mode === "user_exec") pool = USER_COMMANDS;
    else if (mode === "privileged_exec") pool = [...PRIV_COMMANDS, ...SHOW_COMMANDS];
    else if (mode === "global_config") pool = GLOBAL_COMMANDS;

    if (lower.startsWith("show ")) {
      pool = SHOW_COMMANDS;
      return pool.filter((c) => c.toLowerCase().startsWith(lower));
    }

    return pool.filter((c) => c.toLowerCase().startsWith(lower));
  }

  // ──────────────────────────────────────────────────────────────
  // SHOW commands
  // ──────────────────────────────────────────────────────────────
  function handleShow(args: string[], s: DeviceState) {
    const sub = args.join(" ").toLowerCase();

    if (sub === "version" || sub === "ver") {
      out("Cisco IOS Software, Version 15.2(7)E4");
      out("Technical Support: http://www.cisco.com/techsupport");
      out(`ROM: Bootstrap program is C2960 boot loader`);
      out("");
      out(`${s.hostname} uptime is 0 hours, 12 minutes`);
      out("System image file is flash:c2960s-universalk9-mz.150-2.SE9.bin");
      out("");
      out("Cisco WS-C2960S-48TS-L (PowerPC405) processor with 131072K bytes of memory.");
      out("Processor board ID FOC1544Y16T");
      out("Last reset from power-on");
      out("48 FastEthernet interfaces");
      out("4 Gigabit Ethernet interfaces");
      out("The password-recovery mechanism is enabled.");
      out(`Base ethernet MAC Address : 00:1B:0D:E9:23:00`);
    } else if (sub === "ip interface brief" || sub === "ip int br" || sub === "ip int b") {
      out("Interface              IP-Address      OK? Method Status                Protocol");
      Object.entries(s.interfaces).forEach(([name, iface]) => {
        const shortName = name.replace("GigabitEthernet", "Gi").replace("FastEthernet", "Fa");
        const ip = iface.ip || "unassigned";
        const ok = iface.ip ? "YES" : "YES";
        const method = iface.ip ? "manual" : "unset";
        const status = iface.shutdown ? "administratively down" : "up";
        const proto = iface.shutdown ? "down" : "up";
        out(
          `${padEnd(shortName, 23)}${padEnd(ip, 16)}${ok}  ${padEnd(method, 7)}${padEnd(status, 22)}${proto}`
        );
      });
    } else if (sub === "ip route" || sub === "ip rou") {
      out("Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP");
      out("       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area");
      out("       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2");
      out("       E1 - OSPF external type 1, E2 - OSPF external type 2");
      out("       i - IS-IS, su - IS-IS summary, L1 - IS-IS level-1, L2 - IS-IS level-2");
      out("       ia - IS-IS inter area, * - candidate default, U - per-user static route");
      out("");
      if (s.routes.length === 0) {
        out("Gateway of last resort is not set");
      } else {
        out("Gateway of last resort is not set");
        out("");
        s.routes.forEach((r) => {
          out(`S    ${r.network}/${r.mask} [1/${r.metric}] via ${r.next_hop}`);
        });
      }
    } else if (sub === "vlan brief" || sub === "vlan br" || sub === "vlan") {
      out("VLAN Name                             Status    Ports");
      out("---- -------------------------------- --------- -------------------------------");
      Object.entries(s.vlans).forEach(([id, vlan]) => {
        const ports = Object.entries(s.interfaces)
          .filter(([, iface]) => iface.vlan === Number(id))
          .map(([name]) => name.replace("FastEthernet", "Fa").replace("GigabitEthernet", "Gi"))
          .slice(0, 6)
          .join(", ");
        out(
          `${padEnd(id, 5)}${padEnd(vlan.name, 33)}${padEnd(vlan.active ? "active" : "act/unsup", 10)}${ports}`
        );
      });
    } else if (sub === "running-config" || sub === "run" || sub === "running") {
      out("Building configuration...");
      out("");
      out("Current configuration : 1847 bytes");
      out("!");
      buildRunningConfig(s)
        .split("\n")
        .forEach((l) => out(l));
    } else if (sub === "startup-config" || sub === "startup") {
      out("Using 1847 out of 524288 bytes");
      out("!");
      out("hostname " + s.hostname);
      out("!");
      out("end");
    } else if (sub.startsWith("interfaces") || sub === "int") {
      Object.entries(s.interfaces)
        .slice(0, 4)
        .forEach(([name, iface]) => {
          out(`${name} is ${iface.shutdown ? "administratively down" : "up"}, line protocol is ${iface.shutdown ? "down" : "up"}`);
          out(`  Hardware is Gigabit Ethernet, address is 000b.dead.beef`);
          if (iface.ip) out(`  Internet address is ${iface.ip}/${iface.mask}`);
          out(`  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec`);
          out(`  Duplex ${iface.duplex || "auto"}, Speed ${iface.speed || "auto"}`);
          out("");
        });
    } else if (sub === "mac address-table" || sub === "mac address-t" || sub === "mac addr") {
      out("          Mac Address Table");
      out("-------------------------------------------");
      out("Vlan    Mac Address       Type        Ports");
      out("----    -----------       --------    -----");
      out("   1    001b.0de9.2300    DYNAMIC     Gi0/0");
      out("   1    aabb.cc00.0100    DYNAMIC     Fa0/1");
    } else if (sub === "arp") {
      out("Protocol  Address          Age (min)  Hardware Addr   Type   Interface");
      Object.entries(s.interfaces).forEach(([name, iface]) => {
        if (iface.ip) {
          out(`Internet  ${padEnd(iface.ip, 17)}0   001b.0de9.2300  ARPA   ${name}`);
        }
      });
    } else if (sub === "spanning-tree" || sub === "span") {
      out("VLAN0001");
      out("  Spanning tree enabled protocol ieee");
      out("  Root ID    Priority    32769");
      out("             Address     001b.0de9.2300");
      out("             This bridge is the root");
      out("             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec");
      out("");
      out("  Bridge ID  Priority    32769  (priority 32768 sys-id-ext 1)");
      out("             Address     001b.0de9.2300");
      out("             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec");
      out("             Aging Time  300 sec");
    } else if (sub === "cdp neighbors" || sub === "cdp nei") {
      out("Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge");
      out("                  S - Switch, H - Host, I - IGMP, r - Repeater, P - Phone,");
      out("                  D - Remote, C - CVTA, M - Two-port Mac Relay");
      out("");
      out("Device ID    Local Intrfce   Holdtme    Capability  Platform   Port ID");
    } else if (sub === "history") {
      history.slice(-10).forEach((h, i) => out(`    ${i + 1}  ${h}`));
    } else if (sub === "clock") {
      const now = new Date();
      out(
        `*${now.toLocaleTimeString("en-US", { hour12: false })} UTC ${now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit", year: "numeric" })}`
      );
    } else if (sub === "flash" || sub === "flash:") {
      out("Directory of flash:/");
      out("");
      out("    1  -rw-    15032320          c2960s-universalk9-mz.150-2.SE9.bin");
      out("");
      out("32514048 bytes total (17481728 bytes free)");
    } else if (sub === "processes cpu" || sub === "proc cpu") {
      out("CPU utilization for five seconds: 0%/0%; one minute: 0%; five minutes: 0%");
    } else if (sub === "users") {
      out("    Line       User       Host(s)              Idle       Location");
      out("*  0 con 0               idle                 00:00:00");
    } else if (sub === "access-lists") {
      out("Standard IP access list");
      out("Extended IP access list");
    } else {
      err(`% Invalid input detected at '^' marker`);
      err(`  Unknown show subcommand: show ${args.join(" ")}`);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // INTERFACE sub-commands
  // ──────────────────────────────────────────────────────────────
  function handleInterfaceCmd(cmd: string, rest: string[], s: DeviceState, iface: string): DeviceState {
    const next = { ...s, interfaces: { ...s.interfaces } };
    const ifaceData = { ...next.interfaces[iface] };

    if (cmd === "no" && rest[0] === "shutdown") {
      ifaceData.shutdown = false;
      out(`%LINK-3-UPDOWN: Interface ${iface}, changed state to up`);
      out(`%LINEPROTO-5-UPDOWN: Line protocol on Interface ${iface}, changed state to up`);
    } else if (cmd === "shutdown") {
      ifaceData.shutdown = true;
      out(`%LINK-5-CHANGED: Interface ${iface}, changed state to administratively down`);
      out(`%LINEPROTO-5-UPDOWN: Line protocol on Interface ${iface}, changed state to down`);
    } else if (cmd === "description") {
      ifaceData.description = rest.join(" ");
    } else if (cmd === "ip" && rest[0] === "address") {
      if (rest.length >= 3) {
        ifaceData.ip = rest[1];
        ifaceData.mask = rest[2];
      } else {
        err("% Incomplete command.");
      }
    } else if (cmd === "no" && rest[0] === "ip" && rest[1] === "address") {
      delete ifaceData.ip;
      delete ifaceData.mask;
    } else if (cmd === "switchport" && rest[0] === "mode" && rest[1] === "access") {
      ifaceData.mode = "access";
    } else if (cmd === "switchport" && rest[0] === "mode" && rest[1] === "trunk") {
      ifaceData.mode = "trunk";
    } else if (cmd === "switchport" && rest[0] === "access" && rest[1] === "vlan") {
      const vlanId = parseInt(rest[2]);
      if (!isNaN(vlanId)) {
        ifaceData.vlan = vlanId;
        if (!next.vlans[vlanId]) {
          next.vlans = { ...next.vlans, [vlanId]: { name: `VLAN${vlanId}`, active: true } };
        }
      }
    } else if (cmd === "switchport" && rest[0] === "trunk" && rest[1] === "allowed") {
      // trunk allowed vlan handling
    } else if (cmd === "duplex") {
      if (["auto", "full", "half"].includes(rest[0])) {
        ifaceData.duplex = rest[0];
      } else {
        err("% Invalid duplex value.");
      }
    } else if (cmd === "speed") {
      ifaceData.speed = rest[0];
    } else if (cmd === "spanning-tree" && rest[0] === "portfast") {
      // portfast accepted silently
    } else if (cmd === "spanning-tree" && rest[0] === "bpduguard") {
      // bpduguard accepted
    } else if (cmd === "channel-group") {
      // etherchannel
    } else {
      err(`% Invalid input detected at '^' marker.`);
    }

    next.interfaces[iface] = ifaceData;
    return next;
  }

  // ──────────────────────────────────────────────────────────────
  // GLOBAL CONFIG sub-commands
  // ──────────────────────────────────────────────────────────────
  function handleGlobalCmd(cmd: string, rest: string[], s: DeviceState): { nextState: DeviceState; nextMode: Mode } {
    let nextState = { ...s };
    let nextMode: Mode = "global_config";

    if (cmd === "hostname") {
      nextState.hostname = rest[0] || s.hostname;
    } else if (cmd === "interface" || cmd === "int") {
      // Normalize interface name
      const rawIface = rest.join(" ");
      const normalized = normalizeIfaceName(rawIface);

      if (!nextState.interfaces[normalized]) {
        nextState.interfaces = {
          ...nextState.interfaces,
          [normalized]: { description: "", shutdown: false },
        };
      }
      setCurrentIface(normalized);
      nextMode = "interface_config";
    } else if (cmd === "vlan") {
      const vlanId = parseInt(rest[0]);
      if (!isNaN(vlanId) && vlanId >= 2 && vlanId <= 4094) {
        setCurrentVlan(vlanId);
        if (!nextState.vlans[vlanId]) {
          nextState.vlans = {
            ...nextState.vlans,
            [vlanId]: { name: `VLAN${String(vlanId).padStart(4, "0")}`, active: true },
          };
        }
        nextMode = "vlan_config";
      } else {
        err(`% Invalid VLAN ID.`);
      }
    } else if (cmd === "ip" && rest[0] === "route") {
      if (rest.length >= 4) {
        nextState.routes = [
          ...nextState.routes,
          { network: rest[1], mask: rest[2], next_hop: rest[3], metric: 1 },
        ];
        out(`Static route added: ${rest[1]} via ${rest[3]}`);
      } else {
        err("% Incomplete command.");
      }
    } else if (cmd === "ip" && rest[0] === "default-gateway") {
      nextState.routes = [
        ...nextState.routes,
        { network: "0.0.0.0", mask: "0.0.0.0", next_hop: rest[1], metric: 1 },
      ];
    } else if (cmd === "enable" && rest[0] === "secret") {
      nextState.enable_password = rest.slice(1).join(" ");
    } else if (cmd === "enable" && rest[0] === "password") {
      nextState.enable_password = rest.slice(1).join(" ");
    } else if (cmd === "banner" && rest[0] === "motd") {
      nextState.bannerMotd = rest.slice(2).join(" ");
    } else if (cmd === "no" && rest[0] === "ip" && rest[1] === "route") {
      const network = rest[2];
      nextState.routes = nextState.routes.filter((r) => r.network !== network);
    } else if (cmd === "service" && rest.join(" ") === "password-encryption") {
      // accepted silently
    } else if (cmd === "line") {
      const lineType = rest[0]; // console, vty, aux
      setCurrentLine(lineType);
      nextMode = "line_config";
    } else if (cmd === "spanning-tree") {
      // spanning tree commands accepted
    } else if (cmd === "username") {
      // username config
    } else if (cmd === "no" && rest[0] === "vlan") {
      const vlanId = parseInt(rest[1]);
      if (!isNaN(vlanId)) {
        const newVlans = { ...nextState.vlans };
        delete newVlans[vlanId];
        nextState.vlans = newVlans;
      }
    } else if (cmd === "aaa") {
      // AAA commands accepted
    } else if (cmd === "crypto") {
      // Crypto commands accepted
    } else if (cmd === "logging") {
      // Logging accepted
    } else if (cmd === "snmp-server") {
      // SNMP accepted
    } else if (cmd === "ntp") {
      // NTP accepted
    } else {
      err(`% Invalid input detected at '^' marker.`);
    }

    return { nextState, nextMode };
  }

  // ──────────────────────────────────────────────────────────────
  // Normalize interface names (e.g. "gi0/0" → "GigabitEthernet0/0")
  // ──────────────────────────────────────────────────────────────
  function normalizeIfaceName(raw: string): string {
    const lower = raw.toLowerCase().trim();
    if (lower.startsWith("gigabitethernet") || lower.startsWith("gi")) {
      const num = lower.replace(/^(gigabitethernet|gi)/, "");
      return `GigabitEthernet${num}`;
    }
    if (lower.startsWith("fastethernet") || lower.startsWith("fa")) {
      const num = lower.replace(/^(fastethernet|fa)/, "");
      return `FastEthernet${num}`;
    }
    if (lower.startsWith("ethernet") || lower.startsWith("e")) {
      const num = lower.replace(/^(ethernet|e)/, "");
      return `Ethernet${num}`;
    }
    if (lower.startsWith("loopback") || lower.startsWith("lo")) {
      const num = lower.replace(/^(loopback|lo)/, "");
      return `Loopback${num}`;
    }
    if (lower.startsWith("serial") || lower.startsWith("se")) {
      const num = lower.replace(/^(serial|se)/, "");
      return `Serial${num}`;
    }
    if (lower.startsWith("vlan")) {
      const num = lower.replace(/^vlan/, "");
      return `Vlan${num}`;
    }
    return raw;
  }

  // ──────────────────────────────────────────────────────────────
  // PING simulation
  // ──────────────────────────────────────────────────────────────
  function handlePing(target: string) {
    out(`Type escape sequence to abort.`);
    out(`Sending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:`);
    out(`!!!!!`);
    out(`Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms`);
  }

  // ──────────────────────────────────────────────────────────────
  // Main command processor
  // ──────────────────────────────────────────────────────────────
  function processCommand(rawCmd: string) {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    // Add to history
    setHistory((prev) => {
      const next = prev.filter((h) => h !== trimmed);
      return [...next, trimmed];
    });
    setHistIndex(-1);

    // Add echo to terminal
    const prompt = getPrompt(mode, state, currentIface);
    setLines((prev) => [
      ...prev,
      { type: "input", content: `${prompt} ${trimmed}` },
    ]);

    setCommandCount((n) => n + 1);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const rest = parts.slice(1);

    // ── User EXEC ─────────────────────────────────────────────
    if (mode === "user_exec") {
      if (cmd === "enable") {
        if (state.enable_password && state.enable_password !== "") {
          setAwaitingPassword(true);
          out("Password: ");
        } else {
          setMode("privileged_exec");
        }
      } else if (cmd === "show") {
        handleShow(rest, state);
      } else if (cmd === "ping") {
        handlePing(rest[0] || "192.168.1.1");
      } else if (cmd === "?" || trimmed === "?") {
        USER_COMMANDS.forEach((c) => out(`  ${c}`));
      } else if (cmd === "exit" || cmd === "logout") {
        out("Goodbye.");
        setMode("user_exec");
      } else if (cmd === "traceroute" || cmd === "trace") {
        out(`Tracing the route to ${rest[0] || "192.168.1.1"}`);
        out("  1  192.168.1.1  4 msec  2 msec  3 msec");
        out(`  2  ${rest[0] || "10.0.0.1"}  8 msec  7 msec  9 msec`);
      } else {
        err(`% Unknown command or computer name, or unable to find computer address`);
      }
      return;
    }

    // ── Privileged EXEC ───────────────────────────────────────
    if (mode === "privileged_exec") {
      if (cmd === "configure" || (cmd === "conf" && rest[0] === "t")) {
        setMode("global_config");
        out("Enter configuration commands, one per line.  End with CNTL/Z.");
      } else if (cmd === "show") {
        handleShow(rest, state);
      } else if (cmd === "ping") {
        handlePing(rest[0] || "192.168.1.1");
      } else if (cmd === "traceroute" || cmd === "trace") {
        out(`Tracing the route to ${rest[0] || "192.168.1.1"}`);
        out("  1  192.168.1.1  4 msec  2 msec  3 msec");
      } else if (cmd === "write" || (cmd === "copy" && rest.join(" ") === "running-config startup-config")) {
        out("Building configuration...");
        out("[OK]");
      } else if (cmd === "erase" && rest[0] === "startup-config") {
        out("Erasing the nvram filesystem will remove all configuration files!");
        out("Continue? [confirm]");
        out("[OK]");
        out("Erase of nvram: complete");
      } else if (cmd === "reload") {
        out("Proceed with reload? [confirm]");
        out("*System reloading...*");
      } else if (cmd === "debug") {
        out(`Debugging ${rest.join(" ")} is on`);
      } else if (cmd === "no" && rest[0] === "debug") {
        out("All possible debugging has been turned off");
      } else if (cmd === "clear") {
        setLines([]);
      } else if (cmd === "disable") {
        setMode("user_exec");
      } else if (cmd === "exit") {
        setMode("user_exec");
      } else if (cmd === "clock" && rest[0] === "set") {
        out(`Clock set.`);
      } else if (cmd === "?" || trimmed.endsWith("?")) {
        [...PRIV_COMMANDS, ...SHOW_COMMANDS].forEach((c) => out(`  ${c}`));
      } else {
        err(`% Invalid input detected at '^' marker.`);
        err(`% Type "?" for a list of commands.`);
      }
      return;
    }

    // ── Global Config ─────────────────────────────────────────
    if (mode === "global_config") {
      if (cmd === "end" || (cmd === "ctrl" && rest[0] === "z")) {
        setMode("privileged_exec");
        out("%SYS-5-CONFIG_I: Configured from console by console");
      } else if (cmd === "exit") {
        setMode("privileged_exec");
      } else if (cmd === "do") {
        // do <privileged-command>
        const doRest = rest;
        const doCmd = doRest[0]?.toLowerCase();
        if (doCmd === "show") handleShow(doRest.slice(1), state);
        else if (doCmd === "ping") handlePing(doRest[1] || "192.168.1.1");
        else if (doCmd === "write" || doCmd === "wr") out("[OK]");
      } else if (cmd === "?" || trimmed.endsWith("?")) {
        GLOBAL_COMMANDS.forEach((c) => out(`  ${c}`));
      } else {
        const { nextState, nextMode } = handleGlobalCmd(cmd, rest, state);
        setState(nextState);
        setMode(nextMode);
      }
      return;
    }

    // ── Interface Config ──────────────────────────────────────
    if (mode === "interface_config") {
      if (cmd === "end") {
        setMode("privileged_exec");
        setCurrentIface(undefined);
        out("%SYS-5-CONFIG_I: Configured from console by console");
      } else if (cmd === "exit") {
        setMode("global_config");
        setCurrentIface(undefined);
      } else if (cmd === "do") {
        const doRest = rest;
        if (doRest[0]?.toLowerCase() === "show") handleShow(doRest.slice(1), state);
      } else if (currentIface) {
        const nextState = handleInterfaceCmd(cmd, rest, state, currentIface);
        setState(nextState);
      }
      return;
    }

    // ── VLAN Config ───────────────────────────────────────────
    if (mode === "vlan_config") {
      if (cmd === "name" && currentVlan !== undefined) {
        setState((prev) => ({
          ...prev,
          vlans: {
            ...prev.vlans,
            [currentVlan]: { ...prev.vlans[currentVlan], name: rest.join(" ") },
          },
        }));
      } else if (cmd === "shutdown" && currentVlan !== undefined) {
        setState((prev) => ({
          ...prev,
          vlans: {
            ...prev.vlans,
            [currentVlan]: { ...prev.vlans[currentVlan], active: false },
          },
        }));
      } else if (cmd === "no" && rest[0] === "shutdown" && currentVlan !== undefined) {
        setState((prev) => ({
          ...prev,
          vlans: {
            ...prev.vlans,
            [currentVlan]: { ...prev.vlans[currentVlan], active: true },
          },
        }));
      } else if (cmd === "end") {
        setMode("privileged_exec");
        setCurrentVlan(undefined);
      } else if (cmd === "exit") {
        setMode("global_config");
        setCurrentVlan(undefined);
      }
      return;
    }

    // ── Line Config ───────────────────────────────────────────
    if (mode === "line_config") {
      if (cmd === "end") {
        setMode("privileged_exec");
        setCurrentLine(undefined);
      } else if (cmd === "exit") {
        setMode("global_config");
        setCurrentLine(undefined);
      } else if (cmd === "password") {
        // accepted
      } else if (cmd === "login") {
        // accepted
      } else if (cmd === "transport") {
        // accepted
      }
      return;
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Key handler
  // ──────────────────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      if (awaitingPassword) {
        // Validate enable password
        if (passwordBuffer === state.enable_password || passwordBuffer === "cisco") {
          setMode("privileged_exec");
          out("");
        } else {
          err("% Access denied.");
        }
        setAwaitingPassword(false);
        setPasswordBuffer("");
        setInput("");
        return;
      }
      processCommand(input);
      setInput("");
    } else if (e.key === "Tab") {
      e.preventDefault();
      const completions = getCompletions(input);
      if (completions.length === 1) {
        setInput(completions[0] + " ");
      } else if (completions.length > 1) {
        out(`${getPrompt(mode, state, currentIface)} ${input}`);
        completions.forEach((c) => out(`  ${c}`));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIdx = histIndex < history.length - 1 ? histIndex + 1 : histIndex;
      setHistIndex(newIdx);
      setInput(history[history.length - 1 - newIdx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIdx = histIndex > 0 ? histIndex - 1 : -1;
      setHistIndex(newIdx);
      setInput(newIdx === -1 ? "" : history[history.length - 1 - newIdx] || "");
    } else if (e.ctrlKey && e.key === "c") {
      out("^C");
      setInput("");
    } else if (e.ctrlKey && e.key === "z") {
      if (mode !== "user_exec" && mode !== "privileged_exec") {
        setMode("privileged_exec");
        setCurrentIface(undefined);
        setCurrentVlan(undefined);
        out("%SYS-5-CONFIG_I: Configured from console by console");
      }
      setInput("");
    } else if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      setLines([]);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Collect all config from terminal lines as submitted_config
  // ──────────────────────────────────────────────────────────────
  const collectedConfig = React.useMemo(
    () => buildRunningConfig(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  );

  function handleCopy() {
    navigator.clipboard.writeText(collectedConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setState(buildDefaultState(deviceName, vendor));
    setMode("user_exec");
    setCurrentIface(undefined);
    setCurrentVlan(undefined);
    setLines([
      { type: "info", content: "" },
      { type: "info", content: "  Terminal reset." },
      { type: "info", content: "" },
    ]);
    setInput("");
    setHistory([]);
    setCommandCount(0);
  }

  function handleDownload() {
    const blob = new Blob([collectedConfig], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.hostname}-running-config.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const prompt = getPrompt(mode, state, currentIface);

  return (
    <div
      className={`flex flex-col h-full bg-[#0d1117] rounded-xl border border-[#30363d] overflow-hidden font-mono ${className}`}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#8b949e]">
            <Terminal className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span className="text-[#58a6ff] font-semibold">{state.hostname}</span>
            <span className="text-[#30363d]">│</span>
            <span className="uppercase tracking-wider">
              {mode.replace(/_/g, " ")}
            </span>
            {currentIface && (
              <>
                <span className="text-[#30363d]">│</span>
                <span className="text-[#3fb950]">{currentIface}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#8b949e] font-mono mr-2">
            {commandCount} cmds
          </span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            title="Copy running-config"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-md hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            title="Download config"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-md hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            title="Reset terminal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={termRef}
        className="flex-1 overflow-y-auto p-4 text-[13px] leading-relaxed cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            className={
              line.type === "error"
                ? "text-[#f85149]"
                : line.type === "input"
                ? "text-[#e6edf3]"
                : line.type === "info"
                ? "text-[#8b949e]"
                : "text-[#3fb950]"
            }
          >
            {line.content}
          </div>
        ))}

        {/* Current input line */}
        <div className="flex items-center text-[#e6edf3]">
          <span className="text-[#58a6ff] mr-1">{prompt}</span>
          <span className="whitespace-pre">
            {awaitingPassword ? "●".repeat(passwordBuffer.length) : input}
          </span>
          <span className="w-0.5 h-4 bg-[#58a6ff] animate-pulse ml-px" />
        </div>
      </div>

      {/* Hidden real input */}
      <input
        ref={inputRef}
        value={awaitingPassword ? passwordBuffer : input}
        onChange={(e) => {
          if (awaitingPassword) setPasswordBuffer(e.target.value);
          else setInput(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        className="opacity-0 absolute -z-10 pointer-events-none"
        autoFocus
        spellCheck={false}
        autoComplete="off"
      />

      {/* Shortcut hints bar */}
      <div className="px-4 py-1.5 bg-[#161b22] border-t border-[#30363d] flex items-center gap-4 text-[10px] text-[#8b949e]">
        <span><kbd className="px-1 py-0.5 rounded bg-[#21262d] text-[#58a6ff]">Tab</kbd> complete</span>
        <span><kbd className="px-1 py-0.5 rounded bg-[#21262d] text-[#58a6ff]">↑↓</kbd> history</span>
        <span><kbd className="px-1 py-0.5 rounded bg-[#21262d] text-[#58a6ff]">Ctrl+C</kbd> interrupt</span>
        <span><kbd className="px-1 py-0.5 rounded bg-[#21262d] text-[#58a6ff]">Ctrl+Z</kbd> end config</span>
        <span><kbd className="px-1 py-0.5 rounded bg-[#21262d] text-[#58a6ff]">Ctrl+L</kbd> clear</span>
        <span className="ml-auto">Click anywhere in terminal to focus</span>
      </div>
    </div>
  );
}
