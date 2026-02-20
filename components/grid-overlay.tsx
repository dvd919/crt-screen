"use client"

import { useEffect, useState, useCallback } from "react"
import { GRID_N_COLS, GRID_N_COLS_MOBILE, GRID_BLEND, warpPoint } from "@/lib/grid-constants"
import { GRID_ITEMS } from "@/lib/grid-items"
import { usePan } from "@/lib/pan-context"

const NODE_SIZE = 62

export function GridOverlay() {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const { pan, didDragRef } = usePan()

  useEffect(() => {
    const update = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const handleItemClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (didDragRef.current) e.preventDefault()
  }, [didDragRef])

  if (!dims) return null

  const { w, h } = dims
  const isMobile = w < 768
  const nCols = isMobile ? GRID_N_COLS_MOBILE : GRID_N_COLS
  const nRows = Math.round(nCols * h / w)

  const cellW = w / nCols
  const cellH = h / nRows

  // Normalize pan to [0, worldSize) so k ∈ {-1,0,1} always covers the wrap
  const worldW = nCols * cellW  // = w
  const worldH = nRows * cellH  // = h
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
        const pt = warpPoint(cx, cy, w, h)

        if (pt.x < -NODE_SIZE || pt.x > w + NODE_SIZE || pt.y < -NODE_SIZE || pt.y > h + NODE_SIZE) continue

        nodes.push(
          <a
            key={`${i}-${kCol}-${kRow}`}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleItemClick}
            className="absolute transition-transform duration-150 hover:scale-[1.1] active:scale-[0.93]"
            style={{
              left: pt.x - NODE_SIZE / 2,
              top: pt.y - NODE_SIZE / 2,
              width: NODE_SIZE,
              height: NODE_SIZE,
              pointerEvents: "auto",
              borderRadius: 14,
              backdropFilter: "blur(20px) saturate(160%)",
              WebkitBackdropFilter: "blur(20px) saturate(160%)",
              background: "rgba(255,255,255,0.10)",
              border: "none",
              boxShadow: [
                "0 0 0 0.5px rgba(255,255,255,0.22)",
                "inset 0 0 0 0.5px rgba(255,255,255,0.12)",
                "inset 0 1.5px 0 rgba(255,255,255,0.45)",
                "inset 0 -1px 0 rgba(0,0,0,0.10)",
                "0 8px 32px rgba(0,0,0,0.22)",
              ].join(", "),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              overflow: "hidden",
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
            <span
              style={{
                fontSize: 8,
                fontFamily: "var(--font-geist-mono, monospace)",
                color: "rgba(0,0,0,0.7)",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
              }}
            >
              {item.label}
            </span>
          </a>
        )
      }
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      {nodes}
    </div>
  )
}
