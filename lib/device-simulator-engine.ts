// ============================================================
// MULTI-VENDOR NETWORK DEVICE SIMULATOR ENGINE
// Supports: Cisco IOS, ASA, NX-OS | Sophos XG | Palo Alto | 
//           Fortinet | Juniper JunOS | Aruba | MikroTik |
//           Linux | Generic L2 Switch | Cloud Router
// ============================================================

export type DeviceType =
  | "cisco_router"       // Cisco IOS ISR/ASR
  | "cisco_switch"       // Cisco Catalyst IOS
  | "cisco_asa"          // Cisco ASA Firewall
  | "cisco_nexus"        // Cisco NX-OS
  | "sophos_xg"          // Sophos XG/XGS Firewall
  | "palo_alto"          // Palo Alto PAN-OS
  | "fortinet"           // Fortinet FortiGate
  | "juniper"            // Juniper JunOS
  | "aruba"              // Aruba OS
  | "mikrotik"           // MikroTik RouterOS
  | "windows_pc"         // Windows PC (GUI-style)
  | "linux_server"       // Linux bash terminal
  | "generic_switch"     // Generic L2 Switch
  | "cloud_router";      // Simulated internet/cloud

export interface NetworkInterface {
  name: string;
  ip?: string;
  mask?: string;
  gateway?: string;
  dhcp?: boolean;
  status: "up" | "down" | "admin-down";
  mac?: string;
  speed?: string;
  duplex?: string;
  description?: string;
  vlan?: number;
  mode?: "access" | "trunk" | "routed";
  zone?: string;          // firewall zone
  mtu?: number;
}

export interface RouteEntry {
  network: string;
  mask: string;
  nextHop?: string;
  interface?: string;
  metric?: number;
  protocol: "static" | "connected" | "ospf" | "bgp" | "eigrp" | "rip";
  ad?: number;
}

export interface FirewallRule {
  id: number;
  name: string;
  srcZone: string;
  dstZone: string;
  srcNet?: string;
  dstNet?: string;
  service?: string;
  action: "allow" | "deny" | "drop";
  log?: boolean;
}

export interface VlanEntry {
  id: number;
  name: string;
  active: boolean;
  interfaces?: string[];
}

export interface DeviceState {
  type: DeviceType;
  hostname: string;
  interfaces: Record<string, NetworkInterface>;
  routes: RouteEntry[];
  vlans: Record<number, VlanEntry>;
  firewallRules: FirewallRule[];
  users: Array<{ username: string; role: string; password: string }>;
  ntp?: string;
  dns?: string[];
  domain?: string;
  enablePassword?: string;
  bannerMotd?: string;
  sshEnabled?: boolean;
  // OS-specific
  osVersion?: string;
  model?: string;
  // Windows specific
  windowsConfig?: {
    computerName: string;
    workgroup: string;
    adapters: Array<{
      name: string;
      ip?: string;
      mask?: string;
      gateway?: string;
      dns?: string[];
      dhcp: boolean;
    }>;
  };
  // Linux specific
  linuxConfig?: {
    user: string;
    distro: string;
    sudo: boolean;
  };
  // MikroTik specific
  mikrotikConfig?: {
    identity: string;
    bridges: string[];
  };
}

// ──────────────────────────────────────────────────────────────
// Device metadata (icon, color, default model, default OS)
// ──────────────────────────────────────────────────────────────
export const DEVICE_META: Record<DeviceType, {
  label: string;
  vendor: string;
  model: string;
  osLabel: string;
  color: string;
  bgColor: string;
  promptStyle: "cisco_ios" | "asa" | "nxos" | "sophos" | "panos" | "fortigate" | "junos" | "aruba" | "mikrotik" | "bash" | "windows" | "generic";
  iconType: "router" | "switch" | "firewall" | "pc" | "server" | "cloud" | "nexus";
  defaultInterfaces: string[];
}> = {
  cisco_router: {
    label: "Cisco IOS Router",
    vendor: "Cisco",
    model: "ISR 4331",
    osLabel: "Cisco IOS XE 17.x",
    color: "#58a6ff",
    bgColor: "#1f2f3f",
    promptStyle: "cisco_ios",
    iconType: "router",
    defaultInterfaces: ["GigabitEthernet0/0/0", "GigabitEthernet0/0/1", "GigabitEthernet0/0/2", "Loopback0"],
  },
  cisco_switch: {
    label: "Cisco Catalyst Switch",
    vendor: "Cisco",
    model: "WS-C2960X-48TD",
    osLabel: "Cisco IOS 15.2",
    color: "#3fb950",
    bgColor: "#1a2f1a",
    promptStyle: "cisco_ios",
    iconType: "switch",
    defaultInterfaces: ["FastEthernet0/1", "FastEthernet0/2", "FastEthernet0/3", "FastEthernet0/4", "GigabitEthernet0/1", "GigabitEthernet0/2", "Vlan1"],
  },
  cisco_asa: {
    label: "Cisco ASA Firewall",
    vendor: "Cisco",
    model: "ASA 5506-X",
    osLabel: "Cisco ASA 9.16",
    color: "#f85149",
    bgColor: "#2f0f0f",
    promptStyle: "asa",
    iconType: "firewall",
    defaultInterfaces: ["GigabitEthernet1/1", "GigabitEthernet1/2", "GigabitEthernet1/3", "Management1/1"],
  },
  cisco_nexus: {
    label: "Cisco Nexus (NX-OS)",
    vendor: "Cisco",
    model: "Nexus 9300",
    osLabel: "Cisco NX-OS 10.x",
    color: "#d2a8ff",
    bgColor: "#2a1f3f",
    promptStyle: "nxos",
    iconType: "nexus",
    defaultInterfaces: ["Ethernet1/1", "Ethernet1/2", "Ethernet1/3", "Ethernet1/4", "mgmt0"],
  },
  sophos_xg: {
    label: "Sophos XG Firewall",
    vendor: "Sophos",
    model: "XGS 3300",
    osLabel: "SFOS 20.x",
    color: "#00a3e0",
    bgColor: "#0f2030",
    promptStyle: "sophos",
    iconType: "firewall",
    defaultInterfaces: ["Port1", "Port2", "Port3", "Port4"],
  },
  palo_alto: {
    label: "Palo Alto Firewall",
    vendor: "Palo Alto Networks",
    model: "PA-3260",
    osLabel: "PAN-OS 11.x",
    color: "#fa4616",
    bgColor: "#2f1510",
    promptStyle: "panos",
    iconType: "firewall",
    defaultInterfaces: ["ethernet1/1", "ethernet1/2", "ethernet1/3", "management"],
  },
  fortinet: {
    label: "FortiGate Firewall",
    vendor: "Fortinet",
    model: "FortiGate 600E",
    osLabel: "FortiOS 7.4",
    color: "#ee2c1e",
    bgColor: "#2f0f0f",
    promptStyle: "fortigate",
    iconType: "firewall",
    defaultInterfaces: ["port1", "port2", "port3", "port4", "mgmt"],
  },
  juniper: {
    label: "Juniper Router/Switch",
    vendor: "Juniper Networks",
    model: "MX204",
    osLabel: "Junos OS 23.4",
    color: "#84b135",
    bgColor: "#1a2310",
    promptStyle: "junos",
    iconType: "router",
    defaultInterfaces: ["ge-0/0/0", "ge-0/0/1", "ge-0/0/2", "lo0"],
  },
  aruba: {
    label: "Aruba OS Switch",
    vendor: "Aruba (HPE)",
    model: "Aruba 2930F",
    osLabel: "ArubaOS-Switch 16.x",
    color: "#f77f00",
    bgColor: "#2f1f00",
    promptStyle: "aruba",
    iconType: "switch",
    defaultInterfaces: ["1/1/1", "1/1/2", "1/1/3", "1/1/4", "1/1/5"],
  },
  mikrotik: {
    label: "MikroTik RouterOS",
    vendor: "MikroTik",
    model: "RB4011",
    osLabel: "RouterOS 7.x",
    color: "#cc0000",
    bgColor: "#2f0000",
    promptStyle: "mikrotik",
    iconType: "router",
    defaultInterfaces: ["ether1", "ether2", "ether3", "ether4", "ether5"],
  },
  windows_pc: {
    label: "Windows PC",
    vendor: "Microsoft",
    model: "Windows 11",
    osLabel: "Windows 11 22H2",
    color: "#00adef",
    bgColor: "#0f1f2f",
    promptStyle: "windows",
    iconType: "pc",
    defaultInterfaces: ["Ethernet Adapter", "Wi-Fi Adapter"],
  },
  linux_server: {
    label: "Linux Server/PC",
    vendor: "Linux",
    model: "Ubuntu Server",
    osLabel: "Ubuntu 22.04 LTS",
    color: "#e95420",
    bgColor: "#2f1505",
    promptStyle: "bash",
    iconType: "server",
    defaultInterfaces: ["eth0", "eth1", "lo"],
  },
  generic_switch: {
    label: "Generic L2 Switch",
    vendor: "Generic",
    model: "8-port Switch",
    osLabel: "Generic Switch OS",
    color: "#8b949e",
    bgColor: "#1a1a1a",
    promptStyle: "generic",
    iconType: "switch",
    defaultInterfaces: ["port1", "port2", "port3", "port4", "port5", "port6", "port7", "port8"],
  },
  cloud_router: {
    label: "Cloud / Internet",
    vendor: "Simulated",
    model: "Cloud Gateway",
    osLabel: "Simulated Internet",
    color: "#8b949e",
    bgColor: "#1a1a2a",
    promptStyle: "bash",
    iconType: "cloud",
    defaultInterfaces: ["wan0"],
  },
};

// ──────────────────────────────────────────────────────────────
// Build default device state
// ──────────────────────────────────────────────────────────────
export function buildDeviceState(type: DeviceType, hostname?: string): DeviceState {
  const meta = DEVICE_META[type];
  const defaultHostname = hostname || meta.label.split(" ")[1] || "Device";

  const interfaces: Record<string, NetworkInterface> = {};
  meta.defaultInterfaces.forEach((name, i) => {
    interfaces[name] = {
      name,
      status: i === 0 ? "up" : "down",
      mac: generateMac(),
      speed: name.toLowerCase().includes("gigabit") || name.toLowerCase().includes("ge") ? "1000" : "100",
      duplex: "auto",
      mtu: 1500,
    };
  });

  const baseState: DeviceState = {
    type,
    hostname: defaultHostname,
    interfaces,
    routes: [],
    vlans: { 1: { id: 1, name: "default", active: true } },
    firewallRules: [],
    users: [{ username: "admin", role: "administrator", password: "admin" }],
    enablePassword: "cisco",
    osVersion: meta.osLabel,
    model: meta.model,
    sshEnabled: false,
    dns: ["8.8.8.8", "8.8.4.4"],
  };

  if (type === "windows_pc") {
    baseState.windowsConfig = {
      computerName: hostname || "PC1",
      workgroup: "WORKGROUP",
      adapters: meta.defaultInterfaces.map((name) => ({ name, dhcp: true })),
    };
  }

  if (type === "linux_server") {
    baseState.linuxConfig = {
      user: "ubuntu",
      distro: "Ubuntu 22.04 LTS",
      sudo: true,
    };
  }

  if (type === "cisco_asa") {
    // ASA zones
    Object.values(interfaces).forEach((iface, i) => {
      iface.zone = i === 0 ? "outside" : i === 1 ? "inside" : "dmz";
    });
    baseState.firewallRules = [
      { id: 1, name: "inside-to-outside", srcZone: "inside", dstZone: "outside", action: "allow", log: true },
      { id: 2, name: "outside-to-inside-deny", srcZone: "outside", dstZone: "inside", action: "deny" },
    ];
  }

  if (type === "sophos_xg" || type === "palo_alto" || type === "fortinet") {
    Object.values(interfaces).forEach((iface, i) => {
      iface.zone = i === 0 ? "WAN" : i === 1 ? "LAN" : "DMZ";
    });
    baseState.firewallRules = [
      { id: 1, name: "LAN_to_WAN", srcZone: "LAN", dstZone: "WAN", service: "ANY", action: "allow", log: true },
      { id: 2, name: "WAN_to_LAN_deny", srcZone: "WAN", dstZone: "LAN", action: "deny" },
    ];
  }

  return baseState;
}

function generateMac(): string {
  return Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, "0")
  ).join(":");
}

// ──────────────────────────────────────────────────────────────
// Running-config generators per vendor
// ──────────────────────────────────────────────────────────────
export function generateRunningConfig(state: DeviceState): string {
  switch (state.type) {
    case "cisco_router":
    case "cisco_switch":
      return generateCiscoConfig(state);
    case "cisco_asa":
      return generateAsaConfig(state);
    case "cisco_nexus":
      return generateNxosConfig(state);
    case "sophos_xg":
      return generateSophosConfig(state);
    case "palo_alto":
      return generatePanosConfig(state);
    case "fortinet":
      return generateFortiConfig(state);
    case "juniper":
      return generateJunosConfig(state);
    case "aruba":
      return generateArubaConfig(state);
    case "mikrotik":
      return generateMikrotikConfig(state);
    case "linux_server":
    case "cloud_router":
      return generateLinuxConfig(state);
    case "windows_pc":
      return generateWindowsConfig(state);
    default:
      return `! ${state.hostname} configuration\n! ${state.osVersion}\n`;
  }
}

function generateCiscoConfig(s: DeviceState): string {
  const lines = ["!", "version 15.2", "!", `hostname ${s.hostname}`, "!"];
  if (s.enablePassword) lines.push(`enable secret 5 ${btoa(s.enablePassword)}`);
  if (s.bannerMotd) lines.push(`banner motd ^${s.bannerMotd}^`);
  Object.entries(s.vlans).forEach(([id, v]) => {
    if (Number(id) > 1 && Number(id) < 1002) {
      lines.push(`vlan ${id}`, ` name ${v.name}`, "!");
    }
  });
  Object.entries(s.interfaces).forEach(([name, i]) => {
    lines.push(`interface ${name}`);
    if (i.description) lines.push(` description ${i.description}`);
    if (i.ip && i.mask) lines.push(` ip address ${i.ip} ${i.mask}`);
    if (i.mode === "access") {
      lines.push(` switchport mode access`);
      if (i.vlan) lines.push(` switchport access vlan ${i.vlan}`);
    } else if (i.mode === "trunk") lines.push(` switchport mode trunk`);
    if (i.status === "admin-down") lines.push(` shutdown`);
    lines.push("!");
  });
  s.routes.forEach((r) => lines.push(`ip route ${r.network} ${r.mask} ${r.nextHop || r.interface}`));
  if (s.sshEnabled) lines.push("!", "ip ssh version 2", "line vty 0 15", " transport input ssh");
  lines.push("!", "end");
  return lines.join("\n");
}

function generateAsaConfig(s: DeviceState): string {
  const lines = [": Saved", ":", `ASA Version ${s.osVersion?.split(" ").pop() || "9.16"}`, "!", `hostname ${s.hostname}`, "!"];
  Object.entries(s.interfaces).forEach(([name, i]) => {
    lines.push(`interface ${name}`);
    if (i.description) lines.push(` nameif ${i.zone || "unnamed"}`);
    if (i.ip && i.mask) lines.push(` ip address ${i.ip} ${i.mask}`);
    const sec = i.zone === "inside" ? 100 : i.zone === "dmz" ? 50 : 0;
    lines.push(` security-level ${sec}`);
    if (i.status !== "admin-down") lines.push(` no shutdown`);
    lines.push("!");
  });
  lines.push("!", "access-list OUTSIDE_IN extended deny ip any any", "!");
  s.firewallRules.forEach((r) => {
    lines.push(`access-list ${r.srcZone.toUpperCase()}_TO_${r.dstZone.toUpperCase()} extended ${r.action} ip ${r.srcNet || "any"} ${r.dstNet || "any"}`);
  });
  lines.push("!", ": end");
  return lines.join("\n");
}

function generateNxosConfig(s: DeviceState): string {
  const lines = [`!Command: show running-config`, `!Running configuration last done at:`, `!Time:`, `version ${s.osVersion}`, `hostname ${s.hostname}`];
  lines.push("feature interface-vlan", "feature lacp", "!");
  Object.entries(s.vlans).forEach(([id, v]) => {
    lines.push(`vlan ${id}`, `  name ${v.name}`);
  });
  Object.entries(s.interfaces).forEach(([name, i]) => {
    lines.push(`interface ${name}`);
    if (i.description) lines.push(`  description ${i.description}`);
    if (i.ip && i.mask) lines.push(`  ip address ${i.ip}/${maskToCidr(i.mask)}`);
    if (i.status === "up") lines.push(`  no shutdown`);
    else lines.push(`  shutdown`);
  });
  return lines.join("\n");
}

function generateSophosConfig(s: DeviceState): string {
  return [
    `# Sophos Firewall Configuration`,
    `# Model: ${s.model}`,
    `# SFOS Version: ${s.osVersion}`,
    `# Hostname: ${s.hostname}`,
    ``,
    `[System]`,
    `Hostname = ${s.hostname}`,
    ``,
    `[NetworkInterfaces]`,
    ...Object.entries(s.interfaces).map(([name, i]) =>
      `${name}: IP=${i.ip || "DHCP"} Zone=${i.zone || "LAN"} Status=${i.status}`
    ),
    ``,
    `[FirewallRules]`,
    ...s.firewallRules.map((r) =>
      `Rule${r.id}: ${r.name} src=${r.srcZone} dst=${r.dstZone} action=${r.action}`
    ),
  ].join("\n");
}

function generatePanosConfig(s: DeviceState): string {
  return [
    `set deviceconfig system hostname ${s.hostname}`,
    ``,
    ...Object.entries(s.interfaces).map(([name, i]) =>
      `set network interface ethernet ${name} layer3 ip ${i.ip || "0.0.0.0"}/${maskToCidr(i.mask || "255.255.255.0")}`
    ),
    ``,
    ...s.firewallRules.map((r) =>
      `set rulebase security rules "${r.name}" from ${r.srcZone} to ${r.dstZone} action ${r.action}`
    ),
  ].join("\n");
}

function generateFortiConfig(s: DeviceState): string {
  return [
    `config system global`,
    `    set hostname ${s.hostname}`,
    `end`,
    ``,
    ...Object.entries(s.interfaces).flatMap(([name, i]) => [
      `config system interface`,
      `    edit "${name}"`,
      `        set role ${i.zone?.toLowerCase() || "lan"}`,
      i.ip ? `        set ip ${i.ip} ${i.mask || "255.255.255.0"}` : `        set mode dhcp`,
      `    next`,
      `end`,
    ]),
    ``,
    `config firewall policy`,
    ...s.firewallRules.flatMap((r, idx) => [
      `    edit ${idx + 1}`,
      `        set name "${r.name}"`,
      `        set srcintf "${r.srcZone}"`,
      `        set dstintf "${r.dstZone}"`,
      `        set action ${r.action}`,
      `    next`,
    ]),
    `end`,
  ].join("\n");
}

function generateJunosConfig(s: DeviceState): string {
  return [
    `## Generated by Junos simulator`,
    `## Model: ${s.model}`,
    ``,
    `system {`,
    `    host-name ${s.hostname};`,
    `}`,
    `interfaces {`,
    ...Object.entries(s.interfaces).flatMap(([name, i]) => [
      `    ${name} {`,
      i.ip ? `        unit 0 { family inet { address ${i.ip}/${maskToCidr(i.mask || "255.255.255.0")}; } }` : `        unit 0 { family inet; }`,
      `    }`,
    ]),
    `}`,
    `routing-options {`,
    ...s.routes.map((r) => `    static { route ${r.network}/${maskToCidr(r.mask)} next-hop ${r.nextHop}; }`),
    `}`,
  ].join("\n");
}

function generateArubaConfig(s: DeviceState): string {
  return [
    `; Configuration for ${s.hostname}`,
    `; Aruba OS-Switch ${s.osVersion}`,
    ``,
    `hostname "${s.hostname}"`,
    ``,
    ...Object.entries(s.interfaces).map(([name, i]) =>
      `interface ${name}${i.ip ? `\n  ip address ${i.ip} ${i.mask}` : ""}\n  ${i.status === "up" ? "enable" : "disable"}`
    ),
    ``,
    ...Object.entries(s.vlans).map(([id, v]) => `vlan ${id}\n  name "${v.name}"`),
  ].join("\n");
}

function generateMikrotikConfig(s: DeviceState): string {
  return [
    `# ${s.hostname} - MikroTik RouterOS ${s.osVersion}`,
    `/system identity`,
    `set name=${s.hostname}`,
    ``,
    `/ip address`,
    ...Object.entries(s.interfaces)
      .filter(([, i]) => i.ip)
      .map(([name, i]) => `add address=${i.ip}/${maskToCidr(i.mask || "255.255.255.0")} interface=${name}`),
    ``,
    `/ip route`,
    ...s.routes.map((r) => `add dst-address=${r.network}/${maskToCidr(r.mask)} gateway=${r.nextHop}`),
    ``,
    `/ip dns`,
    s.dns ? `set servers=${s.dns.join(",")}` : "",
  ].join("\n");
}

function generateLinuxConfig(s: DeviceState): string {
  return [
    `# Network Configuration - ${s.hostname}`,
    `# ${s.osVersion}`,
    ``,
    ...Object.entries(s.interfaces).flatMap(([name, i]) => [
      `# Interface: ${name}`,
      i.dhcp ? `ip link set ${name} up && dhclient ${name}` : `ip addr add ${i.ip}/${maskToCidr(i.mask || "255.255.255.0")} dev ${name}`,
      i.status !== "up" ? `ip link set ${name} down` : `ip link set ${name} up`,
    ]),
    ``,
    ...s.routes.map((r) => `ip route add ${r.network}/${maskToCidr(r.mask)} via ${r.nextHop}`),
  ].join("\n");
}

function generateWindowsConfig(s: DeviceState): string {
  if (!s.windowsConfig) return "";
  return [
    `# Windows Network Configuration`,
    `# Computer: ${s.windowsConfig.computerName}`,
    ``,
    ...s.windowsConfig.adapters.flatMap((a) => [
      `# Adapter: ${a.name}`,
      a.dhcp
        ? `netsh interface ip set address "${a.name}" dhcp`
        : `netsh interface ip set address "${a.name}" static ${a.ip} ${a.mask} ${a.gateway}`,
      a.dns?.length ? `netsh interface ip set dns "${a.name}" static ${a.dns[0]}` : "",
    ]),
  ].join("\n");
}

// ──────────────────────────────────────────────────────────────
// Utility
// ──────────────────────────────────────────────────────────────
export function maskToCidr(mask: string): number {
  return mask
    .split(".")
    .reduce((acc, octet) => acc + parseInt(octet).toString(2).split("").filter((b) => b === "1").length, 0);
}

export function cidrToMask(cidr: number): string {
  const mask = [];
  for (let i = 0; i < 4; i++) {
    const bits = Math.min(8, Math.max(0, cidr - i * 8));
    mask.push(256 - Math.pow(2, 8 - bits));
  }
  return mask.join(".");
}

// ──────────────────────────────────────────────────────────────
// CLI command processors — one per vendor style
// Returns: { output: string[], nextMode?: string, stateUpdate?: Partial<DeviceState> }
// ──────────────────────────────────────────────────────────────
export interface CommandResult {
  output: string[];
  error?: boolean;
  stateUpdate?: Partial<DeviceState>;
  nextMode?: string;
}

// Helper
function ok(lines: string[]): CommandResult { return { output: lines }; }
function err(msg: string): CommandResult { return { output: [msg], error: true }; }

// ── CISCO IOS / IOS XE ────────────────────────────────────────
export function processCiscoCommand(
  raw: string,
  mode: string,
  state: DeviceState,
  context: { iface?: string; vlan?: number }
): CommandResult {
  const parts = raw.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const rest = parts.slice(1);

  if (mode === "user_exec") {
    if (cmd === "enable") return { output: ["Password: "], nextMode: "await_enable_password" };
    if (cmd === "show") return processCiscoShow(rest, state);
    if (cmd === "ping") return simulatePing(rest[0], state);
    if (cmd === "traceroute" || cmd === "trace") return simulateTraceroute(rest[0]);
    if (cmd === "?") return ok(["enable", "show", "ping", "traceroute", "exit", "logout"].map((c) => `  ${c}`));
    if (cmd === "exit" || cmd === "logout") return { output: ["Goodbye."], nextMode: "disconnected" };
    return err(`% Unknown command: ${cmd}`);
  }

  if (mode === "privileged_exec") {
    if (cmd === "configure" || (cmd === "conf" && rest[0]?.startsWith("t"))) return { output: ["Enter configuration commands, one per line.  End with CNTL/Z."], nextMode: "global_config" };
    if (cmd === "show") return processCiscoShow(rest, state);
    if (cmd === "ping") return simulatePing(rest[0], state);
    if (cmd === "traceroute" || cmd === "trace") return simulateTraceroute(rest[0]);
    if (cmd === "write" || (cmd === "copy" && rest.join(" ").includes("startup"))) return ok(["Building configuration...", "[OK]"]);
    if (cmd === "reload") return ok(["System bootstrap, Version 17.3", "System restarted."]);
    if (cmd === "debug") return ok([`Debugging ${rest.join(" ")} is ON`]);
    if (cmd === "clear") return ok([""]);
    if (cmd === "disable") return { output: [], nextMode: "user_exec" };
    if (cmd === "exit") return { output: [], nextMode: "user_exec" };
    if (cmd === "?") return ok([...["configure terminal", "show", "ping", "traceroute", "write", "debug", "reload", "disable"].map((c) => `  ${c}`)]);
    return err(`% Invalid input detected at '^' marker.`);
  }

  if (mode === "global_config") {
    if (cmd === "end") return { output: ["%SYS-5-CONFIG_I: Configured from console"], nextMode: "privileged_exec" };
    if (cmd === "exit") return { output: [], nextMode: "privileged_exec" };
    if (cmd === "hostname" && rest[0]) {
      return { output: [], stateUpdate: { hostname: rest[0] } };
    }
    if (cmd === "interface" || cmd === "int") {
      const ifaceName = normalizeIfaceName(rest.join(" "));
      return { output: [], nextMode: "interface_config", stateUpdate: { _ctx_iface: ifaceName } as any };
    }
    if (cmd === "vlan" && rest[0]) {
      const vlanId = parseInt(rest[0]);
      if (!isNaN(vlanId)) return { output: [], nextMode: "vlan_config", stateUpdate: { _ctx_vlan: vlanId } as any };
    }
    if (cmd === "ip" && rest[0] === "route") {
      if (rest.length >= 4) {
        const newRoute: RouteEntry = { network: rest[1], mask: rest[2], nextHop: rest[3], protocol: "static", ad: 1 };
        return { output: [], stateUpdate: { routes: [...state.routes, newRoute] } };
      }
    }
    if (cmd === "do") {
      if (rest[0]?.toLowerCase() === "show") return processCiscoShow(rest.slice(1), state);
    }
    if (cmd === "no") {
      if (rest[0] === "ip" && rest[1] === "route") {
        return { output: [], stateUpdate: { routes: state.routes.filter((r) => r.network !== rest[2]) } };
      }
    }
    if (cmd === "enable" && rest[0] === "secret") {
      return { output: [], stateUpdate: { enablePassword: rest.slice(1).join(" ") } };
    }
    if (cmd === "ip" && rest[0] === "domain-name") {
      return { output: [], stateUpdate: { domain: rest[1] } };
    }
    if (cmd === "crypto" && rest[0] === "key") {
      return ok(["% Generating 2048 bit RSA keys, keys will be non-exportable...", "[OK] (elapsed time was 2 seconds)"]);
    }
    if (cmd === "ip" && rest[0] === "ssh" && rest[1] === "version") {
      return { output: [], stateUpdate: { sshEnabled: true } };
    }
    if (cmd === "ntp" && rest[0] === "server") {
      return { output: [], stateUpdate: { ntp: rest[1] } };
    }
    if (cmd === "banner" && rest[0] === "motd") {
      return { output: [], stateUpdate: { bannerMotd: rest.slice(2).join(" ") } };
    }
    if (cmd === "service" && rest[0] === "password-encryption") return ok([""]);
    if (cmd === "username") return ok([""]); // simplified
    if (cmd === "line") return { output: [], nextMode: "line_config" };
    if (cmd === "spanning-tree") return ok([""]);
    if (cmd === "?") return ok(GLOBAL_CISCO_COMMANDS.map((c) => `  ${c}`));
    return err(`% Invalid input detected at '^' marker.`);
  }

  if (mode === "interface_config" && context.iface) {
    const iface = { ...(state.interfaces[context.iface] || {}) } as NetworkInterface;
    if (cmd === "end") return { output: ["%SYS-5-CONFIG_I: Configured from console"], nextMode: "privileged_exec" };
    if (cmd === "exit") return { output: [], nextMode: "global_config" };
    if (cmd === "ip" && rest[0] === "address") {
      iface.ip = rest[1]; iface.mask = rest[2];
      return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface } } };
    }
    if (cmd === "no" && rest[0] === "ip" && rest[1] === "address") {
      delete iface.ip; delete iface.mask;
      return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface } } };
    }
    if (cmd === "no" && rest[0] === "shutdown") {
      iface.status = "up";
      return {
        output: [`%LINK-3-UPDOWN: Interface ${context.iface}, changed state to up`, `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${context.iface}, changed state to up`],
        stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface } },
      };
    }
    if (cmd === "shutdown") {
      iface.status = "admin-down";
      return {
        output: [`%LINK-5-CHANGED: Interface ${context.iface}, changed state to administratively down`],
        stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface } },
      };
    }
    if (cmd === "description") { iface.description = rest.join(" "); return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface } } }; }
    if (cmd === "switchport" && rest[0] === "mode" && rest[1] === "access") { iface.mode = "access"; return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface } } }; }
    if (cmd === "switchport" && rest[0] === "mode" && rest[1] === "trunk") { iface.mode = "trunk"; return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface } } }; }
    if (cmd === "switchport" && rest[0] === "access" && rest[1] === "vlan") {
      iface.vlan = parseInt(rest[2]); iface.mode = "access";
      const newVlans = { ...state.vlans };
      if (!newVlans[iface.vlan]) newVlans[iface.vlan] = { id: iface.vlan, name: `VLAN${String(iface.vlan).padStart(4, "0")}`, active: true };
      return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface }, vlans: newVlans } };
    }
    if (cmd === "duplex") { iface.duplex = rest[0]; return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface } } }; }
    if (cmd === "speed") { iface.speed = rest[0]; return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface } } }; }
    if (cmd === "ip" && rest[0] === "ospf") return ok([""]);
    if (cmd === "ip" && rest[0] === "helper-address") return ok([""]);
    if (cmd === "spanning-tree") return ok([""]);
    if (cmd === "channel-group") return ok([""]);
    if (cmd === "mtu") { iface.mtu = parseInt(rest[0]); return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface } } }; }
    return err(`% Invalid input detected at '^' marker.`);
  }

  if (mode === "vlan_config" && context.vlan !== undefined) {
    if (cmd === "name") {
      const newVlans = { ...state.vlans, [context.vlan]: { ...(state.vlans[context.vlan] || { id: context.vlan, active: true }), name: rest.join(" ") } };
      return { output: [], stateUpdate: { vlans: newVlans } };
    }
    if (cmd === "state" && rest[0] === "suspend") {
      const newVlans = { ...state.vlans, [context.vlan]: { ...(state.vlans[context.vlan]), active: false } };
      return { output: [], stateUpdate: { vlans: newVlans } };
    }
    if (cmd === "end") return { output: [], nextMode: "privileged_exec" };
    if (cmd === "exit") return { output: [], nextMode: "global_config" };
    return ok([""]);
  }

  if (mode === "line_config") {
    if (cmd === "end") return { output: [], nextMode: "privileged_exec" };
    if (cmd === "exit") return { output: [], nextMode: "global_config" };
    if (cmd === "password" || cmd === "login" || cmd === "transport" || cmd === "exec-timeout") return ok([""]);
    return ok([""]);
  }

  return err(`% Unknown mode: ${mode}`);
}

const GLOBAL_CISCO_COMMANDS = [
  "hostname", "interface", "vlan", "ip route", "ip default-gateway",
  "ip domain-name", "crypto key", "ip ssh version", "ntp server",
  "banner motd", "enable secret", "username", "line", "service password-encryption",
  "spanning-tree", "no", "do show", "end", "exit",
];

// ── CISCO ASA ─────────────────────────────────────────────────
export function processAsaCommand(raw: string, mode: string, state: DeviceState, context: { iface?: string }): CommandResult {
  const parts = raw.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const rest = parts.slice(1);

  if (mode === "user_exec") {
    if (cmd === "enable") return { output: ["Password: "], nextMode: "await_enable_password" };
    if (cmd === "show") return processAsaShow(rest, state);
    return err(`ERROR: % Invalid command: ${cmd}`);
  }
  if (mode === "privileged_exec") {
    if (cmd === "configure" || cmd === "conf") return { output: [], nextMode: "global_config" };
    if (cmd === "show") return processAsaShow(rest, state);
    if (cmd === "write" || cmd === "wr") return ok(["Building configuration...", "[OK]"]);
    if (cmd === "exit" || cmd === "disable") return { output: [], nextMode: "user_exec" };
    return err(`ERROR: % Invalid command: ${cmd}`);
  }
  if (mode === "global_config") {
    if (cmd === "end") return { output: [], nextMode: "privileged_exec" };
    if (cmd === "exit") return { output: [], nextMode: "privileged_exec" };
    if (cmd === "hostname") return { output: [], stateUpdate: { hostname: rest[0] } };
    if (cmd === "interface") {
      const ifaceName = rest.join(" ");
      return { output: [], nextMode: "interface_config", stateUpdate: { _ctx_iface: ifaceName } as any };
    }
    if (cmd === "access-list") return ok([""]);
    if (cmd === "nat") return ok([""]);
    if (cmd === "route") {
      const ifName = rest[0], network = rest[1], mask = rest[2], nextHop = rest[3];
      return { output: [], stateUpdate: { routes: [...state.routes, { network, mask, nextHop, protocol: "static", ad: 1 }] } };
    }
    if (cmd === "object" || cmd === "object-group") return ok([""]);
    if (cmd === "policy-map" || cmd === "class-map" || cmd === "service-policy") return ok([""]);
    return err(`ERROR: % Invalid command: ${cmd}`);
  }
  if (mode === "interface_config" && context.iface) {
    if (cmd === "nameif") {
      const iface = { ...(state.interfaces[context.iface] || {}), zone: rest[0] } as NetworkInterface;
      return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface } } };
    }
    if (cmd === "ip" && rest[0] === "address") {
      const iface = { ...(state.interfaces[context.iface] || {}), ip: rest[1], mask: rest[2] } as NetworkInterface;
      return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface } } };
    }
    if (cmd === "security-level") return ok([""]);
    if (cmd === "no" && rest[0] === "shutdown") {
      const iface = { ...(state.interfaces[context.iface] || {}), status: "up" } as NetworkInterface;
      return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface } } };
    }
    if (cmd === "end") return { output: [], nextMode: "privileged_exec" };
    if (cmd === "exit") return { output: [], nextMode: "global_config" };
    return ok([""]);
  }
  return err(`ERROR: % Unexpected command`);
}

function processAsaShow(args: string[], state: DeviceState): CommandResult {
  const sub = args.join(" ").toLowerCase();
  if (sub === "version") return ok(["Cisco Adaptive Security Appliance Software Version 9.16", `Hardware: ${state.model}`, `Hostname: ${state.hostname}`]);
  if (sub.includes("interface") || sub.includes("int")) {
    return ok(Object.entries(state.interfaces).flatMap(([name, i]) => [
      `Interface ${name} "${i.zone || "unnamed"}", is ${i.status === "up" ? "up" : "administratively down"}, line protocol is ${i.status === "up" ? "up" : "down"}`,
      i.ip ? `  IP address ${i.ip}, subnet mask ${i.mask}` : "  IP address unassigned",
    ]));
  }
  if (sub.includes("access-list")) return ok(["access-list OUTSIDE_IN extended deny ip any any"]);
  if (sub.includes("route")) {
    return ok(["Codes: C - connected, S - static, ...", ...state.routes.map((r) => `S    ${r.network}  [1/0] via ${r.nextHop}`)]);
  }
  if (sub.includes("running-config") || sub === "run") return ok(processAsaShow(["version"], state).output.concat(["!", ": end"]));
  return err(`% Invalid show command: show ${args.join(" ")}`);
}

// ── NX-OS ─────────────────────────────────────────────────────
export function processNxosCommand(raw: string, mode: string, state: DeviceState, context: { iface?: string }): CommandResult {
  const parts = raw.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const rest = parts.slice(1);

  if (cmd === "show") {
    const sub = rest.join(" ").toLowerCase();
    if (sub === "version") return ok([`Cisco Nexus Operating System (NX-OS) Software`, `  NXOS: version ${state.osVersion}`, `  Hardware`, `    cisco ${state.model}`]);
    if (sub.includes("interface")) return ok(Object.entries(state.interfaces).flatMap(([name, i]) => [`${name} is ${i.status}`, i.ip ? `  IP address: ${i.ip}/${maskToCidr(i.mask || "255.255.255.0")}` : "  IP address not assigned", ""]));
    if (sub === "vlan") return ok(["VLAN  Name", "----  ----", ...Object.entries(state.vlans).map(([id, v]) => `${id.padEnd(6)}${v.name}`)]);
    if (sub.includes("ip route")) return ok(["IP Route Table for VRF default", ...state.routes.flatMap((r) => [`${r.network}/${maskToCidr(r.mask)}, ubest/mbest: 1/0`, `    *via ${r.nextHop ?? "unknown"}, eth1/1, [1/0]`])]);
    return err(`% Invalid command: show ${rest.join(" ")}`);
  }
  if (cmd === "configure" || cmd === "conf") return { output: ["Enter configuration commands, one per line. End with CTRL-Z."], nextMode: "global_config" };
  if (mode === "global_config") {
    if (cmd === "end") return { output: [], nextMode: "privileged_exec" };
    if (cmd === "hostname") return { output: [], stateUpdate: { hostname: rest[0] } };
    if (cmd === "interface") return { output: [], nextMode: "interface_config", stateUpdate: { _ctx_iface: rest.join(" ") } as any };
    if (cmd === "vlan") return { output: [], nextMode: "vlan_config", stateUpdate: { _ctx_vlan: parseInt(rest[0]) } as any };
    if (cmd === "feature") return ok([""]);
    if (cmd === "ip" && rest[0] === "route") return { output: [], stateUpdate: { routes: [...state.routes, { network: rest[1], mask: cidrToMask(parseInt(rest[2])), nextHop: rest[3], protocol: "static", ad: 1 }] } };
  }
  if (mode === "interface_config" && context.iface) {
    const iface = { ...(state.interfaces[context.iface] || {}) } as NetworkInterface;
    if (cmd === "ip" && rest[0] === "address") {
      const [ip, cidr] = rest[1].split("/");
      iface.ip = ip; iface.mask = cidrToMask(parseInt(cidr));
      return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface } } };
    }
    if (cmd === "no" && rest[0] === "shutdown") { iface.status = "up"; return { output: [`${context.iface} is now up`], stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface } } }; }
    if (cmd === "shutdown") { iface.status = "admin-down"; return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface } } }; }
    if (cmd === "description") { iface.description = rest.join(" "); return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface } } }; }
    if (cmd === "switchport" && rest[0] === "mode") { iface.mode = rest[1] as any; return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [context.iface]: iface } } }; }
    if (cmd === "end") return { output: [], nextMode: "privileged_exec" };
    if (cmd === "exit") return { output: [], nextMode: "global_config" };
  }
  return err(`% Invalid command: ${cmd}`);
}

// ── SOPHOS XG ─────────────────────────────────────────────────
export function processSophosCommand(raw: string, _mode: string, state: DeviceState): CommandResult {
  const parts = raw.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const rest = parts.slice(1);

  if (cmd === "show" || cmd === "get") {
    const sub = rest.join(" ").toLowerCase();
    if (sub.includes("interface") || sub === "network interface") {
      return ok(["Name    Zone    IP Address      Status", "------  ------  --------------  ------",
        ...Object.entries(state.interfaces).map(([name, i]) => `${name.padEnd(8)}${(i.zone || "LAN").padEnd(8)}${(i.ip || "DHCP").padEnd(16)}${i.status === "up" ? "UP" : "DOWN"}`)]);
    }
    if (sub.includes("firewall") || sub.includes("rule")) {
      return ok(["ID  Name              Source  Dest    Action", "---  ----------------  ------  ------  ------",
        ...state.firewallRules.map((r) => `${String(r.id).padEnd(5)}${r.name.padEnd(18)}${r.srcZone.padEnd(8)}${r.dstZone.padEnd(8)}${r.action.toUpperCase()}`)]);
    }
    if (sub.includes("system")) {
      return ok([`Hostname: ${state.hostname}`, `Model: ${state.model}`, `SFOS: ${state.osVersion}`, `Status: Running`]);
    }
    return err(`% Unknown show/get command`);
  }
  if (cmd === "set" || cmd === "add") {
    const sub = rest[0]?.toLowerCase();
    if (sub === "hostname") return { output: [`Hostname set to: ${rest[1]}`], stateUpdate: { hostname: rest[1] } };
    if (sub === "interface") {
      const name = rest[1];
      const ip = rest.find((r) => r.includes("."));
      if (ip && name) {
        const [addr, cidr] = ip.includes("/") ? ip.split("/") : [ip, "24"];
        const iface = { ...(state.interfaces[name] || { name, status: "up" as const }), ip: addr, mask: cidrToMask(parseInt(cidr)) };
        return { output: [`Interface ${name} configured`], stateUpdate: { interfaces: { ...state.interfaces, [name]: iface } } };
      }
    }
    if (sub === "firewall-rule") return ok(["Firewall rule added successfully"]);
    return ok([`${cmd.toUpperCase()} command accepted`]);
  }
  if (cmd === "system-restart") return ok(["System restart initiated..."]);
  if (cmd === "help" || cmd === "?") {
    return ok(["Available commands:", "  show/get interface [name]", "  show/get firewall-rule", "  show system", "  set hostname <name>", "  set interface <name> ip <ip/prefix>", "  add firewall-rule ...", "  system-restart"]);
  }
  return err(`% Unknown command: ${cmd}. Type 'help' for available commands.`);
}

// ── PALO ALTO ─────────────────────────────────────────────────
export function processPanosCommand(raw: string, mode: string, state: DeviceState): CommandResult {
  const parts = raw.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const rest = parts.slice(1);

  if (mode === "operational") {
    if (cmd === "show") {
      const sub = rest.join(" ").toLowerCase();
      if (sub.includes("interface")) {
        return ok(["Name        Zone      IP Address       Status", "----------  --------  ---------------  ------",
          ...Object.entries(state.interfaces).map(([name, i]) => `${name.padEnd(12)}${(i.zone || "unknown").padEnd(10)}${(i.ip || "unset").padEnd(17)}${i.status}`)]);
      }
      if (sub.includes("security")) {
        return ok(["Security policy rules:", ...state.firewallRules.map((r) => `  ${r.name}: ${r.srcZone} -> ${r.dstZone} [${r.action.toUpperCase()}]`)]);
      }
      if (sub.includes("system")) return ok([`Hostname: ${state.hostname}`, `Model: ${state.model}`, `PAN-OS: ${state.osVersion}`, `Uptime: 0:12:34`]);
      if (sub.includes("route")) return ok(["Virtual router: default", ...state.routes.map((r) => `  ${r.network}/${maskToCidr(r.mask)} via ${r.nextHop}`)]);
    }
    if (cmd === "configure") return { output: ["Entering configuration mode"], nextMode: "configure" };
    if (cmd === "ping") return simulatePing(rest[rest.indexOf("host") + 1] || rest[0], state);
    if (cmd === "exit") return { output: ["Exiting..."], nextMode: "disconnected" };
  }
  if (mode === "configure") {
    if (cmd === "set") {
      const path = rest.join(" ");
      if (path.startsWith("deviceconfig system hostname")) {
        return { output: [], stateUpdate: { hostname: rest[rest.length - 1] } };
      }
      if (path.startsWith("network interface ethernet")) {
        const ifaceName = rest[3];
        const ipIdx = rest.indexOf("ip");
        if (ipIdx > 0 && rest[ipIdx + 1]) {
          const [ip, cidr] = rest[ipIdx + 1].split("/");
          const iface = { ...(state.interfaces[ifaceName] || { name: ifaceName, status: "up" as const }), ip, mask: cidrToMask(parseInt(cidr)) };
          return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [ifaceName]: iface } } };
        }
      }
      return ok([""]);
    }
    if (cmd === "commit") return ok(["Commit job enqueued with jobid 1", "Job 1 completed successfully"]);
    if (cmd === "exit") return { output: ["Exiting configuration mode"], nextMode: "operational" };
    if (cmd === "show") return processPanosCommand(`show ${rest.join(" ")}`, "operational", state);
    return ok([""]);
  }
  return err(`Error: Unknown command: ${cmd}`);
}

// ── FORTINET FORTIGATE ────────────────────────────────────────
export function processFortiCommand(raw: string, mode: string, state: DeviceState): CommandResult {
  const parts = raw.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const rest = parts.slice(1);

  if (cmd === "get" || (cmd === "show" && rest[0] !== "full-configuration")) {
    const sub = rest.join(" ").toLowerCase();
    if (sub.includes("interface") || sub.includes("system interface")) {
      return ok(["== [ interface summary ]", ...Object.entries(state.interfaces).map(([name, i]) => `${name}: ip=${i.ip || "unset"} mask=${i.mask || "unset"} zone=${i.zone || "lan"} status=${i.status}`)]);
    }
    if (sub.includes("router") || sub.includes("routing")) return ok(["Routing table:", ...state.routes.map((r) => `S ${r.network}/${maskToCidr(r.mask)} [1/0] via ${r.nextHop}`)]);
    if (sub.includes("system status") || sub.includes("status")) return ok([`Hostname: ${state.hostname}`, `Model: ${state.model}`, `Version: ${state.osVersion}`, `Serial: FGTVM010000000000`]);
    if (sub.includes("firewall policy")) return ok(state.firewallRules.map((r) => `id=${r.id} name="${r.name}" srcintf="${r.srcZone}" dstintf="${r.dstZone}" action=${r.action}`));
    return err(`% Unknown get command`);
  }
  if (cmd === "config") {
    const sub = rest[0]?.toLowerCase();
    if (sub === "system" && rest[1] === "global") return { output: ["config system global (Entering sub-commands...)"], nextMode: "config_block:system_global" };
    if (sub === "system" && rest[1] === "interface") return { output: ["config system interface (Entering sub-commands...)"], nextMode: "config_block:system_interface" };
    if (sub === "router" && rest[1] === "static") return { output: ["config router static (Entering sub-commands...)"], nextMode: "config_block:router_static" };
    if (sub === "firewall" && rest[1] === "policy") return { output: ["config firewall policy (Entering sub-commands...)"], nextMode: "config_block:firewall_policy" };
    return ok([`Entering ${rest.join(" ")} config block...`]);
  }
  if (mode.startsWith("config_block:") || cmd === "set") {
    if (cmd === "set" && rest[0] === "hostname") return { output: [], stateUpdate: { hostname: rest[1] } };
    if (cmd === "end") return { output: [], nextMode: "operational" };
    if (cmd === "next") return ok(["Moving to next entry..."]);
    if (cmd === "edit") return ok([`Editing entry: ${rest[0]}`]);
    if (cmd === "set") return ok([""]);
    if (cmd === "abort") return { output: ["Aborting..."], nextMode: "operational" };
  }
  if (cmd === "execute") {
    if (rest[0] === "ping") return simulatePing(rest[1], state);
    if (rest[0] === "reboot") return ok(["System will reboot..."]);
    if (rest[0] === "backup") return ok(["Backup configuration..."]);
  }
  if (cmd === "diagnose") return ok([`Diagnosis: ${rest.join(" ")} - OK`]);
  if (cmd === "exit") return { output: [], nextMode: "disconnected" };
  if (cmd === "?") return ok(["config  get  show  execute  diagnose  exit"]);
  return err(`% Command parse error: ${cmd}`);
}

// ── JUNIPER JUNOS ─────────────────────────────────────────────
export function processJunosCommand(raw: string, mode: string, state: DeviceState): CommandResult {
  const parts = raw.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const rest = parts.slice(1);

  if (mode === "operational") {
    if (cmd === "show") {
      const sub = rest.join(" ").toLowerCase();
      if (sub === "version") return ok(["Junos: " + state.osVersion, `Model: ${state.model}`, `Hostname: ${state.hostname}`]);
      if (sub.includes("interface")) return ok(Object.entries(state.interfaces).flatMap(([name, i]) => [`${name}: ${i.status}`, i.ip ? `  inet ${i.ip}/${maskToCidr(i.mask || "255.255.255.0")}` : "  inet: not configured", ""]));
      if (sub.includes("route")) return ok(["inet.0: 2 destinations", ...state.routes.flatMap((r) => [`${r.network}/${maskToCidr(r.mask)} *[Static/5] 0d 00:12:34`, `                    > to ${r.nextHop ?? "unknown"}`])]);
      if (sub.includes("bgp") || sub.includes("ospf")) return ok([`${rest.join(" ")} neighbors: 0`]);
      if (sub.includes("configuration")) return ok(generateJunosConfig(state).split("\n"));
    }
    if (cmd === "configure") return { output: ["Entering configuration mode", "[edit]"], nextMode: "configure" };
    if (cmd === "ping") return simulatePing(rest[0], state);
    if (cmd === "request") return ok([`request ${rest.join(" ")} - processed`]);
    if (cmd === "quit" || cmd === "exit") return { output: ["Exiting..."], nextMode: "disconnected" };
  }
  if (mode === "configure") {
    if (cmd === "set") {
      const path = rest.join(" ");
      if (path.startsWith("system host-name")) return { output: [], stateUpdate: { hostname: rest[rest.length - 1] } };
      if (path.startsWith("interfaces")) {
        // set interfaces ge-0/0/0 unit 0 family inet address 192.168.1.1/24
        const ifaceName = rest[1];
        const addrIdx = rest.indexOf("address");
        if (addrIdx > 0) {
          const [ip, cidr] = rest[addrIdx + 1].split("/");
          const iface = { ...(state.interfaces[ifaceName] || { name: ifaceName, status: "up" as const }), ip, mask: cidrToMask(parseInt(cidr || "24")) };
          return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [ifaceName]: iface } } };
        }
      }
      if (path.startsWith("routing-options static route")) {
        const [network, cidr] = rest[3].split("/");
        const nhIdx = rest.indexOf("next-hop");
        if (nhIdx > 0) return { output: [], stateUpdate: { routes: [...state.routes, { network, mask: cidrToMask(parseInt(cidr)), nextHop: rest[nhIdx + 1], protocol: "static", ad: 5 }] } };
      }
      return ok([""]);
    }
    if (cmd === "delete") return ok([""]);
    if (cmd === "commit") return ok(["commit complete"]);
    if (cmd === "rollback") return ok(["rollback complete"]);
    if (cmd === "exit" || cmd === "quit") return { output: ["Exiting configuration mode"], nextMode: "operational" };
    if (cmd === "show") return processJunosCommand(`show ${rest.join(" ")}`, "operational", state);
    if (cmd === "run") return processJunosCommand(rest.join(" "), "operational", state);
  }
  return err(`error: unknown command: ${raw}`);
}

// ── ARUBA OS ──────────────────────────────────────────────────
export function processArubaCommand(raw: string, _mode: string, state: DeviceState): CommandResult {
  const parts = raw.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const rest = parts.slice(1);

  if (cmd === "show") {
    const sub = rest.join(" ").toLowerCase();
    if (sub.includes("interface")) return ok(Object.entries(state.interfaces).map(([name, i]) => `${name.padEnd(12)}: ${i.status.padEnd(12)} ${i.ip || "unassigned"}`));
    if (sub.includes("vlan")) return ok(["VLAN    Name        Status    Ports", "------  ----------  --------  -----", ...Object.entries(state.vlans).map(([id, v]) => `${id.padEnd(8)}${v.name.padEnd(12)}Active    ${(v.interfaces || []).join(", ")}`)]);
    if (sub.includes("version")) return ok([`ArubaOS-Switch ${state.osVersion}`, `Model: ${state.model}`, `Hostname: ${state.hostname}`]);
  }
  if (cmd === "vlan") {
    const vlanId = parseInt(rest[0]);
    if (!isNaN(vlanId)) {
      const newVlans = { ...state.vlans };
      if (!newVlans[vlanId]) newVlans[vlanId] = { id: vlanId, name: `VLAN${vlanId}`, active: true };
      return { output: [], stateUpdate: { vlans: newVlans } };
    }
  }
  if (cmd === "hostname") return { output: [], stateUpdate: { hostname: rest[0] } };
  if (cmd === "interface") {
    const ifaceName = rest[0];
    return { output: [`Entering interface context: ${ifaceName}`], nextMode: `iface:${ifaceName}` };
  }
  if (cmd === "ip" && rest[0] === "route") {
    return { output: [], stateUpdate: { routes: [...state.routes, { network: rest[1], mask: rest[2], nextHop: rest[3], protocol: "static", ad: 1 }] } };
  }
  if (cmd === "no") return ok([""]);
  if (cmd === "write" || cmd === "wr") return ok(["Running configuration saved to startup configuration."]);
  if (cmd === "?" || cmd === "help") return ok(["show  vlan  hostname  interface  ip route  no  write"]);
  return err(`Invalid input: ${cmd}`);
}

// ── MIKROTIK ──────────────────────────────────────────────────
export function processMikrotikCommand(raw: string, _mode: string, state: DeviceState): CommandResult {
  const trimmed = raw.trim();
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();

  if (trimmed.startsWith("/ip address")) {
    const sub = parts.slice(2);
    if (sub[0] === "print") {
      return ok(["Flags: X - disabled, I - invalid, D - dynamic", " #   ADDRESS            NETWORK         INTERFACE",
        ...Object.entries(state.interfaces).filter(([, i]) => !!i.ip).map(([name, i], idx) => ` ${idx}   ${((i.ip ?? "") + "/" + maskToCidr(i.mask || "255.255.255.0")).padEnd(19)}${((i.ip ?? "0.0.0.0").split(".").slice(0, 3).join(".") + ".0").padEnd(16)}${name}`)]);
    }
    if (sub[0] === "add") {
      const addrIdx = sub.indexOf("address") + 1;
      const ifaceIdx = sub.indexOf("interface") + 1;
      if (addrIdx > 0 && ifaceIdx > 0) {
        const [ip, cidr] = sub[addrIdx].split("/");
        const ifaceName = sub[ifaceIdx];
        const iface = { ...(state.interfaces[ifaceName] || { name: ifaceName, status: "up" as const }), ip, mask: cidrToMask(parseInt(cidr)) };
        return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [ifaceName]: iface } } };
      }
    }
  }
  if (trimmed.startsWith("/ip route")) {
    const sub = parts.slice(2);
    if (sub[0] === "print") return ok(["Flags: X - disabled, A - active, D - dynamic", " #  DST-ADDRESS        GATEWAY          DISTANCE", ...state.routes.map((r, i) => ` ${i}  A ${(r.network + "/" + maskToCidr(r.mask)).padEnd(18)} ${r.nextHop}`)]);
    if (sub[0] === "add") {
      const dstIdx = sub.indexOf("dst-address") + 1, gwIdx = sub.indexOf("gateway") + 1;
      if (dstIdx > 0) {
        const [network, cidr] = sub[dstIdx].split("/");
        return { output: [], stateUpdate: { routes: [...state.routes, { network, mask: cidrToMask(parseInt(cidr)), nextHop: sub[gwIdx], protocol: "static", ad: 1 }] } };
      }
    }
  }
  if (trimmed.startsWith("/system identity")) {
    const sub = parts.slice(2);
    if (sub[0] === "print") return ok([`name: ${state.hostname}`]);
    if (sub[0] === "set" && sub[1]?.startsWith("name=")) return { output: [], stateUpdate: { hostname: sub[1].split("=")[1] } };
  }
  if (trimmed.startsWith("/system resource print")) {
    return ok(["uptime: 0d 00:12:34", `version: ${state.osVersion}`, `board-name: ${state.model}`, "architecture-name: arm"]);
  }
  if (trimmed.startsWith("/interface print")) {
    return ok(["Flags: D - dynamic, X - disabled, R - running, S - slave", " #  NAME       TYPE     MTU",
      ...Object.entries(state.interfaces).map(([name, i], idx) => ` ${idx}  R ${name.padEnd(10)}ether    ${i.mtu || 1500}`)]);
  }
  if (cmd === "ping") return simulatePing(parts[1], state);
  if (trimmed === "/quit" || trimmed === "quit") return { output: ["Connection closed."], nextMode: "disconnected" };
  if (trimmed.endsWith("?") || cmd === "?") return ok(["/ip  /interface  /system  /routing  /tool  ping  /quit"]);
  return err(`bad command name ${cmd} (line 1 column 1)`);
}

// ── LINUX BASH ────────────────────────────────────────────────
export function processLinuxCommand(raw: string, state: DeviceState): CommandResult {
  const parts = raw.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const rest = parts.slice(1);

  if (cmd === "ip") {
    const sub = rest[0]?.toLowerCase();
    if (sub === "addr" || sub === "address") {
      return ok(Object.entries(state.interfaces).flatMap(([name, i], idx) => [
        `${idx + 1}: ${name}: <${i.status === "up" ? "UP" : "DOWN"},BROADCAST,MULTICAST> mtu ${i.mtu || 1500}`,
        `    link/ether ${i.mac || "00:00:00:00:00:00"} brd ff:ff:ff:ff:ff:ff`,
        i.ip ? `    inet ${i.ip}/${maskToCidr(i.mask || "255.255.255.0")} scope global ${name}` : "",
      ].filter(Boolean)));
    }
    if (sub === "route") {
      if (rest[1] === "show" || !rest[1]) {
        return ok(["default via 192.168.1.1 dev eth0", ...state.routes.map((r) => `${r.network}/${maskToCidr(r.mask)} via ${r.nextHop}`)]);
      }
      if (rest[1] === "add") {
        const [network, cidr] = rest[2].split("/");
        const viaIdx = rest.indexOf("via");
        return { output: [], stateUpdate: { routes: [...state.routes, { network, mask: cidrToMask(parseInt(cidr)), nextHop: rest[viaIdx + 1], protocol: "static", ad: 0 }] } };
      }
    }
    if (sub === "link") {
      const ifaceName = rest[2];
      if (rest[1] === "set" && ifaceName) {
        const updown = rest[3] === "up" ? "up" : "admin-down";
        const iface = { ...(state.interfaces[ifaceName] || { name: ifaceName }), status: updown as "up" | "admin-down" };
        return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [ifaceName]: iface } } };
      }
    }
    if (sub === "addr" && rest[1] === "add") {
      const [ip, cidr] = rest[2].split("/");
      const devIdx = rest.indexOf("dev");
      if (devIdx > 0) {
        const ifaceName = rest[devIdx + 1];
        const iface = { ...(state.interfaces[ifaceName] || { name: ifaceName, status: "up" as const }), ip, mask: cidrToMask(parseInt(cidr)) };
        return { output: [], stateUpdate: { interfaces: { ...state.interfaces, [ifaceName]: iface } } };
      }
    }
  }
  if (cmd === "ifconfig") {
    if (rest[0] && rest[0] !== "-a") {
      const iface = state.interfaces[rest[0]];
      if (!iface) return err(`${rest[0]}: error fetching interface information: Device not found`);
      return ok([`${rest[0]}: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu ${iface.mtu || 1500}`, iface.ip ? `        inet ${iface.ip}  netmask ${iface.mask}  broadcast 255.255.255.255` : "        inet not assigned", `        ether ${iface.mac || "00:00:00:00:00:00"}  txqueuelen 1000  (Ethernet)`]);
    }
    return ok(Object.entries(state.interfaces).flatMap(([name, i]) => [`${name}: flags=4163<${i.status === "up" ? "UP," : ""}BROADCAST,RUNNING>  mtu ${i.mtu || 1500}`, i.ip ? `        inet ${i.ip}  netmask ${i.mask}` : ""]));
  }
  if (cmd === "ping") {
    const target = rest.find((r) => !r.startsWith("-")) || "127.0.0.1";
    const count = parseInt(rest[rest.indexOf("-c") + 1] || "4");
    const result = simulatePing(target, state);
    return result;
  }
  if (cmd === "traceroute" || cmd === "tracepath") return simulateTraceroute(rest[0]);
  if (cmd === "nslookup" || cmd === "dig") return ok([`Server: ${state.dns?.[0] || "8.8.8.8"}`, `Address: ${state.dns?.[0] || "8.8.8.8"}#53`, "", `Non-authoritative answer:`, `Name: ${rest[0]}`, `Address: 203.0.113.10`]);
  if (cmd === "netstat" || (cmd === "ss" && rest.includes("-tuln"))) return ok(["Proto  Local Address    State", "tcp    0.0.0.0:22      LISTEN", "tcp    0.0.0.0:80      LISTEN"]);
  if (cmd === "hostname") {
    if (rest[0]) return { output: [], stateUpdate: { hostname: rest[0] } };
    return ok([state.hostname]);
  }
  if (cmd === "cat" && rest[0] === "/etc/os-release") return ok([`NAME="${state.linuxConfig?.distro || "Ubuntu"}"`, `VERSION_ID="22.04"`, `PRETTY_NAME="${state.osVersion}"`]);
  if (cmd === "uname") return ok([rest.includes("-a") ? `Linux ${state.hostname} 5.15.0-88-generic #98-Ubuntu SMP Mon Oct 2 15:18:56 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux` : "Linux"]);
  if (cmd === "whoami") return ok([state.linuxConfig?.user || "ubuntu"]);
  if (cmd === "pwd") return ok(["/home/" + (state.linuxConfig?.user || "ubuntu")]);
  if (cmd === "ls") return ok(["Documents  Downloads  Pictures  Videos  network-config.sh"]);
  if (cmd === "sudo") return processLinuxCommand(rest.join(" "), state);
  if (cmd === "systemctl") return ok([`● ${rest[1] || "networking"}.service - System Network Management`, `   Loaded: loaded`, `   Active: active (running)`]);
  if (cmd === "dhclient") return ok([`Sending discover on ${rest[0] || "eth0"}...`, `Received offer from 192.168.1.1`, `Bound to ${rest[0] || "eth0"}: 192.168.1.100`]);
  if (cmd === "arp") return ok(["Address          HWtype  HWaddress           Flags Mask  Iface", "192.168.1.1      ether   00:11:22:33:44:55   C           eth0"]);
  if (cmd === "route") return ok(["Kernel IP routing table", "Destination     Gateway         Genmask         Flags Metric Ref  Use Iface", ...state.routes.map((r) => `${r.network}   ${r.nextHop}   ${r.mask}   UG    0      0    0 eth0`)]);
  if (cmd === "clear") return { output: [], nextMode: "clear" };
  if (cmd === "exit") return { output: ["logout"], nextMode: "disconnected" };
  if (cmd === "echo") return ok([rest.join(" ").replace(/['"]/g, "")]);
  if (cmd === "curl" || cmd === "wget") return ok([`  % Total    % Received % Xferd  Average Speed   Time`, `100   615  100   615    0     0   1892      0 --:--:-- --:--:-- 0:00:00  1892`, `<html>...</html>`]);
  return err(`${cmd}: command not found`);
}

// ── Shared simulation helpers ──────────────────────────────────
function simulatePing(target: string, _state: DeviceState): CommandResult {
  if (!target) return err("% Incomplete command");
  const times = Array.from({ length: 4 }, () => (Math.random() * 10 + 1).toFixed(3));
  return ok([
    `PING ${target}: 56 data bytes`,
    `64 bytes from ${target}: icmp_seq=0 ttl=64 time=${times[0]} ms`,
    `64 bytes from ${target}: icmp_seq=1 ttl=64 time=${times[1]} ms`,
    `64 bytes from ${target}: icmp_seq=2 ttl=64 time=${times[2]} ms`,
    `64 bytes from ${target}: icmp_seq=3 ttl=64 time=${times[3]} ms`,
    `--- ${target} ping statistics ---`,
    `4 packets transmitted, 4 received, 0% packet loss`,
    `round-trip min/avg/max = ${Math.min(...times.map(Number)).toFixed(3)}/${(times.reduce((a, b) => a + Number(b), 0) / 4).toFixed(3)}/${Math.max(...times.map(Number)).toFixed(3)} ms`,
  ]);
}

function simulateTraceroute(target: string): CommandResult {
  if (!target) return err("% Incomplete command");
  return ok([
    `traceroute to ${target}, 30 hops max, 60 byte packets`,
    ` 1  192.168.1.1  1.234 ms  1.101 ms  1.089 ms`,
    ` 2  10.0.0.1  5.432 ms  5.230 ms  5.121 ms`,
    ` 3  ${target}  8.654 ms  8.423 ms  8.312 ms`,
  ]);
}

// ── interface name normalizer ──────────────────────────────────
function normalizeIfaceName(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (lower.startsWith("gi") || lower.startsWith("gigabitethernet")) return "GigabitEthernet" + lower.replace(/^(gi|gigabitethernet)/, "");
  if (lower.startsWith("fa") || lower.startsWith("fastethernet")) return "FastEthernet" + lower.replace(/^(fa|fastethernet)/, "");
  if (lower.startsWith("se") || lower.startsWith("serial")) return "Serial" + lower.replace(/^(se|serial)/, "");
  if (lower.startsWith("lo") && !lower.startsWith("loop")) return "Loopback" + lower.replace(/^lo/, "");
  if (lower.startsWith("loopback")) return "Loopback" + lower.replace(/^loopback/, "");
  if (lower.startsWith("vl")) return "Vlan" + lower.replace(/^vl(an)?/, "");
  if (lower.startsWith("tu") || lower.startsWith("tunnel")) return "Tunnel" + lower.replace(/^(tu|tunnel)/, "");
  return raw;
}

// ── Show commands (IOS shared) ────────────────────────────────
function processCiscoShow(args: string[], state: DeviceState): CommandResult {
  const sub = args.join(" ").toLowerCase().trim();

  if (sub === "version" || sub === "ver") {
    return ok([
      `Cisco IOS Software [${state.osVersion}]`,
      `Technical Support: http://www.cisco.com/techsupport`,
      ``,
      `${state.hostname} uptime is 0 hours, 12 minutes`,
      `System image: flash:ios-xe-17-09.bin`,
      `Processor: ${state.model}`,
      `${Object.keys(state.interfaces).length} interfaces`,
      `Configuration register is 0x2102`,
    ]);
  }
  if (sub === "ip interface brief" || sub === "ip int br" || sub === "ip int b") {
    const header = "Interface              IP-Address      OK? Method Status                Protocol";
    const rows = Object.entries(state.interfaces).map(([name, i]) => {
      const short = name.replace("GigabitEthernet", "Gi").replace("FastEthernet", "Fa").replace("Loopback", "Lo").replace("Serial", "Se");
      const ip = i.ip || "unassigned";
      const status = i.status === "admin-down" ? "administratively down" : i.status;
      const proto = i.status === "up" ? "up" : "down";
      return `${short.padEnd(23)}${ip.padEnd(16)}YES  ${(i.ip ? "manual" : "unset").padEnd(7)}${status.padEnd(22)}${proto}`;
    });
    return ok([header, ...rows]);
  }
  if (sub === "running-config" || sub === "run" || sub === "running") {
    return ok(["Building configuration...", "", "Current configuration:", ...generateCiscoConfig(state).split("\n")]);
  }
  if (sub === "ip route" || sub === "ip rou") {
    return ok([
      "Codes: L-local, C-connected, S-static, R-RIP, D-EIGRP, O-OSPF, B-BGP",
      "Gateway of last resort is not set", "",
      ...state.routes.map((r) => `${r.protocol.toUpperCase().padEnd(2)}   ${r.network} ${r.mask} [${r.ad || 1}/0] via ${r.nextHop}`),
    ]);
  }
  if (sub === "vlan brief" || sub === "vlan" || sub === "vlan br") {
    return ok([
      "VLAN Name                             Status    Ports",
      "---- -------------------------------- --------- -------------------------------",
      ...Object.entries(state.vlans).map(([id, v]) =>
        `${id.padEnd(5)}${v.name.padEnd(33)}${(v.active ? "active" : "act/unsup").padEnd(10)}${(v.interfaces || []).slice(0, 4).join(", ")}`
      ),
    ]);
  }
  if (sub.startsWith("interfaces") || sub === "interfaces brief") {
    return ok(Object.entries(state.interfaces).flatMap(([name, i]) => [
      `${name} is ${i.status === "admin-down" ? "administratively down" : i.status}, line protocol is ${i.status === "up" ? "up" : "down"}`,
      `  Hardware is Gigabit Ethernet, address is ${i.mac || "000b.dead.beef"}`,
      i.ip ? `  Internet address is ${i.ip}/${maskToCidr(i.mask || "255.255.255.0")}` : "",
      `  MTU ${i.mtu || 1500} bytes, BW 1000000 Kbit/sec`,
      `  Duplex ${i.duplex || "auto"}, Speed ${i.speed || "auto"}`,
      "",
    ].filter(Boolean)));
  }
  if (sub === "mac address-table" || sub === "mac addr") {
    return ok(["Mac Address Table", "-------------------------------------------", "Vlan  Mac Address       Type        Ports", "----  -----------       --------    -----", "   1  001b.0de9.2300    DYNAMIC     Gi0/0"]);
  }
  if (sub === "arp") return ok(["Protocol  Address   Age  HW Addr  Type  Interface", ...Object.entries(state.interfaces).filter(([, i]) => i.ip).map(([name, i]) => `Internet  ${i.ip?.padEnd(16)}0    ${i.mac || "001b.dead.beef"}  ARPA  ${name}`)]);
  if (sub === "spanning-tree" || sub === "span") return ok(["VLAN0001  Spanning tree enabled protocol ieee", "  Root ID  Priority 32769", "  Bridge ID Priority 32769", "  Hello Time 2 sec  Max Age 20 sec  Forward Delay 15 sec"]);
  if (sub === "cdp neighbors") return ok(["Capability Codes: R-Router, T-Trans Bridge, S-Switch...", "Device ID  Local Intrfce  Holdtme  Capability  Platform  Port ID"]);
  if (sub === "history") return ok(["Command history available via ↑↓ arrows"]);
  if (sub === "clock") return ok([`*${new Date().toLocaleTimeString("en-US", { hour12: false })} UTC`]);
  if (sub === "users") return ok(["Line  User   Host(s)  Idle  Location", "* 0 con 0  idle  00:00:00"]);
  if (sub === "flash:" || sub === "flash") return ok(["Directory of flash:/", "  1  -rw-  15032320  ios-xe-17.bin", "32514048 bytes total (17481728 bytes free)"]);
  if (sub === "processes cpu") return ok(["CPU utilization for five seconds: 2%/0%; one minute: 1%; five minutes: 1%"]);
  if (sub === "access-lists") return ok(["Standard IP access list 1 (empty)", "Extended IP access list 100 (empty)"]);
  if (sub === "ip ospf neighbor") return ok(["Neighbor ID  Pri  State  Dead Time  Address  Interface"]);
  if (sub === "ip bgp") return ok(["BGP table version is 1, local router ID is 0.0.0.0", "Status codes: s-suppressed, d-damped, h-history, *-valid, >-best"]);
  if (sub === "ip nat translations") return ok(["Pro Inside global  Inside local  Outside local  Outside global"]);
  if (sub === "etherchannel summary") return ok(["Flags: D-down, P-in port-channel, I-stand-alone, H-Hot-standby", "Number of channel-groups in use: 0"]);
  if (sub === "ip protocols") return ok(["Routing Protocol is \"static\"", "  Distance: (default is 1)"]);
  if (sub === "startup-config") return ok(["Using 1024 out of 524288 bytes", "hostname " + state.hostname, "end"]);

  return err(`% Invalid input detected at '^' marker.\n  Type "show ?" for a list of available commands.`);
}

// ──────────────────────────────────────────────────────────────
// Master command dispatcher
// ──────────────────────────────────────────────────────────────
export function dispatchCommand(
  raw: string,
  mode: string,
  state: DeviceState,
  context: { iface?: string; vlan?: number }
): CommandResult {
  switch (state.type) {
    case "cisco_router":
    case "cisco_switch":
      return processCiscoCommand(raw, mode, state, context);
    case "cisco_asa":
      return processAsaCommand(raw, mode, state, context);
    case "cisco_nexus":
      return processNxosCommand(raw, mode, state, context);
    case "sophos_xg":
      return processSophosCommand(raw, mode, state);
    case "palo_alto":
      return processPanosCommand(raw, mode, state);
    case "fortinet":
      return processFortiCommand(raw, mode, state);
    case "juniper":
      return processJunosCommand(raw, mode, state);
    case "aruba":
      return processArubaCommand(raw, mode, state);
    case "mikrotik":
      return processMikrotikCommand(raw, mode, state);
    case "linux_server":
    case "cloud_router":
      return processLinuxCommand(raw, state);
    case "windows_pc":
      return processLinuxCommand(raw, state); // Windows uses its own GUI, but CLI fallback
    default:
      return processLinuxCommand(raw, state);
  }
}

// ──────────────────────────────────────────────────────────────
// Prompt generators per vendor
// ──────────────────────────────────────────────────────────────
export function getPrompt(type: DeviceType, hostname: string, mode: string, context: { iface?: string }): string {
  switch (type) {
    case "cisco_router":
    case "cisco_switch":
    case "cisco_nexus":
      if (mode === "user_exec") return `${hostname}>`;
      if (mode === "privileged_exec") return `${hostname}#`;
      if (mode === "global_config") return `${hostname}(config)#`;
      if (mode === "interface_config") return `${hostname}(config-if)#`;
      if (mode === "vlan_config") return `${hostname}(config-vlan)#`;
      if (mode === "line_config") return `${hostname}(config-line)#`;
      if (mode === "router_config") return `${hostname}(config-router)#`;
      return `${hostname}>`;
    case "cisco_asa":
      if (mode === "user_exec") return `${hostname}>`;
      if (mode === "privileged_exec") return `${hostname}#`;
      if (mode === "global_config") return `${hostname}(config)#`;
      if (mode === "interface_config") return `${hostname}(config-if)#`;
      return `${hostname}>`;
    case "sophos_xg":
      return `${hostname}>`;
    case "palo_alto":
      return mode === "configure" ? `${hostname}# ` : `${hostname}> `;
    case "fortinet":
      return `${hostname} ${mode.startsWith("config_block") ? "(" + mode.split(":")[1] + ")" : ""} #`;
    case "juniper":
      return mode === "configure" ? `${hostname}# ` : `${hostname}> `;
    case "aruba":
      return `${hostname}# `;
    case "mikrotik":
      return `[admin@${hostname}] > `;
    case "linux_server":
    case "cloud_router":
      return `ubuntu@${hostname}:~$ `;
    case "windows_pc":
      return `C:\\Users\\Administrator>`;
    default:
      return `${hostname}>`;
  }
}

// ──────────────────────────────────────────────────────────────
// Boot messages per vendor
// ──────────────────────────────────────────────────────────────
export function getBootMessages(type: DeviceType, state: DeviceState): string[] {
  const meta = DEVICE_META[type];
  switch (type) {
    case "cisco_router":
    case "cisco_switch":
      return [
        "",
        `  Cisco IOS Software, ${meta.osLabel}`,
        `  Copyright (c) 1986-2024 by Cisco Systems, Inc.`,
        `  Model: ${state.model}`,
        "",
        `  Type 'enable' to enter privileged EXEC mode.`,
        `  Type '?' for help at any prompt.`,
        "",
      ];
    case "cisco_asa":
      return [
        "",
        `  Cisco Adaptive Security Appliance Software Version 9.16`,
        `  Device Manager Version 7.18`,
        `  Hardware: ${state.model}, 4096 MB RAM, CPU Atom C3000`,
        "",
        "  Type help or '?' for a list of available commands.",
        "",
      ];
    case "cisco_nexus":
      return [
        "  Cisco Nexus Operating System (NX-OS) Software",
        `  NXOS: version ${meta.osLabel}`,
        `  Hardware: cisco ${state.model}`,
        "",
      ];
    case "sophos_xg":
      return [
        "",
        `  ╔══════════════════════════════════════╗`,
        `  ║    Sophos Firewall ${meta.osLabel}       ║`,
        `  ║    Model: ${(state.model ?? meta.model).padEnd(26)}║`,
        `  ╚══════════════════════════════════════╝`,
        "",
        "  Type 'help' for available commands.",
        "",
      ];
    case "palo_alto":
      return [
        "",
        `  Palo Alto Networks PAN-OS ${meta.osLabel}`,
        `  Model: ${state.model}`,
        `  Hostname: ${state.hostname}`,
        "",
        "  Type 'show system info' for device details.",
        "  Type 'configure' to enter configuration mode.",
        "",
      ];
    case "fortinet":
      return [
        "",
        `  FortiGate ${state.model}`,
        `  FortiOS ${meta.osLabel}`,
        `  Serial: FGTVM010000000000`,
        "",
        "  Type '?' or 'help' for command reference.",
        "",
      ];
    case "juniper":
      return [
        "",
        `  Juniper Networks ${state.model}`,
        `  JUNOS ${meta.osLabel}`,
        "",
        "  {master}",
        `  ${state.hostname}> `,
        "",
      ];
    case "aruba":
      return [
        "",
        `  Aruba Networks - ArubaOS-Switch ${meta.osLabel}`,
        `  Model: ${state.model}`,
        "",
        "  Type 'help' or '?' for assistance.",
        "",
      ];
    case "mikrotik":
      return [
        "  MMM      MMM       KKK                          TTTTTTTTTTT      KKK",
        "  MMMM    MMMM       KKK                          TTTTTTTTTTT      KKK",
        "  MMM MMMM MMM  III  KKK  KKK  RRRRRR    OOO      TTT      III  KKK  KKK",
        "  MMM  MM  MMM  III  KKKKK     RRR  RRR  OOO      TTT      III  KKKKK",
        "  MMM      MMM  III  KKK KKK   RRRRRR   OOO       TTT      III  KKK KKK",
        "  MMM      MMM  III  KKK  KKK  RRR  RRR  OOO      TTT      III  KKK  KKK",
        `  MikroTik RouterOS ${meta.osLabel}  (${state.model})`,
        "",
        `  [admin@${state.hostname}] >`,
        "",
      ];
    case "linux_server":
      return [
        "",
        `  Ubuntu 22.04.3 LTS ${state.hostname} tty1`,
        "",
        `  ${state.hostname} login: ubuntu`,
        "  Password:",
        `  Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-88-generic x86_64)`,
        "",
        `  ubuntu@${state.hostname}:~$`,
        "",
      ];
    case "cloud_router":
      return ["  [Simulated Internet/Cloud Gateway]", `  Hostname: ${state.hostname}`, ""];
    default:
      return [`  ${meta.label} - ${meta.osLabel}`, ""];
  }
}
