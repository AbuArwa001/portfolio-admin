"use client";

import * as React from "react";
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from "lucide-react";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
export interface TopologyNode {
  id: string;
  label: string;
  type: "router" | "switch" | "l3switch" | "pc" | "server" | "cloud" | "firewall" | "ap";
  x: number;
  y: number;
  ip?: string;
  vlan?: number;
  status?: "up" | "down" | "warning";
}

export interface TopologyLink {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: "ethernet" | "serial" | "fiber" | "trunk" | "dot1q";
  status?: "up" | "down";
}

interface NetworkTopologyCanvasProps {
  svgData?: string;          // raw SVG from backend
  nodes?: TopologyNode[];    // structured nodes for interactive mode
  links?: TopologyLink[];    // structured links
  className?: string;
  readOnly?: boolean;
  title?: string;
}

// ──────────────────────────────────────────────────────────────
// Device SVG icons
// ──────────────────────────────────────────────────────────────
function RouterIcon({ size = 40, color = "#58a6ff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="#0d1117" stroke={color} strokeWidth="1.5" />
      <circle cx="20" cy="20" r="10" fill="none" stroke={color} strokeWidth="1.2" />
      <line x1="2" y1="20" x2="38" y2="20" stroke={color} strokeWidth="1.2" />
      <line x1="20" y1="2" x2="20" y2="38" stroke={color} strokeWidth="1.2" />
      <ellipse cx="20" cy="20" rx="7" ry="13" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

function SwitchIcon({ size = 40, color = "#3fb950" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="2" y="12" width="36" height="16" rx="4" fill="#0d1117" stroke={color} strokeWidth="1.5" />
      {[8, 13, 18, 23, 28, 33].map((x, i) => (
        <rect key={i} x={x - 2} y="16" width="4" height="8" rx="1" fill={color} opacity="0.7" />
      ))}
      <path d="M8 8 L32 8" stroke={color} strokeWidth="1.2" strokeDasharray="2 2" />
      <path d="M8 32 L32 32" stroke={color} strokeWidth="1.2" strokeDasharray="2 2" />
      <path d="M6 8 L6 12" stroke={color} strokeWidth="1.2" />
      <path d="M34 8 L34 12" stroke={color} strokeWidth="1.2" />
      <path d="M6 32 L6 28" stroke={color} strokeWidth="1.2" />
      <path d="M34 32 L34 28" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

function PcIcon({ size = 40, color = "#d2a8ff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="4" y="6" width="24" height="18" rx="2" fill="#0d1117" stroke={color} strokeWidth="1.5" />
      <rect x="6" y="8" width="20" height="14" rx="1" fill={color} opacity="0.15" />
      <path d="M14 24 L12 34" stroke={color} strokeWidth="1.5" />
      <path d="M18 24 L20 34" stroke={color} strokeWidth="1.5" />
      <rect x="9" y="34" width="14" height="2" rx="1" fill={color} />
    </svg>
  );
}

function ServerIcon({ size = 40, color = "#ffa657" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="6" y="4" width="28" height="10" rx="2" fill="#0d1117" stroke={color} strokeWidth="1.5" />
      <rect x="6" y="16" width="28" height="10" rx="2" fill="#0d1117" stroke={color} strokeWidth="1.5" />
      <circle cx="10" cy="9" r="2" fill={color} />
      <circle cx="10" cy="21" r="2" fill={color} />
      <rect x="16" y="7" width="14" height="4" rx="1" fill={color} opacity="0.4" />
      <rect x="16" y="19" width="14" height="4" rx="1" fill={color} opacity="0.4" />
      <path d="M14 26 L14 36" stroke={color} strokeWidth="1.5" />
      <path d="M26 26 L26 36" stroke={color} strokeWidth="1.5" />
      <rect x="10" y="36" width="20" height="2" rx="1" fill={color} />
    </svg>
  );
}

function FirewallIcon({ size = 40, color = "#f85149" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M20 2 L36 10 L36 24 C36 32 20 38 20 38 C20 38 4 32 4 24 L4 10 Z" fill="#0d1117" stroke={color} strokeWidth="1.5" />
      <path d="M20 8 C20 8 14 14 14 20 C14 22 16 24 20 24 C24 24 26 22 26 20 C26 14 20 8 20 8Z" fill={color} opacity="0.6" />
    </svg>
  );
}

function CloudIcon({ size = 40, color = "#8b949e" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M30 26 C34 26 37 23 37 19 C37 15 34 12 30 12 C29 8 26 5 22 5 C17 5 13 9 13 14 C10 14 7 17 7 20 C7 23 10 26 13 26 Z" fill="#0d1117" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function getNodeIcon(type: TopologyNode["type"], status: string) {
  const statusColor = status === "down" ? "#f85149" : status === "warning" ? "#d29922" : undefined;
  switch (type) {
    case "router": return <RouterIcon color={statusColor || "#58a6ff"} />;
    case "switch": return <SwitchIcon color={statusColor || "#3fb950"} />;
    case "l3switch": return <SwitchIcon color={statusColor || "#58a6ff"} size={42} />;
    case "pc": return <PcIcon color={statusColor || "#d2a8ff"} />;
    case "server": return <ServerIcon color={statusColor || "#ffa657"} />;
    case "firewall": return <FirewallIcon color={statusColor || "#f85149"} />;
    case "cloud": return <CloudIcon color={statusColor || "#8b949e"} />;
    default: return <PcIcon color={statusColor || "#d2a8ff"} />;
  }
}

// ──────────────────────────────────────────────────────────────
// Default sample topology (if no data provided)
// ──────────────────────────────────────────────────────────────
const SAMPLE_NODES: TopologyNode[] = [
  { id: "r1", label: "R1", type: "router", x: 300, y: 80, ip: "10.0.0.1/30", status: "up" },
  { id: "sw1", label: "SW1", type: "switch", x: 180, y: 200, status: "up" },
  { id: "sw2", label: "SW2", type: "switch", x: 420, y: 200, status: "up" },
  { id: "pc1", label: "PC1", type: "pc", x: 80, y: 320, ip: "192.168.10.2/24", status: "up" },
  { id: "pc2", label: "PC2", type: "pc", x: 240, y: 320, ip: "192.168.10.3/24", status: "up" },
  { id: "srv1", label: "Server", type: "server", x: 360, y: 320, ip: "192.168.20.2/24", status: "up" },
  { id: "pc3", label: "PC3", type: "pc", x: 520, y: 320, ip: "192.168.20.3/24", status: "down" },
];

const SAMPLE_LINKS: TopologyLink[] = [
  { id: "l1", source: "r1", target: "sw1", type: "trunk", label: "Gi0/0", status: "up" },
  { id: "l2", source: "r1", target: "sw2", type: "trunk", label: "Gi0/1", status: "up" },
  { id: "l3", source: "sw1", target: "pc1", label: "Fa0/1", status: "up" },
  { id: "l4", source: "sw1", target: "pc2", label: "Fa0/2", status: "up" },
  { id: "l5", source: "sw2", target: "srv1", label: "Fa0/1", status: "up" },
  { id: "l6", source: "sw2", target: "pc3", label: "Fa0/2", status: "down" },
];

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────
export function NetworkTopologyCanvas({
  svgData,
  nodes: externalNodes,
  links: externalLinks,
  className = "",
  readOnly = false,
  title = "NETWORK TOPOLOGY",
}: NetworkTopologyCanvasProps) {
  const [nodes, setNodes] = React.useState<TopologyNode[]>(externalNodes || SAMPLE_NODES);
  const [links] = React.useState<TopologyLink[]>(externalLinks || SAMPLE_LINKS);
  const [scale, setScale] = React.useState(1);
  const [panX, setPanX] = React.useState(0);
  const [panY, setPanY] = React.useState(0);
  const [dragging, setDragging] = React.useState<string | null>(null);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });
  const [animOffset, setAnimOffset] = React.useState(0);

  const svgRef = React.useRef<SVGSVGElement>(null);

  // Animate link dashes
  React.useEffect(() => {
    const id = setInterval(() => {
      setAnimOffset((prev) => (prev + 1) % 20);
    }, 50);
    return () => clearInterval(id);
  }, []);

  // ── If raw SVG is provided, render it directly ────────────────
  if (svgData && svgData.trim()) {
    return (
      <div className={`relative bg-[#0d1117] rounded-xl border border-[#30363d] overflow-hidden ${className}`}>
        <div className="absolute top-3 left-3 text-[10px] font-mono text-[#58a6ff] uppercase tracking-wider flex items-center gap-1.5 z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
          {title}
        </div>
        <div
          className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full"
          dangerouslySetInnerHTML={{ __html: svgData }}
        />
      </div>
    );
  }

  // ── Interactive canvas ────────────────────────────────────────
  const getNodePos = (id: string) => {
    const n = nodes.find((n) => n.id === id);
    return n ? { x: n.x, y: n.y } : { x: 0, y: 0 };
  };

  function handleNodeMouseDown(e: React.MouseEvent, nodeId: string) {
    if (readOnly) return;
    e.stopPropagation();
    setDragging(nodeId);
    setSelectedNode(nodeId);
    const node = nodes.find((n) => n.id === nodeId)!;
    const rect = svgRef.current!.getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - rect.left) / scale - node.x - panX / scale,
      y: (e.clientY - rect.top) / scale - node.y - panY / scale,
    });
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (dragging) {
      const rect = svgRef.current!.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / scale - dragOffset.x - panX / scale;
      const ny = (e.clientY - rect.top) / scale - dragOffset.y - panY / scale;
      setNodes((prev) =>
        prev.map((n) => (n.id === dragging ? { ...n, x: nx, y: ny } : n))
      );
    } else if (isPanning) {
      setPanX(e.clientX - panStart.x);
      setPanY(e.clientY - panStart.y);
    }
  }

  function handleMouseUp() {
    setDragging(null);
    setIsPanning(false);
  }

  function handleSvgMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if (e.target === svgRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
      setSelectedNode(null);
    }
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.min(2.5, Math.max(0.3, prev * delta)));
  }

  const selectedNodeData = selectedNode ? nodes.find((n) => n.id === selectedNode) : null;

  const getLinkColor = (link: TopologyLink) => {
    if (link.status === "down") return "#f85149";
    switch (link.type) {
      case "trunk": return "#58a6ff";
      case "fiber": return "#3fb950";
      case "serial": return "#ffa657";
      default: return "#8b949e";
    }
  };

  return (
    <div className={`relative bg-[#0d1117] rounded-xl border border-[#30363d] overflow-hidden flex flex-col ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#58a6ff] uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
          {title}
          <span className="text-[#8b949e] normal-case tracking-normal ml-1">
            {nodes.length} devices • {links.length} links
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.min(2.5, s * 1.2))}
            className="p-1.5 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(0.3, s * 0.8))}
            className="p-1.5 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setScale(1); setPanX(0); setPanY(0); }}
            className="p-1.5 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          {!readOnly && (
            <button
              onClick={() => setNodes(externalNodes || SAMPLE_NODES)}
              className="p-1.5 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-16 left-3 z-10 flex flex-col gap-1 text-[9px] font-mono">
        {[
          { color: "#58a6ff", label: "Trunk / Router link" },
          { color: "#8b949e", label: "Ethernet" },
          { color: "#3fb950", label: "Fiber" },
          { color: "#f85149", label: "Down" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-[#8b949e]">
            <span style={{ background: color }} className="w-5 h-0.5 rounded block" />
            {label}
          </div>
        ))}
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="flex-1 w-full cursor-grab active:cursor-grabbing select-none"
        style={{ minHeight: 280 }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={handleSvgMouseDown}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#8b949e" />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${panX},${panY}) scale(${scale})`}>
          {/* Grid */}
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#161b22" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="3000" height="3000" x="-500" y="-500" fill="url(#grid)" />

          {/* Links */}
          {links.map((link) => {
            const src = getNodePos(link.source);
            const tgt = getNodePos(link.target);
            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2;
            const color = getLinkColor(link);
            const isTrunk = link.type === "trunk";
            const isDown = link.status === "down";

            return (
              <g key={link.id}>
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={color}
                  strokeWidth={isTrunk ? 2 : 1.5}
                  strokeDasharray={isDown ? "4 4" : isTrunk ? "none" : "none"}
                  strokeDashoffset={isDown ? animOffset : 0}
                  opacity={0.8}
                />
                {/* Animated packet on up links */}
                {!isDown && (
                  <circle r="2.5" fill={color} opacity="0.9" filter="url(#glow)">
                    <animateMotion
                      dur={`${2 + Math.random() * 2}s`}
                      repeatCount="indefinite"
                      path={`M ${src.x},${src.y} L ${tgt.x},${tgt.y}`}
                    />
                  </circle>
                )}
                {link.label && (
                  <text
                    x={midX}
                    y={midY - 6}
                    textAnchor="middle"
                    fontSize="8"
                    fill={color}
                    opacity="0.9"
                    className="pointer-events-none"
                  >
                    {link.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNode === node.id;
            const statusColor =
              node.status === "down" ? "#f85149" : node.status === "warning" ? "#d29922" : "#3fb950";

            return (
              <g
                key={node.id}
                transform={`translate(${node.x - 20},${node.y - 20})`}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={() => setSelectedNode(node.id)}
                style={{ cursor: readOnly ? "default" : "pointer" }}
              >
                {/* Selection ring */}
                {isSelected && (
                  <circle
                    cx="20"
                    cy="20"
                    r="26"
                    fill="none"
                    stroke="#58a6ff"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    opacity="0.8"
                  />
                )}

                {/* Device icon */}
                <foreignObject width="40" height="40">
                  {getNodeIcon(node.type, node.status || "up")}
                </foreignObject>

                {/* Status dot */}
                <circle cx="34" cy="6" r="4" fill={statusColor} />
                <circle cx="34" cy="6" r="4" fill={statusColor} opacity="0.4" filter="url(#glow)" />

                {/* Label */}
                <text
                  x="20"
                  y="52"
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fill="#e6edf3"
                  fontWeight="600"
                >
                  {node.label}
                </text>
                {node.ip && (
                  <text
                    x="20"
                    y="63"
                    textAnchor="middle"
                    fontSize="8"
                    fontFamily="monospace"
                    fill="#8b949e"
                  >
                    {node.ip}
                  </text>
                )}
                {node.vlan && (
                  <text
                    x="20"
                    y="72"
                    textAnchor="middle"
                    fontSize="8"
                    fontFamily="monospace"
                    fill="#58a6ff"
                  >
                    VLAN{node.vlan}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Node inspector panel */}
      {selectedNodeData && (
        <div className="absolute top-10 right-3 bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-[11px] font-mono min-w-[150px] z-20">
          <div className="text-[#58a6ff] font-bold mb-2 uppercase tracking-wider">
            {selectedNodeData.label}
          </div>
          <div className="space-y-1 text-[#8b949e]">
            <div>Type: <span className="text-[#e6edf3]">{selectedNodeData.type}</span></div>
            {selectedNodeData.ip && (
              <div>IP: <span className="text-[#3fb950]">{selectedNodeData.ip}</span></div>
            )}
            {selectedNodeData.vlan && (
              <div>VLAN: <span className="text-[#58a6ff]">{selectedNodeData.vlan}</span></div>
            )}
            <div>
              Status:{" "}
              <span
                className={
                  selectedNodeData.status === "up"
                    ? "text-[#3fb950]"
                    : selectedNodeData.status === "down"
                    ? "text-[#f85149]"
                    : "text-[#d29922]"
                }
              >
                {selectedNodeData.status || "up"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="mt-2 text-[10px] text-[#8b949e] hover:text-[#e6edf3]"
          >
            ✕ close
          </button>
        </div>
      )}

      {/* Controls hint */}
      <div className="px-3 py-1.5 bg-[#161b22] border-t border-[#30363d] text-[9px] font-mono text-[#8b949e] flex items-center gap-4">
        {!readOnly && <span>Drag nodes • </span>}
        <span>Scroll to zoom • </span>
        <span>Drag canvas to pan • </span>
        <span>Click node for details</span>
      </div>
    </div>
  );
}
