"use client";

import * as React from "react";
import {
  Monitor, Wifi, Settings, RefreshCw, CheckCircle2,
  AlertCircle, Server, Globe, Terminal, ChevronRight, Save,
} from "lucide-react";
import type { DeviceState, NetworkInterface } from "@/lib/device-simulator-engine";
import { cidrToMask, maskToCidr } from "@/lib/device-simulator-engine";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
interface WindowsPcSimulatorProps {
  state: DeviceState;
  onStateChange: (updater: (prev: DeviceState) => DeviceState) => void;
  className?: string;
}

type WinTab = "network" | "cmd" | "ipconfig";

// ──────────────────────────────────────────────────────────────
// CMD Terminal for Windows
// ──────────────────────────────────────────────────────────────
function WindowsCmdTerminal({ state, onStateChange }: { state: DeviceState; onStateChange: (updater: (prev: DeviceState) => DeviceState) => void }) {
  const [lines, setLines] = React.useState<Array<{ type: "input" | "output" | "error"; content: string }>>([
    { type: "output", content: "Microsoft Windows [Version 10.0.22621.3155]" },
    { type: "output", content: "(c) Microsoft Corporation. All rights reserved." },
    { type: "output", content: "" },
  ]);
  const [input, setInput] = React.useState("");
  const [history, setHistory] = React.useState<string[]>([]);
  const [histIdx, setHistIdx] = React.useState(-1);
  const termRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [lines]);

  const prompt = `C:\\Users\\${state.windowsConfig?.computerName || "PC1"}> `;

  function processWinCmd(raw: string) {
    const trimmed = raw.trim();
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const rest = parts.slice(1);

    const echo = (content: string, type: "output" | "error" = "output") =>
      ({ type, content } as const);

    function out(lines: string[]) {
      setLines((prev) => [
        ...prev,
        { type: "input", content: `${prompt}${trimmed}` },
        ...lines.map((l) => ({ type: "output" as const, content: l })),
      ]);
    }

    function err(lines: string[]) {
      setLines((prev) => [
        ...prev,
        { type: "input", content: `${prompt}${trimmed}` },
        ...lines.map((l) => ({ type: "error" as const, content: l })),
      ]);
    }

    if (!trimmed) {
      setLines((prev) => [...prev, { type: "input", content: prompt }]);
      return;
    }

    if (cmd === "ipconfig") {
      const showAll = rest.includes("/all");
      const adapterLines: string[] = ["Windows IP Configuration", ""];

      if (showAll) {
        adapterLines.push(`   Host Name . . . . . . . . . . . . : ${state.windowsConfig?.computerName || state.hostname}`);
        adapterLines.push(`   Primary Dns Suffix . . . . . . . : `);
        adapterLines.push(`   Node Type . . . . . . . . . . . . : Hybrid`);
        adapterLines.push(`   IP Routing Enabled. . . . . . . . : No`);
        adapterLines.push(`   WINS Proxy Enabled. . . . . . . . : No`);
        adapterLines.push("");
      }

      Object.entries(state.interfaces).forEach(([name, iface]) => {
        adapterLines.push(`Ethernet adapter ${name}:`);
        adapterLines.push("");
        if (showAll) {
          adapterLines.push(`   Connection-specific DNS Suffix  . : `);
          adapterLines.push(`   Description . . . . . . . . . . . : ${name}`);
          adapterLines.push(`   Physical Address. . . . . . . . . : ${(iface.mac || "00-0C-29-AB-CD-EF").toUpperCase().replace(/:/g, "-")}`);
          adapterLines.push(`   DHCP Enabled. . . . . . . . . . . : ${state.windowsConfig?.adapters.find((a) => a.name === name)?.dhcp ? "Yes" : "No"}`);
        }
        adapterLines.push(`   IPv4 Address. . . . . . . . . . . : ${iface.ip || "169.254.0.1"}`);
        adapterLines.push(`   Subnet Mask . . . . . . . . . . . : ${iface.mask || "255.255.0.0"}`);
        adapterLines.push(`   Default Gateway . . . . . . . . . : ${iface.gateway || ""}`);
        if (showAll && state.dns) {
          adapterLines.push(`   DNS Servers . . . . . . . . . . . : ${state.dns[0] || ""}`);
          if (state.dns[1]) adapterLines.push(`                                       ${state.dns[1]}`);
        }
        adapterLines.push("");
      });
      out(adapterLines);
    } else if (cmd === "ping") {
      const target = rest.find((r) => !r.startsWith("/")) || "127.0.0.1";
      const count = parseInt(rest[rest.indexOf("/n") + 1] || "4");
      out([
        `Pinging ${target} with 32 bytes of data:`,
        `Reply from ${target}: bytes=32 time=1ms TTL=128`,
        `Reply from ${target}: bytes=32 time=1ms TTL=128`,
        `Reply from ${target}: bytes=32 time=1ms TTL=128`,
        `Reply from ${target}: bytes=32 time=1ms TTL=128`,
        "",
        `Ping statistics for ${target}:`,
        `    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`,
        `Approximate round trip times in milli-seconds:`,
        `    Minimum = 1ms, Maximum = 2ms, Average = 1ms`,
      ]);
    } else if (cmd === "tracert") {
      const target = rest[0] || "8.8.8.8";
      out([
        `Tracing route to ${target} over a maximum of 30 hops`,
        "",
        `  1    <1 ms    <1 ms    <1 ms  192.168.1.1`,
        `  2     5 ms     4 ms     4 ms  10.0.0.1`,
        `  3     8 ms     7 ms     8 ms  ${target}`,
        "",
        "Trace complete.",
      ]);
    } else if (cmd === "netstat") {
      out([
        "Active Connections",
        "",
        "  Proto  Local Address          Foreign Address        State",
        "  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING",
        "  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING",
        "  TCP    127.0.0.1:49152        0.0.0.0:0              LISTENING",
      ]);
    } else if (cmd === "arp") {
      out([
        "Interface: 192.168.1.100 --- 0x3",
        "  Internet Address      Physical Address      Type",
        "  192.168.1.1           00-11-22-33-44-55     dynamic",
        "  192.168.1.255         ff-ff-ff-ff-ff-ff     static",
      ]);
    } else if (cmd === "nslookup") {
      const target = rest[0] || "google.com";
      out([
        `Server:  ${state.dns?.[0] || "8.8.8.8"}`,
        `Address:  ${state.dns?.[0] || "8.8.8.8"}`,
        "",
        `Non-authoritative answer:`,
        `Name:    ${target}`,
        `Addresses:  142.250.80.46`,
      ]);
    } else if (cmd === "netsh") {
      const sub = rest.join(" ").toLowerCase();
      if (sub.includes("interface ip set address")) {
        // netsh interface ip set address "Local Area Connection" static 192.168.1.10 255.255.255.0 192.168.1.1
        const quoteMatch = trimmed.match(/"([^"]+)"/);
        const adapterName = quoteMatch ? quoteMatch[1] : rest[3];
        const isStatic = rest.includes("static");
        const isDhcp = rest.includes("dhcp");

        if (isDhcp) {
          // set to DHCP
          const ip = `192.168.1.${Math.floor(Math.random() * 200 + 10)}`;
          const iface = { ...(state.interfaces[adapterName] || { name: adapterName, status: "up" as const }), ip, mask: "255.255.255.0", gateway: "192.168.1.1" };
          onStateChange((prev) => ({ ...prev, interfaces: { ...prev.interfaces, [adapterName]: iface } }));
          out([`IP address of interface "${adapterName}" set to DHCP. Obtained: ${ip}`]);
        } else if (isStatic) {
          const staticIdx = rest.indexOf("static");
          const ip = rest[staticIdx + 1];
          const mask = rest[staticIdx + 2];
          const gw = rest[staticIdx + 3];
          if (ip) {
            const iface = { ...(state.interfaces[adapterName] || { name: adapterName, status: "up" as const }), ip, mask: mask || "255.255.255.0", gateway: gw };
            onStateChange((prev) => ({ ...prev, interfaces: { ...prev.interfaces, [adapterName]: iface } }));
            out([`IP address of interface "${adapterName}" set to ${ip}.`]);
          }
        }
      } else if (sub.includes("interface ip set dns")) {
        const quoteMatch = trimmed.match(/"([^"]+)"/);
        const adapterName = quoteMatch ? quoteMatch[1] : "Local Area Connection";
        const dnsServer = rest[rest.length - 1];
        onStateChange((prev) => ({ ...prev, dns: [dnsServer, ...(prev.dns || []).slice(1)] }));
        out([`DNS of interface "${adapterName}" set to ${dnsServer}.`]);
      } else if (sub.includes("wlan show profiles")) {
        out(["Profiles on interface Wi-Fi:", "    All User Profile     : HomeNetwork", "    All User Profile     : OfficeWiFi"]);
      } else {
        out(["Ok."]);
      }
    } else if (cmd === "hostname") {
      out([state.windowsConfig?.computerName || state.hostname]);
    } else if (cmd === "ver") {
      out(["Microsoft Windows [Version 10.0.22621.3155]"]);
    } else if (cmd === "cls" || cmd === "clear") {
      setLines([]);
    } else if (cmd === "systeminfo") {
      out([
        `Host Name:                 ${state.windowsConfig?.computerName || state.hostname}`,
        `OS Name:                   Microsoft Windows 11 Pro`,
        `OS Version:                10.0.22621 N/A Build 22621`,
        `System Type:               x64-based PC`,
        `Total Physical Memory:     8,192 MB`,
        `Available Physical Memory: 4,096 MB`,
      ]);
    } else if (cmd === "route") {
      if (rest[0]?.toLowerCase() === "print") {
        out([
          "==========================================================================",
          "Interface List",
          " 3...00 0c 29 ab cd ef ......Intel(R) PRO/1000 MT Network Connection",
          "==========================================================================",
          "IPv4 Route Table",
          "===========================================================================",
          "Active Routes:",
          "Network Destination   Netmask          Gateway       Interface  Metric",
          "          0.0.0.0     0.0.0.0      192.168.1.1   192.168.1.100      25",
          "        127.0.0.0     255.0.0.0        On-link       127.0.0.1     331",
          ...state.routes.map((r) => `    ${r.network.padEnd(20)}${r.mask.padEnd(17)}${(r.nextHop || "On-link").padEnd(14)}192.168.1.100      25`),
          "===========================================================================",
        ]);
      } else if (rest[0]?.toLowerCase() === "add") {
        // route add 10.0.0.0 mask 255.0.0.0 192.168.1.1
        const maskIdx = rest.indexOf("mask");
        const network = rest[1];
        const mask = rest[maskIdx + 1];
        const gw = rest[maskIdx + 2];
        onStateChange((prev) => ({ ...prev, routes: [...prev.routes, { network, mask, nextHop: gw, protocol: "static", ad: 0 }] }));
        out(["OK!"]);
      } else {
        out(["Usage: route PRINT | ADD | DELETE | CHANGE"]);
      }
    } else if (cmd === "exit") {
      out(["Session ended."]);
    } else if (cmd === "help" || cmd === "/?") {
      out([
        "Available commands:",
        "  ipconfig [/all]          - Display network configuration",
        "  ping <host> [/n count]   - Test connectivity",
        "  tracert <host>           - Trace route",
        "  netstat                  - Active connections",
        "  arp -a                   - ARP cache",
        "  nslookup <host>          - DNS lookup",
        "  netsh interface ip set address <adapter> static <ip> <mask> <gw>",
        "  netsh interface ip set address <adapter> dhcp",
        "  netsh interface ip set dns <adapter> static <dns>",
        "  route print              - Routing table",
        "  route add <net> mask <mask> <gw>",
        "  hostname                 - Computer name",
        "  systeminfo               - System information",
        "  ver                      - OS version",
        "  cls                      - Clear screen",
      ]);
    } else {
      err([`'${cmd}' is not recognized as an internal or external command,`, `operable program or batch file.`]);
    }

    setHistory((prev) => [...prev.filter((h) => h !== trimmed), trimmed]);
    setHistIdx(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      processWinCmd(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIdx = histIdx < history.length - 1 ? histIdx + 1 : histIdx;
      setHistIdx(newIdx);
      setInput(history[history.length - 1 - newIdx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIdx = histIdx > 0 ? histIdx - 1 : -1;
      setHistIdx(newIdx);
      setInput(newIdx === -1 ? "" : history[history.length - 1 - newIdx] || "");
    } else if (e.ctrlKey && e.key === "c") {
      setInput("");
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0c0c0c] rounded font-mono text-[12px] text-[#cccccc]">
      <div className="flex-1 overflow-y-auto p-3 cursor-text space-y-0" ref={termRef} onClick={() => inputRef.current?.focus()}>
        {lines.map((l, i) => (
          <div key={i} className={l.type === "error" ? "text-[#f85149]" : l.type === "input" ? "text-[#e6edf3]" : "text-[#cccccc]"}>
            {l.content}
          </div>
        ))}
        <div className="flex items-center text-[#e6edf3]">
          <span className="mr-1">{prompt}</span>
          <span>{input}</span>
          <span className="w-2 h-4 bg-[#cccccc] animate-pulse ml-px" />
        </div>
      </div>
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="opacity-0 absolute -z-10 pointer-events-none"
        autoFocus
        spellCheck={false}
        autoComplete="off"
      />
      <div className="px-3 py-1 border-t border-[#333] text-[9px] text-[#666] flex items-center gap-3">
        <span>↑↓ history</span>
        <span>Tab complete</span>
        <span>Ctrl+C break</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Network Adapter Config Panel (GUI-style)
// ──────────────────────────────────────────────────────────────
function AdapterConfigPanel({
  adapterName,
  iface,
  state,
  onSave,
}: {
  adapterName: string;
  iface: NetworkInterface;
  state: DeviceState;
  onSave: (updated: Partial<NetworkInterface & { gateway: string; dns1: string; dns2: string; dhcp: boolean }>) => void;
}) {
  const adapter = state.windowsConfig?.adapters.find((a) => a.name === adapterName);
  const [dhcp, setDhcp] = React.useState(adapter?.dhcp ?? !iface.ip);
  const [ip, setIp] = React.useState(iface.ip || "");
  const [mask, setMask] = React.useState(iface.mask || "255.255.255.0");
  const [gateway, setGateway] = React.useState(iface.gateway || "");
  const [dns1, setDns1] = React.useState(state.dns?.[0] || "8.8.8.8");
  const [dns2, setDns2] = React.useState(state.dns?.[1] || "8.8.4.4");
  const [saved, setSaved] = React.useState(false);

  function handleSave() {
    onSave({ dhcp, ip: dhcp ? undefined : ip, mask: dhcp ? undefined : mask, gateway: dhcp ? undefined : gateway, dns1, dns2 });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inputCls = "w-full px-2.5 py-1.5 rounded-md bg-[#0d1117] border border-[#30363d] text-[#e6edf3] text-[11px] font-mono placeholder-[#8b949e] focus:outline-none focus:border-[#00adef]/50 disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="space-y-4 p-4">
      {/* DHCP Toggle */}
      <div className="rounded-lg border border-[#30363d] overflow-hidden">
        <div className="px-3 py-2 bg-[#161b22] text-[10px] text-[#8b949e] uppercase tracking-wider font-mono">
          IP Settings — {adapterName}
        </div>
        <div className="p-3 space-y-3">
          {/* Radio group */}
          <div className="space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input type="radio" name="ipmode" checked={dhcp} onChange={() => setDhcp(true)}
                className="mt-0.5 accent-[#00adef]" />
              <div>
                <div className="text-[11px] text-[#e6edf3] font-semibold group-hover:text-[#00adef] transition-colors">
                  Obtain an IP address automatically (DHCP)
                </div>
                <div className="text-[9px] text-[#8b949e]">The server will assign an IP address automatically</div>
              </div>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input type="radio" name="ipmode" checked={!dhcp} onChange={() => setDhcp(false)}
                className="mt-0.5 accent-[#00adef]" />
              <div>
                <div className="text-[11px] text-[#e6edf3] font-semibold group-hover:text-[#00adef] transition-colors">
                  Use the following IP address (Static)
                </div>
                <div className="text-[9px] text-[#8b949e]">Manually configure IP address, subnet mask, and gateway</div>
              </div>
            </label>
          </div>

          {/* Static IP fields */}
          <div className={`grid grid-cols-1 gap-2.5 transition-opacity ${dhcp ? "opacity-40 pointer-events-none" : ""}`}>
            <div>
              <label className="block text-[9px] text-[#8b949e] mb-1 font-mono uppercase tracking-wider">IP Address</label>
              <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.100" disabled={dhcp} className={inputCls} />
            </div>
            <div>
              <label className="block text-[9px] text-[#8b949e] mb-1 font-mono uppercase tracking-wider">Subnet Mask</label>
              <input value={mask} onChange={(e) => setMask(e.target.value)} placeholder="255.255.255.0" disabled={dhcp} className={inputCls} />
            </div>
            <div>
              <label className="block text-[9px] text-[#8b949e] mb-1 font-mono uppercase tracking-wider">Default Gateway</label>
              <input value={gateway} onChange={(e) => setGateway(e.target.value)} placeholder="192.168.1.1" disabled={dhcp} className={inputCls} />
            </div>
          </div>
        </div>
      </div>

      {/* DNS */}
      <div className="rounded-lg border border-[#30363d] overflow-hidden">
        <div className="px-3 py-2 bg-[#161b22] text-[10px] text-[#8b949e] uppercase tracking-wider font-mono">
          DNS Servers
        </div>
        <div className="p-3 space-y-2">
          <div>
            <label className="block text-[9px] text-[#8b949e] mb-1 font-mono uppercase tracking-wider">Preferred DNS</label>
            <input value={dns1} onChange={(e) => setDns1(e.target.value)} placeholder="8.8.8.8" className={inputCls} />
          </div>
          <div>
            <label className="block text-[9px] text-[#8b949e] mb-1 font-mono uppercase tracking-wider">Alternate DNS</label>
            <input value={dns2} onChange={(e) => setDns2(e.target.value)} placeholder="8.8.4.4" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full py-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-2 transition-all"
        style={{
          background: saved ? "#3fb950" : "#00adef",
          color: saved ? "#0d1117" : "#fff",
        }}
      >
        {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
        {saved ? "Saved!" : "Apply Settings"}
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// ipconfig output viewer
// ──────────────────────────────────────────────────────────────
function IpconfigView({ state }: { state: DeviceState }) {
  return (
    <div className="p-4 font-mono text-[11px] space-y-4 text-[#cccccc] bg-[#0c0c0c] rounded-lg">
      <div className="text-[#e6edf3] font-bold">Windows IP Configuration</div>
      <div className="text-[#8b949e]">
        Host Name: {state.windowsConfig?.computerName || state.hostname}
      </div>
      {Object.entries(state.interfaces).map(([name, iface]) => (
        <div key={name} className="space-y-1 border-l-2 border-[#00adef]/30 pl-3">
          <div className="text-[#00adef] font-bold">{name}:</div>
          <div className="text-[#8b949e]">   Connection-specific DNS Suffix: <span className="text-[#e6edf3]">{state.domain || ""}</span></div>
          <div className="text-[#8b949e]">   IPv4 Address . . . . . : <span className={iface.ip ? "text-[#3fb950]" : "text-[#f85149]"}>{iface.ip || "169.254.0.1(APIPA)"}</span></div>
          <div className="text-[#8b949e]">   Subnet Mask . . . . . : <span className="text-[#e6edf3]">{iface.mask || "255.255.0.0"}</span></div>
          <div className="text-[#8b949e]">   Default Gateway . . . : <span className="text-[#e6edf3]">{iface.gateway || ""}</span></div>
          <div className="text-[#8b949e]">   DNS Servers . . . . . : <span className="text-[#e6edf3]">{state.dns?.join(", ") || "8.8.8.8"}</span></div>
          <div className="text-[#8b949e]">   Status  . . . . . . . : <span className={iface.status === "up" ? "text-[#3fb950]" : "text-[#f85149]"}>{iface.status === "up" ? "Connected" : "Disconnected"}</span></div>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Windows PC Simulator
// ──────────────────────────────────────────────────────────────
export function WindowsPcSimulator({ state, onStateChange, className = "" }: WindowsPcSimulatorProps) {
  const [activeTab, setActiveTab] = React.useState<WinTab>("network");
  const [selectedAdapter, setSelectedAdapter] = React.useState<string>(
    Object.keys(state.interfaces)[0] || "Ethernet Adapter"
  );

  function handleAdapterSave(updated: any) {
    const adapterName = selectedAdapter;
    const oldIface = state.interfaces[adapterName] || { name: adapterName, status: "up" as const };

    let newIp = updated.dhcp
      ? `192.168.1.${Math.floor(Math.random() * 200 + 10)}`
      : updated.ip;

    const newIface: NetworkInterface = {
      ...oldIface,
      ip: newIp,
      mask: updated.dhcp ? "255.255.255.0" : updated.mask,
      gateway: updated.dhcp ? "192.168.1.1" : updated.gateway,
      status: "up",
    };

    onStateChange((prev) => ({
      ...prev,
      interfaces: { ...prev.interfaces, [adapterName]: newIface },
      dns: [updated.dns1, updated.dns2].filter(Boolean),
      windowsConfig: prev.windowsConfig
        ? {
            ...prev.windowsConfig,
            adapters: prev.windowsConfig.adapters.map((a) =>
              a.name === adapterName ? { ...a, dhcp: updated.dhcp, ip: newIp, mask: updated.mask, gateway: updated.gateway, dns: [updated.dns1, updated.dns2] } : a
            ),
          }
        : prev.windowsConfig,
    }));
  }

  const tabs: Array<{ id: WinTab; label: string; icon: React.ElementType }> = [
    { id: "network", label: "Network Config", icon: Settings },
    { id: "ipconfig", label: "IP Status", icon: Monitor },
    { id: "cmd", label: "CMD Terminal", icon: Terminal },
  ];

  return (
    <div className={`flex flex-col h-full bg-[#0d1117] rounded-xl border border-[#00adef]/20 overflow-hidden font-sans ${className}`}>
      {/* Windows-style title bar */}
      <div className="flex-none flex items-center gap-3 px-4 py-2.5 bg-[#1e3a5f] border-b border-[#00adef]/30">
        <Monitor className="w-4 h-4 text-[#00adef]" />
        <span className="text-[12px] font-semibold text-white">
          {state.windowsConfig?.computerName || state.hostname} — Network Settings
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
      </div>

      {/* Windows-style tab bar */}
      <div className="flex-none flex border-b border-[#30363d] bg-[#161b22]">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold border-b-2 transition-all ${
              activeTab === id
                ? "border-[#00adef] text-[#00adef]"
                : "border-transparent text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "network" && (
          <div className="flex h-full">
            {/* Adapter sidebar */}
            <div className="w-48 border-r border-[#30363d] bg-[#0d1117] overflow-y-auto">
              <div className="px-3 py-2 text-[9px] text-[#8b949e] uppercase tracking-wider font-mono border-b border-[#21262d]">
                Network Adapters
              </div>
              {Object.keys(state.interfaces).map((name) => {
                const iface = state.interfaces[name];
                return (
                  <button
                    key={name}
                    onClick={() => setSelectedAdapter(name)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors ${
                      selectedAdapter === name
                        ? "bg-[#00adef]/10 border-l-2 border-[#00adef]"
                        : "hover:bg-[#21262d] border-l-2 border-transparent"
                    }`}
                  >
                    <Wifi className={`w-3.5 h-3.5 shrink-0 ${iface.status === "up" ? "text-[#3fb950]" : "text-[#f85149]"}`} />
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-[#e6edf3] truncate">{name}</div>
                      <div className="text-[9px] text-[#8b949e]">{iface.ip || "Disconnected"}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Config panel */}
            <div className="flex-1 overflow-y-auto">
              {selectedAdapter && state.interfaces[selectedAdapter] && (
                <AdapterConfigPanel
                  adapterName={selectedAdapter}
                  iface={state.interfaces[selectedAdapter]}
                  state={state}
                  onSave={handleAdapterSave}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === "ipconfig" && (
          <div className="overflow-y-auto h-full">
            <IpconfigView state={state} />
          </div>
        )}

        {activeTab === "cmd" && (
          <WindowsCmdTerminal state={state} onStateChange={onStateChange} />
        )}
      </div>
    </div>
  );
}
