"use client"

import { useEffect, useRef } from "react"

export function ScanlineOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const timeRef = useRef<number>(0)
  const isMobileRef = useRef<boolean>(false)

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
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    const animate = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      timeRef.current += 16

      ctx.clearRect(0, 0, w, h)

      // Static scanlines
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)"
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1)
      }

      // Moving bright scanline (desktop only)
      if (!isMobileRef.current) {
        const scanY = (timeRef.current * 0.04) % (h + 80) - 40
        const grad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30)
        grad.addColorStop(0, "rgba(0, 0, 0, 0)")
        grad.addColorStop(0.5, "rgba(0, 0, 0, 0.02)")
        grad.addColorStop(1, "rgba(0, 0, 0, 0)")
        ctx.fillStyle = grad
        ctx.fillRect(0, scanY - 30, w, 60)
      }

      // Radial vignette
      const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.15, w / 2, h / 2, w * 0.75)
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)")
      vignette.addColorStop(1, "rgba(0, 0, 0, 0.5)")
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, w, h)

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    />
  )
}
