"use client";

import * as React from "react";
import {
  Terminal, Copy, RotateCcw, Download, Check, Maximize2, Minimize2,
} from "lucide-react";
import {
  DeviceType, DeviceState, CommandResult,
  DEVICE_META, buildDeviceState, generateRunningConfig,
  dispatchCommand, getPrompt, getBootMessages,
} from "@/lib/device-simulator-engine";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
interface TerminalLine {
  type: "input" | "output" | "error" | "info" | "system";
  content: string;
}

interface MultiDeviceTerminalProps {
  deviceId: string;
  deviceType: DeviceType;
  hostname?: string;
  initialState?: Partial<DeviceState>;
  className?: string;
  onConfigChange?: (config: string) => void;
  compact?: boolean;
}

// ──────────────────────────────────────────────────────────────
// Initial mode per device type
// ──────────────────────────────────────────────────────────────
function getInitialMode(type: DeviceType): string {
  switch (type) {
    case "palo_alto": return "operational";
    case "juniper": return "operational";
    case "cisco_router":
    case "cisco_switch":
    case "cisco_asa":
    case "cisco_nexus": return "user_exec";
    case "linux_server":
    case "cloud_router": return "shell";
    case "windows_pc": return "cmd";
    default: return "shell";
  }
}

// ──────────────────────────────────────────────────────────────
// Tab completion per device type
// ──────────────────────────────────────────────────────────────
const TAB_POOLS: Record<string, string[]> = {
  cisco_ios_user: ["enable", "show", "ping", "traceroute", "exit", "logout", "?"],
  cisco_ios_priv: ["configure terminal", "show", "ping", "write", "reload", "debug", "disable", "exit", "copy"],
  cisco_ios_global: ["hostname", "interface", "vlan", "ip route", "ip ssh version 2", "enable secret", "banner motd", "no", "do", "end", "exit", "username", "line", "service password-encryption", "spanning-tree", "ntp server", "crypto key generate rsa"],
  cisco_ios_iface: ["ip address", "no ip address", "no shutdown", "shutdown", "description", "switchport mode access", "switchport mode trunk", "switchport access vlan", "duplex", "speed", "spanning-tree portfast", "channel-group", "mtu", "end", "exit"],
  junos_op: ["show interfaces", "show route", "show version", "show bgp", "show ospf", "configure", "ping", "traceroute", "request", "quit"],
  panos_op: ["show system info", "show interface all", "show security", "show route", "configure", "ping", "exit"],
  fortigate: ["get system status", "get system interface", "show firewall policy", "config system global", "config system interface", "config firewall policy", "execute ping", "diagnose"],
  mikrotik: ["/ip address print", "/ip address add", "/ip route print", "/interface print", "/system identity print", "/system resource print", "ping", "/quit"],
  linux: ["ip addr", "ip route", "ifconfig", "ping", "traceroute", "netstat", "ss", "hostname", "cat", "ls", "pwd", "whoami", "uname", "systemctl", "arp", "route", "nslookup", "dig", "curl"],
};

function getCompletions(partial: string, deviceType: DeviceType, mode: string): string[] {
  let pool: string[] = [];
  const lower = partial.toLowerCase();

  if (deviceType === "cisco_router" || deviceType === "cisco_switch" || deviceType === "cisco_asa" || deviceType === "cisco_nexus") {
    if (mode === "user_exec") pool = TAB_POOLS.cisco_ios_user;
    else if (mode === "privileged_exec") pool = TAB_POOLS.cisco_ios_priv;
    else if (mode === "global_config") pool = TAB_POOLS.cisco_ios_global;
    else if (mode === "interface_config") pool = TAB_POOLS.cisco_ios_iface;
  } else if (deviceType === "juniper") pool = TAB_POOLS.junos_op;
  else if (deviceType === "palo_alto") pool = TAB_POOLS.panos_op;
  else if (deviceType === "fortinet") pool = TAB_POOLS.fortigate;
  else if (deviceType === "mikrotik") pool = TAB_POOLS.mikrotik;
  else if (deviceType === "linux_server" || deviceType === "cloud_router") pool = TAB_POOLS.linux;

  return pool.filter((c) => c.toLowerCase().startsWith(lower));
}

// ──────────────────────────────────────────────────────────────
// Main Terminal Component
// ──────────────────────────────────────────────────────────────
export function MultiDeviceTerminal({
  deviceId,
  deviceType,
  hostname,
  initialState,
  className = "",
  onConfigChange,
  compact = false,
}: MultiDeviceTerminalProps) {
  const meta = DEVICE_META[deviceType];
  const [state, setState] = React.useState<DeviceState>(() => ({
    ...buildDeviceState(deviceType, hostname),
    ...initialState,
  }));
  const [mode, setMode] = React.useState(getInitialMode(deviceType));
  const [lines, setLines] = React.useState<TerminalLine[]>([]);
  const [input, setInput] = React.useState("");
  const [history, setHistory] = React.useState<string[]>([]);
  const [histIdx, setHistIdx] = React.useState(-1);
  const [context, setContext] = React.useState<{ iface?: string; vlan?: number }>({});
  const [awaitingEnablePass, setAwaitingEnablePass] = React.useState(false);
  const [passBuffer, setPassBuffer] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [cmdCount, setCmdCount] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const termRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const accentColor = meta.color;

  // Boot messages
  React.useEffect(() => {
    const boot = getBootMessages(deviceType, state);
    setLines(boot.map((l) => ({ type: "system" as const, content: l })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom
  React.useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [lines]);

  // Config change callback
  React.useEffect(() => {
    onConfigChange?.(generateRunningConfig(state));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ── Output helpers ───────────────────────────────────────────
  function addLines(result: CommandResult, inputEcho: string, prompt: string) {
    setLines((prev) => [
      ...prev,
      { type: "input", content: `${prompt} ${inputEcho}` },
      ...result.output.map((l) => ({
        type: (result.error ? "error" : "output") as TerminalLine["type"],
        content: l,
      })),
    ]);
  }

  // ── Process command ──────────────────────────────────────────
  function processCommand(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      const prompt = getPrompt(deviceType, state.hostname, mode, context);
      setLines((prev) => [...prev, { type: "input", content: prompt }]);
      return;
    }

    setHistory((prev) => {
      const deduped = prev.filter((h) => h !== trimmed);
      return [...deduped, trimmed];
    });
    setHistIdx(-1);
    setCmdCount((n) => n + 1);

    const prompt = getPrompt(deviceType, state.hostname, mode, context);

    // Enable password interception
    if (awaitingEnablePass) {
      if (trimmed === (state.enablePassword || "cisco") || trimmed === "cisco" || trimmed === "admin") {
        setMode("privileged_exec");
        addLines({ output: [""] }, "●".repeat(trimmed.length), prompt);
      } else {
        addLines({ output: ["% Access denied.", "% Password incorrect"], error: true }, "●".repeat(trimmed.length), prompt);
      }
      setAwaitingEnablePass(false);
      setPassBuffer("");
      setInput("");
      return;
    }

    // Dispatch
    const result = dispatchCommand(trimmed, mode, state, context);
    addLines(result, trimmed, prompt);

    // Apply state update
    if (result.stateUpdate) {
      const upd = result.stateUpdate as any;
      // Handle context side-channel
      const newCtx = { ...context };
      if (upd._ctx_iface !== undefined) { newCtx.iface = upd._ctx_iface; delete upd._ctx_iface; }
      if (upd._ctx_vlan !== undefined) { newCtx.vlan = upd._ctx_vlan; delete upd._ctx_vlan; }
      setContext(newCtx);
      setState((prev) => ({ ...prev, ...upd }));
    }

    // Handle mode transitions
    if (result.nextMode) {
      if (result.nextMode === "await_enable_password") {
        setAwaitingEnablePass(true);
      } else if (result.nextMode === "clear") {
        setLines([]);
      } else if (result.nextMode === "disconnected") {
        setLines((prev) => [...prev, { type: "system", content: "Connection closed." }]);
      } else if (result.nextMode.startsWith("iface:")) {
        setContext((prev) => ({ ...prev, iface: result.nextMode!.split(":")[1] }));
        setMode("interface_config");
      } else if (result.nextMode.startsWith("config_block:")) {
        setMode(result.nextMode);
      } else {
        setMode(result.nextMode);
        // Clear context on mode exit
        if (result.nextMode === "global_config" || result.nextMode === "privileged_exec") {
          setContext({});
        }
      }
    }
  }

  // ── Keyboard handler ─────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const val = awaitingEnablePass ? passBuffer : input;
      processCommand(val);
      setInput("");
      setPassBuffer("");
    } else if (e.key === "Tab") {
      e.preventDefault();
      const completions = getCompletions(input, deviceType, mode);
      if (completions.length === 1) {
        setInput(completions[0] + " ");
      } else if (completions.length > 1) {
        const prompt = getPrompt(deviceType, state.hostname, mode, context);
        setLines((prev) => [
          ...prev,
          { type: "input", content: `${prompt} ${input}` },
          ...completions.map((c) => ({ type: "output" as const, content: `  ${c}` })),
        ]);
      }
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
      const prompt = getPrompt(deviceType, state.hostname, mode, context);
      setLines((prev) => [...prev, { type: "input", content: `${prompt} ${input}^C` }]);
      setInput("");
    } else if (e.ctrlKey && e.key === "z") {
      if (!["user_exec", "privileged_exec", "shell", "cmd", "operational"].includes(mode)) {
        setMode("privileged_exec");
        setContext({});
        setLines((prev) => [...prev, { type: "system", content: "%SYS-5-CONFIG_I: Configured from console" }]);
      }
      setInput("");
    } else if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      setLines([]);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(generateRunningConfig(state));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([generateRunningConfig(state)], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${state.hostname}-config.txt`;
    a.click();
  }

  function handleReset() {
    setState(buildDeviceState(deviceType, hostname));
    setMode(getInitialMode(deviceType));
    setContext({});
    setInput("");
    setHistory([]);
    setCmdCount(0);
    setAwaitingEnablePass(false);
    const boot = getBootMessages(deviceType, state);
    setLines([{ type: "system", content: "--- Terminal Reset ---" }, ...boot.map((l) => ({ type: "system" as const, content: l }))]);
  }

  const prompt = getPrompt(deviceType, state.hostname, mode, context);
  const displayInput = awaitingEnablePass ? "●".repeat(passBuffer.length) : input;

  const lineColor = (type: TerminalLine["type"]) => {
    switch (type) {
      case "error": return "text-[#f85149]";
      case "input": return "text-[#e6edf3]";
      case "system": return "text-[#8b949e]";
      default: return "";
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-[#0d1117] rounded-xl border overflow-hidden font-mono text-[13px] transition-all ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""
      } ${className}`}
      style={{ borderColor: `${accentColor}30` }}
    >
      {/* ── Header ── */}
      <div className="flex-none flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b" style={{ borderColor: `${accentColor}20` }}>
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <Terminal className="w-3.5 h-3.5" style={{ color: accentColor }} />
            <span className="font-bold" style={{ color: accentColor }}>{state.hostname}</span>
            <span className="text-[#30363d]">│</span>
            <span className="text-[#8b949e] uppercase tracking-wider text-[9px]">{meta.label}</span>
            <span className="text-[#30363d]">│</span>
            <span className="text-[#8b949e] text-[9px] uppercase tracking-wide">{mode.replace(/_/g, " ").replace("config", "cfg")}</span>
            {context.iface && (
              <>
                <span className="text-[#30363d]">│</span>
                <span className="text-[9px] font-bold" style={{ color: accentColor }}>{context.iface}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-[#8b949e] font-mono mr-2">{cmdCount} cmds</span>
          <button onClick={handleCopy} className="p-1.5 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleDownload} className="p-1.5 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleReset} className="p-1.5 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIsFullscreen((f) => !f)} className="p-1.5 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors">
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Vendor tag strip ── */}
      <div className="flex-none px-4 py-1 flex items-center gap-2 text-[9px] font-mono" style={{ background: `${accentColor}08` }}>
        <span className="px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: `${accentColor}20`, color: accentColor }}>
          {meta.vendor}
        </span>
        <span className="text-[#8b949e]">{meta.model}</span>
        <span className="text-[#30363d]">•</span>
        <span className="text-[#8b949e]">{meta.osLabel}</span>
      </div>

      {/* ── Terminal output ── */}
      <div
        ref={termRef}
        className="flex-1 overflow-y-auto p-4 leading-relaxed cursor-text space-y-0"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, i) => (
          <div key={i} className={`whitespace-pre-wrap break-all ${lineColor(line.type)}`}
            style={line.type === "output" ? { color: accentColor === "#58a6ff" ? "#3fb950" : accentColor } : {}}>
            {line.content}
          </div>
        ))}

        {/* Live input line */}
        <div className="flex items-center text-[#e6edf3] mt-0.5">
          <span className="mr-1 font-bold" style={{ color: accentColor }}>{prompt}</span>
          <span className="whitespace-pre">{displayInput}</span>
          <span className="w-0.5 h-4 animate-pulse ml-px" style={{ background: accentColor }} />
        </div>
      </div>

      {/* ── Hidden real input ── */}
      <input
        ref={inputRef}
        value={awaitingEnablePass ? passBuffer : input}
        onChange={(e) => awaitingEnablePass ? setPassBuffer(e.target.value) : setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="opacity-0 absolute -z-10 pointer-events-none"
        autoFocus
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
      />

      {/* ── Shortcuts bar ── */}
      {!compact && (
        <div className="flex-none px-4 py-1.5 bg-[#161b22] border-t border-[#30363d] flex items-center gap-3 text-[9px] text-[#8b949e] overflow-x-auto scrollbar-none">
          <span><kbd className="px-1 py-0.5 rounded bg-[#21262d]" style={{ color: accentColor }}>Tab</kbd> complete</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[#21262d]" style={{ color: accentColor }}>↑↓</kbd> history</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[#21262d]" style={{ color: accentColor }}>Ctrl+C</kbd> break</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[#21262d]" style={{ color: accentColor }}>Ctrl+Z</kbd> end</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[#21262d]" style={{ color: accentColor }}>Ctrl+L</kbd> clear</span>
          <span className="ml-auto opacity-60">Click to focus</span>
        </div>
      )}
    </div>
  );
}
