"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus, Trash2, Network, Terminal, Settings, Play, Save,
  Download, Upload, Copy, ArrowLeft, ChevronRight, ZoomIn,
  ZoomOut, Maximize2, RefreshCw, X, Check, Wifi, Server,
  Shield, Cpu, Monitor, Globe, Cable, RotateCcw, Layers,
  AlertCircle, BookOpen, Zap, Lock, Unlock,
} from "lucide-react";
import { MultiDeviceTerminal } from "@/components/study/multi-device-terminal";
import { WindowsPcSimulator } from "@/components/study/windows-pc-simulator";
import {
  DeviceType, DeviceState, DEVICE_META,
  buildDeviceState, generateRunningConfig,
} from "@/lib/device-simulator-engine";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
interface LabDevice {
  id: string;
  type: DeviceType;
  hostname: string;
  x: number;
  y: number;
  state: DeviceState;
  color?: string;
}

interface LabLink {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePort?: string;
  targetPort?: string;
  label?: string;
  linkType: "ethernet" | "serial" | "fiber" | "trunk" | "wireless";
  status: "up" | "down";
}

interface LabProject {
  id: string;
  name: string;
  description: string;
  devices: LabDevice[];
  links: LabLink[];
  createdAt: string;
  tags: string[];
}

// ──────────────────────────────────────────────────────────────
// Device palette entries
// ──────────────────────────────────────────────────────────────
const DEVICE_PALETTE: Array<{
  type: DeviceType;
  group: string;
}> = [
  { type: "cisco_router", group: "Cisco" },
  { type: "cisco_switch", group: "Cisco" },
  { type: "cisco_asa", group: "Cisco" },
  { type: "cisco_nexus", group: "Cisco" },
  { type: "sophos_xg", group: "Firewalls" },
  { type: "palo_alto", group: "Firewalls" },
  { type: "fortinet", group: "Firewalls" },
  { type: "juniper", group: "Enterprise" },
  { type: "aruba", group: "Enterprise" },
  { type: "mikrotik", group: "Enterprise" },
  { type: "windows_pc", group: "Endpoints" },
  { type: "linux_server", group: "Endpoints" },
  { type: "generic_switch", group: "Generic" },
  { type: "cloud_router", group: "Generic" },
];

const PALETTE_GROUPS = ["Cisco", "Firewalls", "Enterprise", "Endpoints", "Generic"];

// ──────────────────────────────────────────────────────────────
// SVG Device Icons
// ──────────────────────────────────────────────────────────────
function DeviceIcon({ type, size = 36 }: { type: DeviceType; size?: number }) {
  const meta = DEVICE_META[type];
  const color = meta.color;
  const s = size;
  const h = s;

  switch (meta.iconType) {
    case "router":
      return (
        <svg width={s} height={h} viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="17" fill="#0d1117" stroke={color} strokeWidth="1.5" />
          <circle cx="20" cy="20" r="9" fill="none" stroke={color} strokeWidth="1.2" />
          <line x1="3" y1="20" x2="37" y2="20" stroke={color} strokeWidth="1.2" />
          <line x1="20" y1="3" x2="20" y2="37" stroke={color} strokeWidth="1.2" />
          <ellipse cx="20" cy="20" rx="6" ry="12" fill="none" stroke={color} strokeWidth="0.8" opacity="0.5" />
        </svg>
      );
    case "switch":
    case "nexus":
      return (
        <svg width={s} height={h} viewBox="0 0 40 40" fill="none">
          <rect x="2" y="13" width="36" height="14" rx="3" fill="#0d1117" stroke={color} strokeWidth="1.5" />
          {[7, 12, 17, 22, 27, 32].map((x, i) => (
            <rect key={i} x={x - 2} y="17" width="4" height="6" rx="1" fill={color} opacity="0.8" />
          ))}
          <line x1="6" y1="9" x2="34" y2="9" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
          <line x1="6" y1="31" x2="34" y2="31" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
          <line x1="5" y1="9" x2="5" y2="13" stroke={color} strokeWidth="1" />
          <line x1="35" y1="9" x2="35" y2="13" stroke={color} strokeWidth="1" />
          <line x1="5" y1="31" x2="5" y2="27" stroke={color} strokeWidth="1" />
          <line x1="35" y1="31" x2="35" y2="27" stroke={color} strokeWidth="1" />
        </svg>
      );
    case "firewall":
      return (
        <svg width={s} height={h} viewBox="0 0 40 40" fill="none">
          <path d="M20 2 L36 9 L36 23 C36 31 20 38 20 38 C20 38 4 31 4 23 L4 9 Z" fill="#0d1117" stroke={color} strokeWidth="1.5" />
          <path d="M20 8 C20 8 13 15 13 21 C13 23 16 25 20 25 C24 25 27 23 27 21 C27 15 20 8 20 8Z" fill={color} opacity="0.7" />
          <path d="M17 19 C17 17 20 14 20 14 C20 14 23 17 23 19 C23 21 21.5 22 20 22 C18.5 22 17 21 17 19Z" fill="#0d1117" opacity="0.8" />
        </svg>
      );
    case "pc":
      return (
        <svg width={s} height={h} viewBox="0 0 40 40" fill="none">
          <rect x="3" y="5" width="26" height="20" rx="2" fill="#0d1117" stroke={color} strokeWidth="1.5" />
          <rect x="5" y="7" width="22" height="16" rx="1" fill={color} opacity="0.15" />
          <path d="M13 25 L11 36" stroke={color} strokeWidth="1.5" />
          <path d="M19 25 L21 36" stroke={color} strokeWidth="1.5" />
          <rect x="8" y="35" width="16" height="2" rx="1" fill={color} />
          <circle cx="33" cy="12" r="5" fill="#0d1117" stroke={color} strokeWidth="1.2" />
          <path d="M31 12 L33 14 L36 10" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "server":
      return (
        <svg width={s} height={h} viewBox="0 0 40 40" fill="none">
          <rect x="6" y="4" width="28" height="9" rx="2" fill="#0d1117" stroke={color} strokeWidth="1.5" />
          <rect x="6" y="15" width="28" height="9" rx="2" fill="#0d1117" stroke={color} strokeWidth="1.5" />
          <rect x="6" y="26" width="28" height="9" rx="2" fill="#0d1117" stroke={color} strokeWidth="1.5" />
          {[4 + 4, 15 + 4, 26 + 4].map((y, i) => (
            <circle key={i} cx="10" cy={y + 0.5} r="2" fill={color} />
          ))}
          {[4, 15, 26].map((y, i) => (
            <rect key={i} x="16" y={y + 2} width="14" height="5" rx="1" fill={color} opacity="0.3" />
          ))}
        </svg>
      );
    case "cloud":
      return (
        <svg width={s} height={h} viewBox="0 0 40 40" fill="none">
          <path d="M30 26 C34 26 37 23 37 19 C37 15 34 12 30 12 C29 8 26 5 22 5 C17 5 13 9 13 14 C10 14 7 17 7 20 C7 23 10 26 13 26 Z" fill="#0d1117" stroke={color} strokeWidth="1.5" />
          <line x1="15" y1="31" x2="15" y2="26" stroke={color} strokeWidth="1.2" />
          <line x1="20" y1="33" x2="20" y2="26" stroke={color} strokeWidth="1.2" />
          <line x1="25" y1="31" x2="25" y2="26" stroke={color} strokeWidth="1.2" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={h} viewBox="0 0 40 40" fill="none">
          <rect x="4" y="4" width="32" height="32" rx="6" fill="#0d1117" stroke={color} strokeWidth="1.5" />
          <circle cx="20" cy="20" r="8" fill="none" stroke={color} strokeWidth="1.2" />
        </svg>
      );
  }
}

// ──────────────────────────────────────────────────────────────
// Link type colors
// ──────────────────────────────────────────────────────────────
const LINK_COLORS: Record<LabLink["linkType"], string> = {
  ethernet: "#8b949e",
  trunk: "#58a6ff",
  serial: "#ffa657",
  fiber: "#3fb950",
  wireless: "#d2a8ff",
};

// ──────────────────────────────────────────────────────────────
// Main Lab Builder Page
// ──────────────────────────────────────────────────────────────
export default function LabBuilderPage() {
  // ── State ────────────────────────────────────────────────────
  const [devices, setDevices] = React.useState<LabDevice[]>([]);
  const [links, setLinks] = React.useState<LabLink[]>([]);
  const [labName, setLabName] = React.useState("My Custom Lab");
  const [labDesc, setLabDesc] = React.useState("");

  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string | null>(null);
  const [openTerminalId, setOpenTerminalId] = React.useState<string | null>(null);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [linkingFrom, setLinkingFrom] = React.useState<string | null>(null);
  const [linkType, setLinkType] = React.useState<LabLink["linkType"]>("ethernet");

  const [scale, setScale] = React.useState(1);
  const [panX, setPanX] = React.useState(0);
  const [panY, setPanY] = React.useState(0);
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });

  const [showSidebar, setShowSidebar] = React.useState<"palette" | "properties" | "settings" | null>("palette");
  const [showTerminal, setShowTerminal] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState(false);
  const [animOffset, setAnimOffset] = React.useState(0);

  const svgRef = React.useRef<SVGSVGElement>(null);

  // Animate links
  React.useEffect(() => {
    const id = setInterval(() => setAnimOffset((n) => (n + 1) % 20), 60);
    return () => clearInterval(id);
  }, []);

  // Load from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("lab-builder-project");
      if (saved) {
        const proj: LabProject = JSON.parse(saved);
        setDevices(proj.devices || []);
        setLinks(proj.links || []);
        setLabName(proj.name || "My Custom Lab");
        setLabDesc(proj.description || "");
      }
    } catch {}
  }, []);

  // ── Helpers ──────────────────────────────────────────────────
  const selectedDevice = selectedDeviceId ? devices.find((d) => d.id === selectedDeviceId) : null;
  const openTerminalDevice = openTerminalId ? devices.find((d) => d.id === openTerminalId) : null;

  function generateId() {
    return Math.random().toString(36).slice(2, 9);
  }

  // ── Add device from palette ───────────────────────────────────
  function addDevice(type: DeviceType) {
    const meta = DEVICE_META[type];
    const id = generateId();
    const count = devices.filter((d) => d.type === type).length + 1;
    const hostname = `${meta.label.split(" ")[1] || type.split("_")[1]}${count}`.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const newDevice: LabDevice = {
      id,
      type,
      hostname,
      x: 120 + Math.random() * 300,
      y: 80 + Math.random() * 200,
      state: buildDeviceState(type, hostname),
    };
    setDevices((prev) => [...prev, newDevice]);
    setSelectedDeviceId(id);
  }

  // ── Device drag on canvas ────────────────────────────────────
  function handleDeviceMouseDown(e: React.MouseEvent, id: string) {
    e.stopPropagation();

    if (linkingFrom && linkingFrom !== id) {
      // Complete link
      const newLink: LabLink = {
        id: generateId(),
        sourceId: linkingFrom,
        targetId: id,
        linkType,
        status: "up",
      };
      setLinks((prev) => [...prev, newLink]);
      setLinkingFrom(null);
      return;
    }

    setSelectedDeviceId(id);
    setDraggingId(id);
    const device = devices.find((d) => d.id === id)!;
    const rect = svgRef.current!.getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - rect.left) / scale - device.x - panX / scale,
      y: (e.clientY - rect.top) / scale - device.y - panY / scale,
    });
  }

  function handleCanvasMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (draggingId) {
      const rect = svgRef.current!.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / scale - dragOffset.x - panX / scale;
      const ny = (e.clientY - rect.top) / scale - dragOffset.y - panY / scale;
      setDevices((prev) => prev.map((d) => d.id === draggingId ? { ...d, x: nx, y: ny } : d));
    } else if (isPanning) {
      setPanX(e.clientX - panStart.x);
      setPanY(e.clientY - panStart.y);
    }
  }

  function handleCanvasMouseUp() {
    setDraggingId(null);
    setIsPanning(false);
  }

  function handleCanvasMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if ((e.target as SVGElement).tagName === "svg" || (e.target as SVGElement).tagName === "rect") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
      setSelectedDeviceId(null);
    }
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    setScale((s) => Math.min(2.5, Math.max(0.2, s * (e.deltaY > 0 ? 0.9 : 1.1))));
  }

  // ── Delete device ────────────────────────────────────────────
  function deleteDevice(id: string) {
    setDevices((prev) => prev.filter((d) => d.id !== id));
    setLinks((prev) => prev.filter((l) => l.sourceId !== id && l.targetId !== id));
    if (selectedDeviceId === id) setSelectedDeviceId(null);
    if (openTerminalId === id) setOpenTerminalId(null);
  }

  // ── Delete link ───────────────────────────────────────────────
  function deleteLink(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  // ── Update device state ───────────────────────────────────────
  function updateDeviceState(id: string, updater: (prev: DeviceState) => DeviceState) {
    setDevices((prev) =>
      prev.map((d) => d.id === id ? { ...d, state: updater(d.state) } : d)
    );
  }

  function updateDeviceHostname(id: string, hostname: string) {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, hostname, state: { ...d.state, hostname } }
          : d
      )
    );
  }

  // ── Save to localStorage ──────────────────────────────────────
  function handleSave() {
    const project: LabProject = {
      id: generateId(),
      name: labName,
      description: labDesc,
      devices,
      links,
      createdAt: new Date().toISOString(),
      tags: [],
    };
    localStorage.setItem("lab-builder-project", JSON.stringify(project));
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  }

  // ── Export JSON ───────────────────────────────────────────────
  function handleExport() {
    const data = JSON.stringify({ name: labName, description: labDesc, devices, links }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${labName.replace(/\s+/g, "-")}.lab.json`;
    a.click();
  }

  // ── Import JSON ───────────────────────────────────────────────
  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.lab.json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.devices) {
            setDevices(data.devices);
            setLinks(data.links || []);
            setLabName(data.name || "Imported Lab");
            setLabDesc(data.description || "");
          }
        } catch {
          alert("Invalid lab file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // ── Auto-arrange devices ──────────────────────────────────────
  function handleAutoArrange() {
    const cols = Math.ceil(Math.sqrt(devices.length));
    setDevices((prev) =>
      prev.map((d, i) => ({
        ...d,
        x: 100 + (i % cols) * 180,
        y: 80 + Math.floor(i / cols) * 160,
      }))
    );
  }

  // ── Get node position ─────────────────────────────────────────
  function getNodePos(id: string) {
    const d = devices.find((d) => d.id === id);
    return d ? { x: d.x, y: d.y } : { x: 0, y: 0 };
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-[#0d1117] flex flex-col overflow-hidden font-mono">
      {/* ── Top toolbar ── */}
      <div className="flex-none border-b border-[#30363d] bg-[#161b22] px-4 py-2.5 flex items-center gap-3">
        <Link href="/dashboard/study/ccna" className="flex items-center gap-1.5 text-[#8b949e] hover:text-[#e6edf3] text-xs transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Labs</span>
        </Link>
        <span className="text-[#30363d]">/</span>

        {/* Lab name */}
        <input
          value={labName}
          onChange={(e) => setLabName(e.target.value)}
          className="text-sm font-bold text-[#e6edf3] bg-transparent border-none outline-none w-48 truncate"
        />

        <div className="flex items-center gap-1 border border-[#30363d] rounded-lg p-1 ml-auto">
          {/* Sidebar toggles */}
          {(["palette", "properties", "settings"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setShowSidebar(showSidebar === s ? null : s)}
              title={s}
              className={`p-1.5 rounded text-[10px] transition-colors ${showSidebar === s ? "bg-[#58a6ff] text-[#0d1117]" : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"}`}
            >
              {s === "palette" && <Layers className="w-3.5 h-3.5" />}
              {s === "properties" && <Settings className="w-3.5 h-3.5" />}
              {s === "settings" && <BookOpen className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>

        {/* Link type selector */}
        <div className="flex items-center gap-1 text-[10px]">
          <Cable className="w-3.5 h-3.5 text-[#8b949e]" />
          <select
            value={linkType}
            onChange={(e) => setLinkType(e.target.value as LabLink["linkType"])}
            className="bg-[#21262d] border border-[#30363d] text-[#e6edf3] rounded px-1.5 py-1 text-[10px] font-mono"
          >
            <option value="ethernet">Ethernet</option>
            <option value="trunk">Trunk</option>
            <option value="serial">Serial</option>
            <option value="fiber">Fiber</option>
            <option value="wireless">Wireless</option>
          </select>
        </div>

        {/* Toolbar actions */}
        <div className="flex items-center gap-1.5">
          <button onClick={handleAutoArrange} title="Auto-arrange" className="p-2 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleImport} title="Import" className="p-2 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors">
            <Upload className="w-4 h-4" />
          </button>
          <button onClick={handleExport} title="Export JSON" className="p-2 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${savedMsg ? "bg-[#3fb950] text-[#0d1117]" : "bg-[#238636] hover:bg-[#2ea043] text-white"}`}
          >
            {savedMsg ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {savedMsg ? "Saved!" : "Save Lab"}
          </button>
        </div>

        {/* Counters */}
        <div className="text-[10px] text-[#8b949e] font-mono hidden md:flex items-center gap-2 border-l border-[#30363d] pl-3">
          <span>{devices.length} devices</span>
          <span>•</span>
          <span>{links.length} links</span>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        {showSidebar && (
          <div className="w-72 flex-none border-r border-[#30363d] bg-[#161b22] flex flex-col overflow-hidden">
            {showSidebar === "palette" && (
              <PalettePanel onAddDevice={addDevice} />
            )}
            {showSidebar === "properties" && selectedDevice && (
              <PropertiesPanel
                device={selectedDevice}
                links={links}
                devices={devices}
                onHostnameChange={(h) => updateDeviceHostname(selectedDevice.id, h)}
                onOpenTerminal={() => { setOpenTerminalId(selectedDevice.id); setShowTerminal(true); }}
                onDelete={() => deleteDevice(selectedDevice.id)}
                onLinkFrom={() => setLinkingFrom(selectedDevice.id)}
                linkingFrom={linkingFrom}
                onLinkCancel={() => setLinkingFrom(null)}
                onDeleteLink={deleteLink}
              />
            )}
            {showSidebar === "properties" && !selectedDevice && (
              <div className="p-6 text-center text-[#8b949e] text-xs space-y-3">
                <Settings className="w-8 h-8 mx-auto opacity-40" />
                <p>Select a device on the canvas to view and edit its properties.</p>
              </div>
            )}
            {showSidebar === "settings" && (
              <LabSettingsPanel
                labName={labName}
                labDesc={labDesc}
                onNameChange={setLabName}
                onDescChange={setLabDesc}
                devices={devices}
                links={links}
              />
            )}
          </div>
        )}

        {/* ── CANVAS ── */}
        <div className="flex-1 relative overflow-hidden">
          {/* Link mode banner */}
          {linkingFrom && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-[#d29922] text-[#0d1117] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
              <Cable className="w-4 h-4" />
              Click another device to create a {linkType} link
              <button onClick={() => setLinkingFrom(null)} className="ml-2 hover:text-[#0d1117]/70">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1">
            <button onClick={() => setScale((s) => Math.min(2.5, s * 1.2))} className="p-2 rounded-lg bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setScale((s) => Math.max(0.2, s * 0.8))} className="p-2 rounded-lg bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { setScale(1); setPanX(0); setPanY(0); }} className="p-2 rounded-lg bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scale indicator */}
          <div className="absolute bottom-4 left-4 z-10 text-[9px] font-mono text-[#8b949e] bg-[#21262d] border border-[#30363d] px-2 py-1 rounded">
            {Math.round(scale * 100)}% • {devices.length} nodes
          </div>

          {/* SVG Canvas */}
          <svg
            ref={svgRef}
            className="w-full h-full cursor-crosshair select-none"
            style={{ cursor: draggingId ? "grabbing" : linkingFrom ? "crosshair" : "default" }}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseDown={handleCanvasMouseDown}
            onMouseLeave={handleCanvasMouseUp}
            onWheel={handleWheel}
          >
            <defs>
              <pattern id="bgrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#161b22" strokeWidth="0.7" />
              </pattern>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Grid */}
            <rect width="100%" height="100%" fill="url(#bgrid)" />

            <g transform={`translate(${panX},${panY}) scale(${scale})`}>
              {/* Links */}
              {links.map((link) => {
                const src = getNodePos(link.sourceId);
                const tgt = getNodePos(link.targetId);
                const midX = (src.x + tgt.x) / 2;
                const midY = (src.y + tgt.y) / 2;
                const color = LINK_COLORS[link.linkType];
                const isDashed = link.status === "down" || link.linkType === "wireless";

                return (
                  <g key={link.id}>
                    {/* Clickable wider invisible line for deletion */}
                    <line
                      x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                      stroke="transparent" strokeWidth="12"
                      className="cursor-pointer"
                      onDoubleClick={() => deleteLink(link.id)}
                    />
                    {/* Visual line */}
                    <line
                      x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                      stroke={color}
                      strokeWidth={link.linkType === "trunk" || link.linkType === "fiber" ? 2 : 1.5}
                      strokeDasharray={isDashed ? "5 4" : undefined}
                      strokeDashoffset={isDashed ? animOffset : 0}
                      opacity="0.85"
                    />
                    {/* Animated packet */}
                    {link.status === "up" && (
                      <circle r="2.5" fill={color} opacity="0.9" filter="url(#glow)">
                        <animateMotion dur="2s" repeatCount="indefinite"
                          path={`M ${src.x},${src.y} L ${tgt.x},${tgt.y}`} />
                      </circle>
                    )}
                    {/* Link label */}
                    {link.label && (
                      <text x={midX} y={midY - 6} textAnchor="middle" fontSize="8" fill={color} opacity="0.8">
                        {link.label}
                      </text>
                    )}
                    {/* Link type badge */}
                    <text x={midX} y={midY + 4} textAnchor="middle" fontSize="7" fill={color} opacity="0.6">
                      {link.linkType}
                    </text>
                  </g>
                );
              })}

              {/* Devices */}
              {devices.map((device) => {
                const meta = DEVICE_META[device.type];
                const isSelected = selectedDeviceId === device.id;
                const isLinkSrc = linkingFrom === device.id;
                const isTerminalOpen = openTerminalId === device.id;

                return (
                  <g
                    key={device.id}
                    transform={`translate(${device.x - 22},${device.y - 22})`}
                    onMouseDown={(e) => handleDeviceMouseDown(e, device.id)}
                    onDoubleClick={() => { setOpenTerminalId(device.id); setShowTerminal(true); setShowSidebar("properties"); setSelectedDeviceId(device.id); }}
                    style={{ cursor: linkingFrom ? "crosshair" : "grab" }}
                  >
                    {/* Selection/link ring */}
                    {(isSelected || isLinkSrc) && (
                      <circle cx="22" cy="22" r="28"
                        fill="none"
                        stroke={isLinkSrc ? "#d29922" : "#58a6ff"}
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        opacity="0.8"
                      />
                    )}

                    {/* Glow for terminal open */}
                    {isTerminalOpen && (
                      <circle cx="22" cy="22" r="24" fill={meta.color} opacity="0.08" />
                    )}

                    {/* Device icon */}
                    <foreignObject width="44" height="44">
                      <DeviceIcon type={device.type} size={44} />
                    </foreignObject>

                    {/* Status dot */}
                    <circle cx="38" cy="6" r="4.5" fill={device.state.interfaces[Object.keys(device.state.interfaces)[0]]?.status === "up" ? "#3fb950" : "#f85149"} />

                    {/* Terminal indicator */}
                    {isTerminalOpen && (
                      <circle cx="6" cy="6" r="3.5" fill="#58a6ff" opacity="0.8" />
                    )}

                    {/* Hostname label */}
                    <text x="22" y="56" textAnchor="middle" fontSize="10" fontFamily="monospace"
                      fill="#e6edf3" fontWeight="600">
                      {device.hostname}
                    </text>

                    {/* Vendor label */}
                    <text x="22" y="67" textAnchor="middle" fontSize="8" fontFamily="monospace"
                      fill={meta.color} opacity="0.8">
                      {meta.vendor}
                    </text>

                    {/* IP label (if first iface has IP) */}
                    {Object.values(device.state.interfaces)[0]?.ip && (
                      <text x="22" y="77" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#8b949e">
                        {Object.values(device.state.interfaces)[0].ip}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Empty state */}
          {devices.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-3">
                <Network className="w-12 h-12 text-[#30363d] mx-auto" />
                <div className="text-[#8b949e] text-sm font-mono">
                  Add devices from the palette to build your lab
                </div>
                <div className="text-[#8b949e] text-xs font-mono opacity-60">
                  Double-click a device to open its terminal
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Terminal ── */}
        {showTerminal && openTerminalDevice && (
          <div className="w-[600px] flex-none border-l border-[#30363d] flex flex-col overflow-hidden">
            {/* Terminal device tabs */}
            <div className="flex-none flex items-center border-b border-[#30363d] bg-[#161b22] overflow-x-auto scrollbar-none">
              {devices.map((d) => {
                const meta = DEVICE_META[d.type];
                return (
                  <button
                    key={d.id}
                    onClick={() => setOpenTerminalId(d.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono border-b-2 shrink-0 transition-all ${
                      openTerminalId === d.id
                        ? "border-current text-current"
                        : "border-transparent text-[#8b949e] hover:text-[#e6edf3]"
                    }`}
                    style={openTerminalId === d.id ? { color: meta.color, borderColor: meta.color } : {}}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
                    {d.hostname}
                  </button>
                );
              })}
              <button
                onClick={() => setShowTerminal(false)}
                className="ml-auto px-3 py-2 text-[#8b949e] hover:text-[#f85149] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Terminal content */}
            <div className="flex-1 overflow-hidden">
              {openTerminalDevice.type === "windows_pc" ? (
                <WindowsPcSimulator
                  state={openTerminalDevice.state}
                  onStateChange={(updater) => updateDeviceState(openTerminalDevice.id, updater)}
                />
              ) : (
                <MultiDeviceTerminal
                  deviceId={openTerminalDevice.id}
                  deviceType={openTerminalDevice.type}
                  hostname={openTerminalDevice.hostname}
                  initialState={openTerminalDevice.state}
                  onConfigChange={(config) => {
                    // config is synced back via terminal internal state
                  }}
                  className="h-full"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Palette Panel
// ──────────────────────────────────────────────────────────────
function PalettePanel({ onAddDevice }: { onAddDevice: (type: DeviceType) => void }) {
  const [search, setSearch] = React.useState("");

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[#30363d]">
        <div className="text-[10px] text-[#8b949e] uppercase tracking-wider font-mono mb-2">Device Palette</div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search devices..."
          className="w-full px-2.5 py-1.5 rounded-md bg-[#0d1117] border border-[#30363d] text-[#e6edf3] text-[11px] font-mono placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]/50"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {PALETTE_GROUPS.map((group) => {
          const groupDevices = DEVICE_PALETTE.filter(
            (d) => d.group === group &&
              (!search || DEVICE_META[d.type].label.toLowerCase().includes(search.toLowerCase()) ||
               DEVICE_META[d.type].vendor.toLowerCase().includes(search.toLowerCase()))
          );
          if (groupDevices.length === 0) return null;
          return (
            <div key={group}>
              <div className="text-[9px] text-[#8b949e] uppercase tracking-wider font-mono mb-2 px-1">{group}</div>
              <div className="space-y-1">
                {groupDevices.map(({ type }) => {
                  const meta = DEVICE_META[type];
                  return (
                    <button
                      key={type}
                      onClick={() => onAddDevice(type)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#30363d] hover:border-current text-left transition-all group"
                      style={{ "--hover-color": meta.color } as any}
                    >
                      <div className="shrink-0">
                        <DeviceIcon type={type} size={32} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-[#e6edf3] group-hover:text-white truncate">
                          {meta.label}
                        </div>
                        <div className="text-[9px] text-[#8b949e] truncate">{meta.osLabel}</div>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-[#8b949e] group-hover:text-current shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: meta.color }} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Properties Panel
// ──────────────────────────────────────────────────────────────
function PropertiesPanel({
  device, links, devices, onHostnameChange, onOpenTerminal,
  onDelete, onLinkFrom, linkingFrom, onLinkCancel, onDeleteLink,
}: {
  device: LabDevice;
  links: LabLink[];
  devices: LabDevice[];
  onHostnameChange: (h: string) => void;
  onOpenTerminal: () => void;
  onDelete: () => void;
  onLinkFrom: () => void;
  linkingFrom: string | null;
  onLinkCancel: () => void;
  onDeleteLink: (id: string) => void;
}) {
  const meta = DEVICE_META[device.type];
  const deviceLinks = links.filter((l) => l.sourceId === device.id || l.targetId === device.id);
  const firstIface = Object.values(device.state.interfaces)[0];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          <DeviceIcon type={device.type} size={28} />
          <div>
            <div className="text-[11px] font-bold text-[#e6edf3]">{meta.label}</div>
            <div className="text-[9px] text-[#8b949e]">{meta.osLabel}</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Hostname */}
        <div>
          <label className="block text-[9px] text-[#8b949e] mb-1 uppercase tracking-wider">Hostname</label>
          <input
            value={device.hostname}
            onChange={(e) => onHostnameChange(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3] text-[11px] font-mono focus:outline-none focus:border-[#58a6ff]/50"
          />
        </div>

        {/* Model */}
        <div className="text-[10px] text-[#8b949e] space-y-1">
          <div>Model: <span className="text-[#e6edf3]">{meta.model}</span></div>
          <div>Vendor: <span style={{ color: meta.color }}>{meta.vendor}</span></div>
          {firstIface?.ip && <div>IP: <span className="text-[#3fb950] font-mono">{firstIface.ip}</span></div>}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onOpenTerminal}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold transition-colors"
            style={{ background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}40` }}
          >
            <Terminal className="w-3.5 h-3.5" />
            Open {device.type === "windows_pc" ? "Network Config" : "Terminal"}
          </button>

          {linkingFrom === device.id ? (
            <button
              onClick={onLinkCancel}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/40 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel Linking
            </button>
          ) : (
            <button
              onClick={onLinkFrom}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold bg-[#21262d] text-[#8b949e] border border-[#30363d] hover:text-[#e6edf3] transition-colors"
            >
              <Cable className="w-3.5 h-3.5" />
              Create Link From Here
            </button>
          )}

          <button
            onClick={onDelete}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold bg-[#f85149]/10 text-[#f85149] border border-[#f85149]/30 hover:bg-[#f85149]/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Device
          </button>
        </div>

        {/* Interfaces */}
        <div>
          <div className="text-[9px] text-[#8b949e] uppercase tracking-wider mb-2">Interfaces ({Object.keys(device.state.interfaces).length})</div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {Object.entries(device.state.interfaces).map(([name, iface]) => (
              <div key={name} className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#0d1117] border border-[#21262d] text-[9px] font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${iface.status === "up" ? "bg-[#3fb950]" : "bg-[#f85149]"}`} />
                <span className="text-[#8b949e] truncate flex-1">{name.replace("GigabitEthernet", "Gi").replace("FastEthernet", "Fa")}</span>
                <span className="text-[#3fb950]">{iface.ip || ""}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        {deviceLinks.length > 0 && (
          <div>
            <div className="text-[9px] text-[#8b949e] uppercase tracking-wider mb-2">Connected Links ({deviceLinks.length})</div>
            <div className="space-y-1">
              {deviceLinks.map((link) => {
                const peerId = link.sourceId === device.id ? link.targetId : link.sourceId;
                const peer = devices.find((d) => d.id === peerId);
                return (
                  <div key={link.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#0d1117] border border-[#21262d] text-[9px] font-mono">
                    <span className="w-2 h-0.5 rounded" style={{ background: LINK_COLORS[link.linkType] }} />
                    <span className="text-[#8b949e]">{link.linkType}</span>
                    <ChevronRight className="w-3 h-3 text-[#30363d]" />
                    <span className="text-[#e6edf3] flex-1">{peer?.hostname || "?"}</span>
                    <button onClick={() => onDeleteLink(link.id)} className="text-[#f85149] hover:text-[#ff6b6b]">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Lab Settings Panel
// ──────────────────────────────────────────────────────────────
function LabSettingsPanel({
  labName, labDesc, onNameChange, onDescChange, devices, links,
}: {
  labName: string;
  labDesc: string;
  onNameChange: (v: string) => void;
  onDescChange: (v: string) => void;
  devices: LabDevice[];
  links: LabLink[];
}) {
  const inputCls = "w-full px-2.5 py-1.5 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3] text-[11px] font-mono focus:outline-none focus:border-[#58a6ff]/50";

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      <div className="text-[10px] text-[#8b949e] uppercase tracking-wider">Lab Settings</div>

      <div>
        <label className="block text-[9px] text-[#8b949e] mb-1 uppercase tracking-wider">Lab Name</label>
        <input value={labName} onChange={(e) => onNameChange(e.target.value)} className={inputCls} />
      </div>

      <div>
        <label className="block text-[9px] text-[#8b949e] mb-1 uppercase tracking-wider">Description</label>
        <textarea
          value={labDesc} onChange={(e) => onDescChange(e.target.value)}
          rows={3}
          className={`${inputCls} resize-none`}
          placeholder="What does this lab demonstrate?"
        />
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-[#30363d] p-3 space-y-2">
        <div className="text-[9px] text-[#8b949e] uppercase tracking-wider">Lab Summary</div>
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
          <div className="text-[#8b949e]">Devices:</div>
          <div className="text-[#e6edf3]">{devices.length}</div>
          <div className="text-[#8b949e]">Links:</div>
          <div className="text-[#e6edf3]">{links.length}</div>
          <div className="text-[#8b949e]">Cisco:</div>
          <div className="text-[#58a6ff]">{devices.filter((d) => ["cisco_router", "cisco_switch", "cisco_asa", "cisco_nexus"].includes(d.type)).length}</div>
          <div className="text-[#8b949e]">Firewalls:</div>
          <div className="text-[#f85149]">{devices.filter((d) => ["cisco_asa", "sophos_xg", "palo_alto", "fortinet"].includes(d.type)).length}</div>
          <div className="text-[#8b949e]">Endpoints:</div>
          <div className="text-[#d2a8ff]">{devices.filter((d) => ["windows_pc", "linux_server"].includes(d.type)).length}</div>
        </div>
      </div>

      {/* Keyboard shortcuts */}
      <div className="rounded-lg border border-[#30363d] p-3 space-y-2">
        <div className="text-[9px] text-[#8b949e] uppercase tracking-wider">Canvas Shortcuts</div>
        <div className="space-y-1.5 text-[9px] font-mono text-[#8b949e]">
          <div className="flex justify-between"><span>Double-click device</span><span className="text-[#58a6ff]">Open terminal</span></div>
          <div className="flex justify-between"><span>Drag device</span><span className="text-[#58a6ff]">Move</span></div>
          <div className="flex justify-between"><span>Scroll</span><span className="text-[#58a6ff]">Zoom</span></div>
          <div className="flex justify-between"><span>Drag canvas</span><span className="text-[#58a6ff]">Pan</span></div>
          <div className="flex justify-between"><span>Double-click link</span><span className="text-[#f85149]">Delete link</span></div>
        </div>
      </div>
    </div>
  );
}
