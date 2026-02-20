"use client"

import { useEffect, useRef, useCallback } from "react"

interface Ripple {
  x: number
  y: number
  t: number
  maxT: number
}

/* ── types ── */
interface MatrixColumn {
  x: number
  y: number
  speed: number
  chars: string[]
  opacity: number
  length: number
  fontSize: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  life: number
  maxLife: number
}

interface FloatingFragment {
  x: number
  y: number
  vx: number
  vy: number
  text: string
  opacity: number
  size: number
  life: number
  maxLife: number
  rotation: number
  rotationSpeed: number
}

/* ── constants ── */
const MATRIX_CHARS = "01アイウエオカキクケコサシスセソタチツテトナニヌネノ{}[]<>/:;=+-_|\\@#$%&*~"
const FRAGMENT_TEXTS = [
  "DROP::001",
  "//OVERRIDE",
  "SYSTEM.OUT",
  "NULL_PTR",
  "0xFF00FF",
  "VOID*",
  "INIT()",
  "STDOUT",
  "EXEC//",
  "::ROOT",
  "~/.CONFIG",
  "MALLOC()",
  "KERNEL",
  "BUFFER",
  "SIGNAL",
  "DAEMON",
  "THREAD",
  "ASYNC",
  "YIELD",
  "PORT:443",
  "SSH://",
  "REF*",
  "STACK",
  "HEAP",
  "$ENV",
  "RUN.SH",
  "ERR:0x0",
]

export function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const ripplesRef = useRef<Ripple[]>([])
  const animFrameRef = useRef<number>(0)
  const timeRef = useRef(0)
  const isMobileRef = useRef(false)

  /* ── matrix columns ── */
  const columnsRef = useRef<MatrixColumn[]>([])

  /* ── particles ── */
  const particlesRef = useRef<Particle[]>([])

  /* ── floating terminal fragments ── */
  const fragmentsRef = useRef<FloatingFragment[]>([])

  /* ── wave phase offsets ── */
  const wavePhaseRef = useRef(0)

  const createColumn = useCallback((x: number, h: number): MatrixColumn => {
    const length = Math.floor(Math.random() * 18) + 6
    return {
      x,
      y: Math.random() * h - h,
      speed: Math.random() * 1.2 + 0.3,
      chars: Array.from({ length }, () =>
        MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
      ),
      opacity: Math.random() * 0.12 + 0.03,
      length,
      fontSize: Math.random() > 0.7 ? 11 : 13,
    }
  }, [])

  const createParticle = useCallback((w: number, h: number): Particle => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.15,
    vy: (Math.random() - 0.5) * 0.15,
    radius: Math.random() * 1.2 + 0.3,
    opacity: Math.random() * 0.2 + 0.03,
    life: 0,
    maxLife: Math.random() * 800 + 400,
  }), [])

  const createFragment = useCallback((w: number, h: number): FloatingFragment => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.2,
    vy: (Math.random() - 0.5) * 0.12 - 0.06,
    text: FRAGMENT_TEXTS[Math.floor(Math.random() * FRAGMENT_TEXTS.length)],
    opacity: 0,
    size: Math.random() * 4 + 8,
    life: 0,
    maxLife: Math.random() * 500 + 300,
    rotation: (Math.random() - 0.5) * 0.15,
    rotationSpeed: (Math.random() - 0.5) * 0.0003,
  }), [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    let dpr = 1

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      isMobileRef.current = window.innerWidth < 768
      initSystems()
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleClick = (e: MouseEvent) => {
      ripplesRef.current.push({ x: e.clientX, y: e.clientY, t: 0, maxT: 800 })
    }

    const initSystems = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const mobile = isMobileRef.current

      // LAYER 1: Matrix columns
      const colSpacing = mobile ? 30 : 18
      columnsRef.current = []
      for (let x = 0; x < w; x += colSpacing) {
        if (Math.random() > (mobile ? 0.55 : 0.35)) {
          columnsRef.current.push(createColumn(x, h))
        }
      }

      // LAYER 2: Particle field
      const pCount = mobile ? 30 : 80
      particlesRef.current = Array.from({ length: pCount }, () => createParticle(w, h))

      // LAYER 3: Floating terminal fragments
      const fCount = mobile ? 4 : 10
      fragmentsRef.current = Array.from({ length: fCount }, () => createFragment(w, h))
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("click", handleClick)

    /* ─── LAYER 1: Generative Grid ─── */
    const drawGrid = (w: number, h: number, t: number) => {
      const nCols = isMobileRef.current ? 10 : 18
      const nRows = Math.round(nCols * h / w)
      const mobile = isMobileRef.current
      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const curvK = 0.12   // outward bow strength
      const blend = 0.5    // 0 = uniform spacing, 1 = full smoothstep (center-biggest)

      // Non-uniform positions: smoothstep remap makes center cells wider
      const genPos = (n: number, size: number): number[] => {
        const arr: number[] = []
        for (let i = 0; i <= n; i++) {
          const u = i / n
          const s = u * u * (3 - 2 * u)          // smoothstep
          arr.push((u * (1 - blend) + s * blend) * size)
        }
        return arr
      }

      const xs = genPos(nCols, w)
      const ys = genPos(nRows, h)
      const avgCellW = w / nCols
      const avgCellH = h / nRows

      ctx.save()

      // Ripples (screen space)
      ripplesRef.current = ripplesRef.current.filter(r => r.t < r.maxT)
      for (const r of ripplesRef.current) {
        r.t += 16
        const progress = r.t / r.maxT
        const radius = progress * w * 0.45
        ctx.beginPath()
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(0, 0, 0, ${(1 - progress) * 0.25})`
        ctx.lineWidth = 0.5
        ctx.stroke()
        if (progress > 0.1) {
          ctx.beginPath()
          ctx.arc(r.x, r.y, (progress - 0.1) * w * 0.45, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(0, 0, 0, ${(1 - progress) * 0.1})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }

      // Vertical lines
      // Each line bows outward (away from center) using sin curve — endpoints stay locked to screen top/bottom
      for (const gx of xs) {
        const nx = (gx / w - 0.5) * 2   // -1 to 1
        const distToMouse = Math.abs(mx - gx)
        const nearMouse = !mobile && distToMouse < avgCellW * 2
        const proximity = nearMouse ? Math.max(0, 1 - distToMouse / (avgCellW * 2)) : 0

        let rippleBoost = 0
        for (const r of ripplesRef.current) {
          const rp = r.t / r.maxT
          if (Math.abs(Math.abs(r.x - gx) - rp * w * 0.45) < avgCellW) {
            rippleBoost = Math.max(rippleBoost, (1 - rp) * 0.15)
          }
        }

        const pulse = Math.sin(t * 0.001 + gx * 0.01) * 0.5 + 0.5
        const alpha = 0.08 + pulse * 0.04 + proximity * 0.25 + rippleBoost
        ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`
        ctx.lineWidth = nearMouse ? 0.5 + proximity * 0.8 : 0.5
        ctx.beginPath()
        let first = true
        for (let y = 0; y <= h; y += 4) {
          // sin bow: 0 at top & bottom edges, max outward at vertical center
          const bow = curvK * nx * Math.sin(Math.PI * y / h)
          const sx = gx + bow * w * 0.5
          if (first) { ctx.moveTo(sx, y); first = false }
          else ctx.lineTo(sx, y)
        }
        ctx.stroke()
      }

      // Horizontal lines
      for (const gy of ys) {
        const ny = (gy / h - 0.5) * 2
        const distToMouse = Math.abs(my - gy)
        const nearMouse = !mobile && distToMouse < avgCellH * 2
        const proximity = nearMouse ? Math.max(0, 1 - distToMouse / (avgCellH * 2)) : 0

        let rippleBoost = 0
        for (const r of ripplesRef.current) {
          const rp = r.t / r.maxT
          if (Math.abs(Math.abs(r.y - gy) - rp * w * 0.45) < avgCellH) {
            rippleBoost = Math.max(rippleBoost, (1 - rp) * 0.15)
          }
        }

        const pulse = Math.sin(t * 0.0008 + gy * 0.008) * 0.5 + 0.5
        const alpha = 0.08 + pulse * 0.04 + proximity * 0.25 + rippleBoost
        ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`
        ctx.lineWidth = nearMouse ? 0.5 + proximity * 0.8 : 0.5
        ctx.beginPath()
        let first = true
        for (let x = 0; x <= w; x += 4) {
          // sin bow: 0 at left & right edges, max outward at horizontal center
          const bow = curvK * ny * Math.sin(Math.PI * x / w)
          const sy = gy + bow * h * 0.5
          if (first) { ctx.moveTo(x, sy); first = false }
          else ctx.lineTo(x, sy)
        }
        ctx.stroke()
      }

      // Intersection highlights at warped positions
      if (!mobile) {
        for (const gx of xs) {
          for (const gy of ys) {
            const nx = (gx / w - 0.5) * 2
            const ny = (gy / h - 0.5) * 2
            const ix = gx + curvK * nx * Math.sin(Math.PI * gy / h) * w * 0.5
            const iy = gy + curvK * ny * Math.sin(Math.PI * gx / w) * h * 0.5
            const dist = Math.hypot(mx - ix, my - iy)
            let rippleGlow = 0
            for (const r of ripplesRef.current) {
              const rp = r.t / r.maxT
              if (Math.abs(Math.hypot(r.x - ix, r.y - iy) - rp * w * 0.45) < avgCellW * 0.8) {
                rippleGlow = Math.max(rippleGlow, (1 - rp) * 0.25)
              }
            }
            if (dist < 200 || rippleGlow > 0) {
              const proximity = dist < 200 ? 1 - dist / 200 : 0
              const glow = Math.max(proximity, rippleGlow)
              ctx.fillStyle = `rgba(0, 0, 0, ${glow * 0.35})`
              ctx.beginPath()
              ctx.arc(ix, iy, 1 + glow * 3.5, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
      }

      ctx.restore()
    }

    /* ─── LAYER 2: Matrix Rain ─── */
    const drawMatrixRain = (w: number, h: number, t: number) => {
      ctx.save()

      columnsRef.current.forEach((col) => {
        col.y += col.speed

        // Reset when off screen
        if (col.y - col.length * 16 > h) {
          col.y = -col.length * 16
          col.speed = Math.random() * 1.2 + 0.3
          col.opacity = Math.random() * 0.12 + 0.03
          // Randomize a few chars
          for (let i = 0; i < col.chars.length; i++) {
            if (Math.random() > 0.6) {
              col.chars[i] = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
            }
          }
        }

        // Occasionally mutate a char
        if (Math.random() > 0.97) {
          const idx = Math.floor(Math.random() * col.chars.length)
          col.chars[idx] = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
        }

        col.chars.forEach((char, i) => {
          const charY = col.y + i * 16
          if (charY < -16 || charY > h + 16) return

          // Head char is brighter
          const isHead = i === col.chars.length - 1
          const fadeFromHead = 1 - (col.chars.length - 1 - i) / col.chars.length
          const alpha = isHead
            ? col.opacity * 2.5
            : col.opacity * fadeFromHead * (0.6 + Math.sin(t * 0.002 + i) * 0.4)

          ctx.font = `${col.fontSize}px "Geist Mono", monospace`
          ctx.fillStyle = isHead
            ? `rgba(0, 60, 0, ${Math.min(alpha, 0.35)})`
            : `rgba(0, 0, 0, ${Math.min(alpha, 0.15)})`
          ctx.fillText(char, col.x, charY)
        })
      })

      ctx.restore()
    }

    /* ─── LAYER 3: Shader Gradient Waves ─── */
    const drawGradientWaves = (w: number, h: number, t: number) => {
      ctx.save()
      ctx.globalCompositeOperation = "screen"

      const waveCount = isMobileRef.current ? 2 : 4

      for (let wave = 0; wave < waveCount; wave++) {
        const phase = wavePhaseRef.current + wave * 1.2
        const baseY = h * (0.35 + wave * 0.12)
        const amplitude = 30 + wave * 15 + Math.sin(t * 0.0005 + wave) * 10
        const freq = 0.002 + wave * 0.0005
        const alpha = 0.012 - wave * 0.002

        // Soft gradient fill beneath the wave
        ctx.beginPath()
        ctx.moveTo(0, h)

        for (let x = 0; x <= w; x += 3) {
          const y =
            baseY +
            Math.sin(x * freq + phase) * amplitude +
            Math.sin(x * freq * 2.3 + phase * 1.7) * (amplitude * 0.3) +
            Math.cos(x * freq * 0.7 + phase * 0.5) * (amplitude * 0.15)
          ctx.lineTo(x, y)
        }

        ctx.lineTo(w, h)
        ctx.closePath()

        const grad = ctx.createLinearGradient(0, baseY - amplitude, 0, baseY + amplitude * 3)
        grad.addColorStop(0, `rgba(100, 120, 160, ${alpha * 1.5})`)
        grad.addColorStop(0.3, `rgba(120, 130, 150, ${alpha})`)
        grad.addColorStop(1, "rgba(120, 130, 150, 0)")
        ctx.fillStyle = grad
        ctx.fill()

        // Wave edge line
        ctx.beginPath()
        for (let x = 0; x <= w; x += 2) {
          const y =
            baseY +
            Math.sin(x * freq + phase) * amplitude +
            Math.sin(x * freq * 2.3 + phase * 1.7) * (amplitude * 0.3) +
            Math.cos(x * freq * 0.7 + phase * 0.5) * (amplitude * 0.15)
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(100, 120, 160, ${alpha * 2.5})`
        ctx.lineWidth = 0.8
        ctx.stroke()
      }

      ctx.globalCompositeOperation = "source-over"
      ctx.restore()
    }

    /* ─── LAYER 4: Terminal Typography Fragments ─── */
    const drawFragments = (w: number, h: number, t: number) => {
      ctx.save()

      fragmentsRef.current.forEach((frag) => {
        frag.life++
        if (frag.life > frag.maxLife) {
          Object.assign(frag, createFragment(w, h))
        }

        frag.x += frag.vx
        frag.y += frag.vy
        frag.rotation += frag.rotationSpeed

        // Wrap around
        if (frag.x < -100) frag.x = w + 50
        if (frag.x > w + 100) frag.x = -50
        if (frag.y < -50) frag.y = h + 30
        if (frag.y > h + 50) frag.y = -30

        // Fade in / out
        const progress = frag.life / frag.maxLife
        const fadeCurve = progress < 0.15
          ? progress / 0.15
          : progress > 0.8
            ? (1 - progress) / 0.2
            : 1

        // Glitch flicker
        const flicker = Math.random() > 0.98 ? 0 : 1

        const alpha = fadeCurve * 0.08 * flicker

        if (alpha <= 0) return

        ctx.save()
        ctx.translate(frag.x, frag.y)
        ctx.rotate(frag.rotation)

        ctx.font = `${frag.size}px "Geist Mono", monospace`
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
        ctx.textAlign = "center"
        ctx.fillText(frag.text, 0, 0)

        // Subtle underline / bracket decoration
        if (frag.size > 9) {
          const textWidth = ctx.measureText(frag.text).width
          ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.4})`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(-textWidth / 2, 3)
          ctx.lineTo(textWidth / 2, 3)
          ctx.stroke()
        }

        ctx.restore()
      })

      ctx.restore()
    }

    /* ─── LAYER 5: Particle Field ─── */
    const drawParticles = (w: number, h: number) => {
      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const mobile = isMobileRef.current

      ctx.save()

      particlesRef.current.forEach((p) => {
        p.life++
        if (p.life > p.maxLife) {
          Object.assign(p, createParticle(w, h))
        }

        // Mouse repulsion (desktop only)
        if (!mobile && mx > 0) {
          const dx = mx - p.x
          const dy = my - p.y
          const dist = Math.hypot(dx, dy)
          if (dist < 150) {
            const force = (1 - dist / 150) * 0.03
            p.vx -= (dx / dist) * force
            p.vy -= (dy / dist) * force
          }
        }

        // Damping
        p.vx *= 0.999
        p.vy *= 0.999

        p.x += p.vx
        p.y += p.vy

        // Wrap
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        const lifeFade = Math.min(p.life / 80, 1) * Math.min((p.maxLife - p.life) / 80, 1)
        const alpha = p.opacity * lifeFade

        if (alpha <= 0.003) return

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
        ctx.fill()
      })

      // Draw faint connection lines between nearby particles (desktop only)
      if (!mobile) {
        ctx.lineWidth = 0.3
        const len = particlesRef.current.length
        for (let i = 0; i < len; i++) {
          for (let j = i + 1; j < len; j++) {
            const a = particlesRef.current[i]
            const b = particlesRef.current[j]
            const dist = Math.hypot(a.x - b.x, a.y - b.y)
            if (dist < 100) {
              const fadeA = Math.min(a.life / 80, 1) * Math.min((a.maxLife - a.life) / 80, 1)
              const fadeB = Math.min(b.life / 80, 1) * Math.min((b.maxLife - b.life) / 80, 1)
              const lineAlpha = (1 - dist / 100) * 0.03 * fadeA * fadeB
              if (lineAlpha > 0.002) {
                ctx.strokeStyle = `rgba(0, 0, 0, ${lineAlpha})`
                ctx.beginPath()
                ctx.moveTo(a.x, a.y)
                ctx.lineTo(b.x, b.y)
                ctx.stroke()
              }
            }
          }
        }
      }

      ctx.restore()
    }

    /* ─── Scanlines ─── */
    const drawScanlines = (w: number, h: number, t: number) => {
      // Horizontal CRT scanlines
      ctx.save()
      ctx.fillStyle = "rgba(0, 0, 0, 0.03)"
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1)
      }

      // Moving bright scanline
      const scanY = (t * 0.04) % (h + 80) - 40
      const grad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30)
      grad.addColorStop(0, "rgba(0, 0, 0, 0)")
      grad.addColorStop(0.5, "rgba(0, 0, 0, 0.02)")
      grad.addColorStop(1, "rgba(0, 0, 0, 0)")
      ctx.fillStyle = grad
      ctx.fillRect(0, scanY - 30, w, 60)
      ctx.restore()
    }

    /* ─── Vignette ─── */
    const drawVignette = (w: number, h: number) => {
      const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.15, w / 2, h / 2, w * 0.75)
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)")
      vignette.addColorStop(1, "rgba(0, 0, 0, 0.5)")
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, w, h)
    }

    /* ─── Main Loop ─── */
    const animate = () => {
      const w = window.innerWidth
      const h = window.innerHeight

      timeRef.current += 16
      wavePhaseRef.current += 0.008

      ctx.clearRect(0, 0, w, h)

      // Layer 1 - Generative grid (furthest back)
      drawGrid(w, h, timeRef.current)

      // Layer 2 - Shader gradient waves
      drawGradientWaves(w, h, timeRef.current)

      // Layer 3 - Matrix rain
      drawMatrixRain(w, h, timeRef.current)

      // Layer 4 - Particle field
      drawParticles(w, h)

      // Layer 5 - Terminal fragments (nearest to viewer)
      drawFragments(w, h, timeRef.current)

      // Post-processing
      if (!isMobileRef.current) {
        drawScanlines(w, h, timeRef.current)
      }

      drawVignette(w, h)

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("click", handleClick)
    }
  }, [createColumn, createParticle, createFragment])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  )
}
