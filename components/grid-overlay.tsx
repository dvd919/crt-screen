"use client"

import { useEffect, useState, useCallback } from "react"
import { GRID_N_COLS, GRID_N_COLS_MOBILE, GRID_N_ROWS, GRID_BLEND, GRID_CURV_K, warpPoint } from "@/lib/grid-constants"
import { GRID_ITEMS } from "@/lib/grid-items"
import { usePan } from "@/lib/pan-context"

const NODE_PAD = 8  // gap between node edge and cell boundary

const FAVICON_DEFAULT = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90' font-family='monospace'>?</text></svg>"

function setFavicon(href: string) {
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
  if (!link) {
    link = document.createElement("link")
    link.rel = "icon"
    document.head.appendChild(link)
  }
  link.href = href
}

export function GridOverlay() {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null)
  const { pan, didDragRef } = usePan()

  useEffect(() => {
    const update = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  useEffect(() => {
    setFavicon(FAVICON_DEFAULT)
  }, [])

  const handleItemClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, copyText?: string, hoverText?: string) => {
    if (didDragRef.current) { e.preventDefault(); return }
    if (hoverText) { e.preventDefault(); return }
    if (copyText) {
      e.preventDefault()
      navigator.clipboard.writeText(copyText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [didDragRef])

  if (!dims) return null

  const { w, h } = dims
  const isMobile = w < 768
  const nCols = isMobile ? GRID_N_COLS_MOBILE : GRID_N_COLS
  const nRows = GRID_N_ROWS

  const cellSize = Math.max(w / nCols, h / nRows) * 0.72  // square cells, zoomed out
  const cellW = cellSize
  const cellH = cellSize

  // Normalize pan to [0, worldSize) so k ∈ {-1,0,1} always covers the wrap
  const worldW = nCols * cellW
  const worldH = nRows * cellH
  const panX = ((pan.x % worldW) + worldW) % worldW
  const panY = ((pan.y % worldH) + worldH) % worldH

  const colToX = (c: number): number => {
    const f = (c * cellW - panX) / w
    const s = f * f * (3 - 2 * f)
    return (f * (1 - GRID_BLEND) + s * GRID_BLEND) * w
  }

  const rowToY = (r: number): number => {
    const f = (r * cellH - panY) / h
    const s = f * f * (3 - 2 * f)
    return (f * (1 - GRID_BLEND) + s * GRID_BLEND) * h
  }

  const nodes: React.ReactNode[] = []

  for (let i = 0; i < GRID_ITEMS.length; i++) {
    const item = GRID_ITEMS[i]
    if (item.col + item.colSpan > nCols || item.row + item.rowSpan > nRows) continue

    const baseCenterCol = item.col + item.colSpan / 2
    const baseCenterRow = item.row + item.rowSpan / 2

    for (let kCol = -1; kCol <= 1; kCol++) {
      for (let kRow = -1; kRow <= 1; kRow++) {
        const vCenterCol = baseCenterCol + kCol * nCols
        const vCenterRow = baseCenterRow + kRow * nRows

        // Cull on f directly — prevents smooth-step from receiving out-of-range inputs
        // which cause the glitch (non-monotonic values placing nodes at wrong positions)
        const fCol = (vCenterCol * cellW - panX) / w
        const fRow = (vCenterRow * cellH - panY) / h
        if (fCol < -0.1 || fCol > 1.1 || fRow < -0.1 || fRow > 1.1) continue

        const cx = colToX(vCenterCol)
        const cy = rowToY(vCenterRow)

        // Cell span in screen space — drives node size
        const spanW = colToX(item.col + item.colSpan + kCol * nCols) - colToX(item.col + kCol * nCols)
        const spanH = rowToY(item.row + item.rowSpan + kRow * nRows) - rowToY(item.row + kRow * nRows)
        const nodeW = Math.max(spanW - NODE_PAD, 12)
        const nodeH = Math.max(spanH - NODE_PAD, 12)

        const pt = warpPoint(cx, cy, w, h)

        if (pt.x < -nodeW || pt.x > w + nodeW || pt.y < -nodeH || pt.y > h + nodeH) continue

        const iconSize = Math.max(12, Math.min(nodeW, nodeH) * 0.5)
        const floatDelay = ((i * 0.37 + kCol * 0.61 + kRow * 0.83) % 1) * 3
        const floatDuration = 2.8 + ((i * 0.53 + kCol * 0.29) % 1) * 1.2

        // Local Jacobian of warpPoint → skew angles matching the grid curvature
        const nx = (cx / w - 0.5) * 2
        const ny = (cy / h - 0.5) * 2
        const skewXDeg = Math.atan(GRID_CURV_K * nx * Math.cos(Math.PI * cy / h) * Math.PI * w / (2 * h)) * 180 / Math.PI
        const skewYDeg = Math.atan(GRID_CURV_K * ny * Math.cos(Math.PI * cx / w) * Math.PI * h / (2 * w)) * 180 / Math.PI

        nodes.push(
          <div
            key={`${i}-${kCol}-${kRow}`}
            className="absolute hover:scale-[1.06] active:scale-[0.95] transition-transform duration-150"
            style={{
              left: pt.x - nodeW / 2,
              top: pt.y - nodeH / 2,
              width: nodeW,
              height: nodeH,
              pointerEvents: "auto",
            }}
          >
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => handleItemClick(e, item.copyText, item.hoverText)}
              className="grid-node flex w-full h-full items-center justify-center"
              onMouseEnter={() => { setHoveredLabel(item.hoverText ? `~~${item.hoverText}` : item.copyText ? `${item.label}||${item.copyText}` : item.label); setFavicon(item.hoverText ? FAVICON_DEFAULT : item.favicon) }}
              onMouseLeave={() => { setHoveredLabel(null); setFavicon(FAVICON_DEFAULT) }}
              style={{
                ["--node-skew-x" as string]: `${skewXDeg.toFixed(2)}deg`,
                ["--node-skew-y" as string]: `${skewYDeg.toFixed(2)}deg`,
                animation: `node-float ${floatDuration}s ease-in-out ${floatDelay}s infinite`,
              }}
            >
              <img src={item.favicon} alt={item.label} width={iconSize} height={iconSize} className="grid-icon" style={{ width: iconSize, height: iconSize, objectFit: "contain", display: "block" }} />
            </a>
          </div>
        )
      }
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      {hoveredLabel && !copied && (
        <div style={{
          position: "fixed",
          top: "30%",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "var(--font-geist-mono, monospace)",
          letterSpacing: "0.2em",
          color: "rgba(0,0,0,0.5)",
          pointerEvents: "none",
          zIndex: 9998,
          textAlign: "center",
          whiteSpace: "nowrap",
          textTransform: hoveredLabel?.startsWith("~~") ? "none" : "uppercase",
        }}>
          <div style={{ fontSize: 16 }}>{hoveredLabel?.startsWith("~~") ? hoveredLabel.slice(2) : hoveredLabel?.split("||")[0]}</div>
          {hoveredLabel?.includes("||") && (
            <div style={{ fontSize: 20, marginTop: 4, letterSpacing: "0.15em", textTransform: "none" }}>{hoveredLabel.split("||")[1]}</div>
          )}
        </div>
      )}
      {copied && (
        <div style={{
          position: "fixed",
          top: "30%",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "var(--font-geist-mono, monospace)",
          letterSpacing: "0.2em",
          color: "rgba(0,0,0,0.5)",
          pointerEvents: "none",
          zIndex: 9998,
          textAlign: "center",
          animation: "copied-fade 1.5s ease forwards",
        }}>
          <div style={{ fontSize: 16 }}>COPIED</div>
          <div style={{ fontSize: 20, marginTop: 6 }}>david@jue.ng</div>
        </div>
      )}
      <style>{`
        @keyframes node-float {
          0%, 100% { transform: translateY(0px) skewX(var(--node-skew-x)) skewY(var(--node-skew-y)); }
          50% { transform: translateY(-8px) skewX(var(--node-skew-x)) skewY(var(--node-skew-y)); }
        }
        .grid-icon {
          filter: grayscale(1);
          opacity: 0.45;
          transition: filter 0.25s ease, opacity 0.25s ease;
        }
        .grid-node:hover .grid-icon {
          filter: grayscale(0);
          opacity: 1;
        }
        @keyframes copied-fade {
          0%   { opacity: 0; }
          10%  { opacity: 1; }
          70%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      {nodes}
    </div>
  )
}
