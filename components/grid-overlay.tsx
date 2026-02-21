"use client"

import { useEffect, useState, useCallback, useRef } from "react"
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
  const [found, setFound] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("jueng-found")
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })
  const [glitched, setGlitched] = useState(false)
  const [glitching, setGlitching] = useState(false)
  const [pulseTime, setPulseTime] = useState(0)
  const suckStartMsRef = useRef<number | null>(null)
  const [endPhase, setEndPhase] = useState(0)  // 0=none 1=blackout 2=thankyou 3=tvstatic
  const { pan, didDragRef, bhRevealedRef } = usePan()

  useEffect(() => {
    const update = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  useEffect(() => {
    setFavicon(FAVICON_DEFAULT)
  }, [])

  const handleItemClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, label: string, copyText?: string, hoverText?: string) => {
    if (didDragRef.current) { e.preventDefault(); return }
    setFound(prev => {
      const next = new Set(prev).add(label)
      try { localStorage.setItem("jueng-found", JSON.stringify([...next])) } catch {}
      return next
    })
    if (hoverText) { e.preventDefault(); return }
    if (copyText) {
      e.preventDefault()
      navigator.clipboard.writeText(copyText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [didDragRef])

  useEffect(() => {
    let raf: number
    const tick = (t: number) => {
      setPulseTime(t * 0.001)  // ms → seconds
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const total = GRID_ITEMS.length
  const visibleTotal = total - 1          // excludes the secret BH
  const bhRevealed = found.size >= visibleTotal
  bhRevealedRef.current = bhRevealed

  useEffect(() => {
    if (found.size >= visibleTotal && visibleTotal > 0 && !glitched) {
      setGlitched(true)
      setGlitching(true)
      setTimeout(() => {
        setGlitching(false)
        // start suck 500ms after glitch ends
        setTimeout(() => { suckStartMsRef.current = Date.now() }, 500)
      }, 2000)
    }
  }, [found, visibleTotal, glitched])


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

  // Pre-compute all visible BH copy positions for gravitational lens
  const bhItem = GRID_ITEMS.find(i => i.label === "BlackHole")
  const bhCopies: { x: number; y: number }[] = []
  if (bhItem && bhItem.col + bhItem.colSpan <= nCols && bhItem.row + bhItem.rowSpan <= nRows) {
    const bhCenterCol = bhItem.col + bhItem.colSpan / 2
    const bhCenterRow = bhItem.row + bhItem.rowSpan / 2
    for (let kc = -1; kc <= 1; kc++) {
      for (let kr = -1; kr <= 1; kr++) {
        const vCol = bhCenterCol + kc * nCols
        const vRow = bhCenterRow + kr * nRows
        const fCol = (vCol * cellW - panX) / w
        const fRow = (vRow * cellH - panY) / h
        if (fCol < -1.5 || fCol > 2.5 || fRow < -1.5 || fRow > 2.5) continue
        const bhCx = colToX(vCol)
        const bhCy = rowToY(vRow)
        const bhWpt = warpPoint(bhCx, bhCy, w, h)
        bhCopies.push({ x: bhWpt.x, y: bhWpt.y })
      }
    }
  }

  // Suck phase: 0 = none, 0→1 over 2.5s, stays at 1
  const suckPhase = suckStartMsRef.current !== null
    ? Math.min(1, (Date.now() - suckStartMsRef.current) / 2000)
    : 0

  // Closest BH copy to screen center — suck target
  const bhSuckTarget = bhCopies.reduce<{ x: number; y: number } | null>((best, bh) => {
    if (!best) return bh
    return (bh.x - w / 2) ** 2 + (bh.y - h / 2) ** 2 < (best.x - w / 2) ** 2 + (best.y - h / 2) ** 2 ? bh : best
  }, null) ?? { x: w / 2, y: h / 2 }

  const nodes: React.ReactNode[] = []

  for (let i = 0; i < GRID_ITEMS.length; i++) {
    const item = GRID_ITEMS[i]
    if (item.col + item.colSpan > nCols || item.row + item.rowSpan > nRows) continue
    if (item.label === "BlackHole" && !bhRevealed) continue

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

        // Gravitational lens / suck
        let lx = pt.x, ly = pt.y
        let localPhase = 0  // per-icon stagger phase
        if (item.label !== "BlackHole" && bhCopies.length > 0 && bhRevealed) {
          // Lens offset always computed so suck can blend from it smoothly (no snap on transition)
          const pulse = 1 + 0.5 * Math.sin(pulseTime * 2.2)
          let lensOffsetX = 0, lensOffsetY = 0
          for (const bh of bhCopies) {
            const dx = pt.x - bh.x
            const dy = pt.y - bh.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist > 2) {
              const strength = 5000 * pulse / (dist + 45)
              lensOffsetX += (dx / dist) * strength
              lensOffsetY += (dy / dist) * strength
            }
          }

          if (suckPhase > 0) {
            const dx0 = pt.x - bhSuckTarget.x
            const dy0 = pt.y - bhSuckTarget.y
            const dist0 = Math.sqrt(dx0 * dx0 + dy0 * dy0)
            const angle0 = Math.atan2(dy0, dx0)

            // Stagger: closer icons start earlier (delay 0–0.2 based on normalized distance)
            const maxScreenDist = Math.sqrt(w * w + h * h)
            const itemDelay = Math.min(0.2, dist0 / maxScreenDist * 0.6)
            localPhase = Math.max(0, Math.min(1, (suckPhase - itemDelay) / (1 - itemDelay)))
            const pull = localPhase * localPhase  // ease-in-quad: immediate constant-acceleration feel

            // Wavy infall — angle oscillates rather than spinning in one direction
            const waveFreq = 2.2 + (i * 0.31 + kCol * 0.47) % 1.2
            const currentAngle = angle0 + 0.5 * Math.sin(waveFreq * localPhase * Math.PI * 2)
            const currentDist  = dist0 * (1 - pull)

            lx = bhSuckTarget.x + currentDist * Math.cos(currentAngle)
            ly = bhSuckTarget.y + currentDist * Math.sin(currentAngle)

            // Blend lens offset out as icon gets pulled in — prevents snap at suck start
            lx += lensOffsetX * (1 - localPhase)
            ly += lensOffsetY * (1 - localPhase)
          } else {
            lx = pt.x + lensOffsetX
            ly = pt.y + lensOffsetY
          }
        }

        const isSuckedOut = localPhase > 0 && item.label !== "BlackHole"
        const nodeOpacity = localPhase < 0.8
          ? 1
          : Math.max(0, 1 - (localPhase - 0.8) / 0.2)

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
              left: lx - nodeW / 2,
              top: ly - nodeH / 2,
              width: nodeW,
              height: nodeH,
              opacity: nodeOpacity,
              transform: isSuckedOut ? `scale(${Math.max(0.05, 1 - localPhase * 0.95)})` : undefined,
              pointerEvents: isSuckedOut && localPhase > 0.8 ? "none" : "auto",
            }}
          >
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (item.label === "BlackHole") {
                  e.preventDefault()
                  if (suckPhase >= 1 && endPhase === 0) {
                    setEndPhase(1)
                    setTimeout(() => setEndPhase(2), 2000)
                    setTimeout(() => setEndPhase(3), 4000)
                    setTimeout(() => {
                      try { localStorage.removeItem("jueng-found") } catch {}
                      window.location.reload()
                    }, 5500)
                  }
                  return
                }
                handleItemClick(e, item.label, item.copyText, item.hoverText)
              }}
              className="grid-node flex w-full h-full items-center justify-center"
              onMouseEnter={() => { setHoveredLabel(item.hoverText ? `~~${item.hoverText}` : item.copyText ? `${item.label}||${item.copyText}` : item.label); setFavicon(item.hoverText ? FAVICON_DEFAULT : item.favicon) }}
              onMouseLeave={() => { setHoveredLabel(null); setFavicon(FAVICON_DEFAULT) }}
              style={{
                ["--node-skew-x" as string]: `${skewXDeg.toFixed(2)}deg`,
                ["--node-skew-y" as string]: `${skewYDeg.toFixed(2)}deg`,
                animation: `node-float ${floatDuration}s ease-in-out ${floatDelay}s infinite`,
              }}
            >
              {item.label === "BlackHole" ? (() => {
                const s = Math.min(nodeW, nodeH)
                return (
                  <div style={{ position: "relative", width: "100%", height: "100%" }}>
                    {/* Gravitational warp field — large conic gradient that rotates slowly */}
                    <div style={{
                      position: "absolute",
                      width: `${nodeW * 4}px`, height: `${nodeH * 4}px`,
                      top: "50%", left: "50%",
                      marginTop: `${-nodeH * 2}px`, marginLeft: `${-nodeW * 2}px`,
                      borderRadius: "50%",
                      background: "conic-gradient(from 0deg, transparent, rgba(0,0,0,0.07), transparent 30%, rgba(0,0,0,0.05) 50%, transparent 65%, rgba(0,0,0,0.08) 80%, transparent)",
                      animation: "bh-warp-spin 18s linear infinite",
                      pointerEvents: "none",
                    }} />
                    {/* Gravitational wave ring 1 */}
                    <div style={{
                      position: "absolute",
                      width: `${s}px`, height: `${s}px`,
                      top: "50%", left: "50%",
                      marginTop: `${-s / 2}px`, marginLeft: `${-s / 2}px`,
                      borderRadius: "50%",
                      border: "1px solid rgba(0,0,0,0.4)",
                      animation: "bh-ring-expand 3s ease-out infinite",
                      pointerEvents: "none",
                    }} />
                    {/* Gravitational wave ring 2 (staggered) */}
                    <div style={{
                      position: "absolute",
                      width: `${s}px`, height: `${s}px`,
                      top: "50%", left: "50%",
                      marginTop: `${-s / 2}px`, marginLeft: `${-s / 2}px`,
                      borderRadius: "50%",
                      border: "1px solid rgba(0,0,0,0.22)",
                      animation: "bh-ring-expand 3s ease-out 1.5s infinite",
                      pointerEvents: "none",
                    }} />
                    {/* Accretion disk — flattened ellipse spinning */}
                    <div style={{
                      position: "absolute",
                      width: `${s * 1.05}px`, height: `${s * 1.05}px`,
                      top: "50%", left: "50%",
                      marginTop: `${-s * 1.05 / 2}px`, marginLeft: `${-s * 1.05 / 2}px`,
                      borderRadius: "50%",
                      borderLeft: "2px solid rgba(0,0,0,0.55)",
                      borderRight: "2px solid rgba(0,0,0,0.55)",
                      borderTop: "2px solid rgba(0,0,0,0.1)",
                      borderBottom: "2px solid rgba(0,0,0,0.1)",
                      animation: "bh-disk-orbit 4s linear infinite",
                      pointerEvents: "none",
                    }} />
                    {/* Event horizon */}
                    <div style={{
                      position: "absolute",
                      width: `${s * 0.52}px`, height: `${s * 0.52}px`,
                      top: "50%", left: "50%",
                      marginTop: `${-s * 0.52 / 2}px`, marginLeft: `${-s * 0.52 / 2}px`,
                      borderRadius: "50%",
                      background: "radial-gradient(circle, #000 60%, rgba(0,0,0,0.6) 82%, transparent 100%)",
                      animation: "bh-core-pulse 2.5s ease-in-out infinite",
                      pointerEvents: "none",
                    }} />
                  </div>
                )
              })() : (
                <img src={item.favicon} alt={item.label} width={iconSize} height={iconSize} className="grid-icon" style={{ width: iconSize, height: iconSize, objectFit: "contain", display: "block" }} />
              )}
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
      <div style={{
        position: "fixed",
        bottom: "5%",
        left: "50%",
        transform: "translateX(-50%)",
        fontFamily: "var(--font-geist-mono, monospace)",
        fontSize: 11,
        letterSpacing: "0.2em",
        color: "rgba(0,0,0,0.35)",
        pointerEvents: "none",
        zIndex: 9998,
      }}>
        {Math.min(found.size, visibleTotal)}/{visibleTotal}
      </div>
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
        @keyframes glitch-screen {
          0%   { background: transparent; transform: translateX(0); }
          8%   { background: rgba(0,0,0,0.85); transform: translateX(-4px); }
          12%  { background: transparent; transform: translateX(6px); }
          18%  { background: rgba(0,0,0,0.6); transform: translateX(-2px); }
          24%  { background: transparent; transform: translateX(0); }
          30%  { background: rgba(0,0,0,0.06); }
          100% { background: rgba(0,0,0,0.06); }
        }
        @keyframes access-granted {
          0%   { opacity: 0; }
          25%  { opacity: 0; }
          30%  { opacity: 1; }
          75%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes bh-warp-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes bh-disk-orbit {
          from { transform: scaleY(0.28) rotate(0deg); }
          to   { transform: scaleY(0.28) rotate(360deg); }
        }
        @keyframes bh-ring-expand {
          0%   { transform: scale(1);   opacity: 0.55; }
          100% { transform: scale(3);   opacity: 0; }
        }
        @keyframes bh-core-pulse {
          0%, 100% { transform: scale(1);    box-shadow: 0 0 8px 3px rgba(0,0,0,0.7); }
          50%      { transform: scale(1.08);  box-shadow: 0 0 18px 8px rgba(0,0,0,0.85); }
        }
        @keyframes end-blackout {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes end-thankyou {
          0%   { opacity: 0; letter-spacing: 0.6em; }
          20%  { opacity: 1; letter-spacing: 0.4em; }
          75%  { opacity: 1; letter-spacing: 0.4em; }
          100% { opacity: 0; letter-spacing: 0.4em; }
        }
        @keyframes end-tv-static {
          0%   { background: #000; }
          7%   { background: #fff; }
          13%  { background: #111; }
          19%  { background: #ccc; }
          25%  { background: #000; }
          31%  { background: #aaa; }
          37%  { background: #fff; }
          43%  { background: #000; }
          49%  { background: #888; }
          55%  { background: #fff; }
          61%  { background: #222; }
          67%  { background: #fff; }
          73%  { background: #000; }
          79%  { background: #fff; }
          100% { background: #fff; }
        }
        @keyframes end-tv-expand {
          0%   { clip-path: inset(49.5% 0 49.5% 0); filter: brightness(6); }
          8%   { clip-path: inset(49%   0 49%   0); filter: brightness(8); }
          65%  { clip-path: inset(0%); filter: brightness(2); }
          100% { clip-path: inset(0%); filter: brightness(1); }
        }
      `}</style>
      {glitching && (
        <div style={{
          position: "fixed", inset: 0,
          zIndex: 9999,
          pointerEvents: "none",
          animation: "glitch-screen 2s steps(1) forwards",
        }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            fontFamily: "var(--font-geist-mono, monospace)",
            fontSize: 14, letterSpacing: "0.3em",
            color: "rgba(0,0,0,0.7)",
            animation: "access-granted 2s ease forwards",
            whiteSpace: "nowrap",
          }}>
            ACCESS GRANTED
          </div>
        </div>
      )}
      {nodes}
      {endPhase >= 1 && (
        <div style={{
          position: "fixed", inset: 0,
          zIndex: 99999,
          pointerEvents: "all",
          background: "#000",
          animation: endPhase === 1 ? "end-blackout 0.4s ease forwards" : undefined,
        }}>
          {endPhase === 2 && (
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: 13,
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.88)",
              whiteSpace: "nowrap",
            }}>
              thank you!
            </div>
          )}
          {endPhase === 3 && (
            <>
              <div style={{
                position: "absolute", inset: 0,
                animation: "end-tv-static 1.5s steps(1) forwards",
              }} />
              <div style={{
                position: "absolute", inset: 0,
                background: "#fff",
                animation: "end-tv-expand 1.5s cubic-bezier(0.3, 0, 0.3, 1) forwards",
              }} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
