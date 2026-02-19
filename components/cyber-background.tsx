"use client"

import { useEffect, useRef, useCallback } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  char: string
  opacity: number
  size: number
  life: number
  maxLife: number
}

const CHARS = "01{}[]<>/\\|=+-_*&^%$#@!~;:.,ABCDEF"

export function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const particlesRef = useRef<Particle[]>([])
  const gridOffsetRef = useRef(0)
  const animationRef = useRef<number>(0)
  const isMobileRef = useRef(false)

  const createParticle = useCallback((width: number, height: number): Particle => {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3 - 0.1,
      char: CHARS[Math.floor(Math.random() * CHARS.length)],
      opacity: Math.random() * 0.15 + 0.02,
      size: Math.random() * 10 + 8,
      life: 0,
      maxLife: Math.random() * 600 + 200,
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      isMobileRef.current = window.innerWidth < 768
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    window.addEventListener("mousemove", handleMouseMove)

    const particleCount = isMobileRef.current ? 15 : 40
    particlesRef.current = Array.from({ length: particleCount }, () =>
      createParticle(canvas.width, canvas.height)
    )

    const drawGrid = (w: number, h: number) => {
      const spacing = isMobileRef.current ? 80 : 60
      const offset = gridOffsetRef.current
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)"
      ctx.lineWidth = 0.5

      for (let x = offset % spacing; x < w; x += spacing) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = offset % spacing; y < h; y += spacing) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
    }

    const drawScanline = (h: number, w: number) => {
      const scanY = (Date.now() * 0.03) % (h + 40) - 20
      const gradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20)
      gradient.addColorStop(0, "rgba(255, 255, 255, 0)")
      gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.015)")
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)")
      ctx.fillStyle = gradient
      ctx.fillRect(0, scanY - 20, w, 40)
    }

    const drawNoise = (w: number, h: number) => {
      const imageData = ctx.getImageData(0, 0, w, h)
      const data = imageData.data
      const step = isMobileRef.current ? 8 : 4
      for (let i = 0; i < data.length; i += step * 4) {
        const noise = Math.random() * 8
        data[i] += noise
        data[i + 1] += noise
        data[i + 2] += noise
      }
      ctx.putImageData(imageData, 0, 0)
    }

    const animate = () => {
      const w = canvas.width
      const h = canvas.height

      ctx.clearRect(0, 0, w, h)

      gridOffsetRef.current += 0.08
      drawGrid(w, h)

      if (!isMobileRef.current) {
        drawScanline(h, w)
      }

      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      particlesRef.current.forEach((p) => {
        p.life++
        if (p.life > p.maxLife) {
          Object.assign(p, createParticle(w, h))
        }

        if (!isMobileRef.current) {
          const dx = mx - p.x
          const dy = my - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 200) {
            p.vx -= (dx / dist) * 0.02
            p.vy -= (dy / dist) * 0.02
          }
        }

        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        const lifeFade = Math.min(p.life / 60, 1) * Math.min((p.maxLife - p.life) / 60, 1)

        ctx.font = `${p.size}px "Geist Mono", monospace`
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * lifeFade})`
        ctx.fillText(p.char, p.x, p.y)
      })

      if (!isMobileRef.current) {
        drawNoise(w, h)
      }

      // Subtle radial vignette
      const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.7)
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)")
      vignette.addColorStop(1, "rgba(0, 0, 0, 0.4)")
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, w, h)

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [createParticle])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  )
}
