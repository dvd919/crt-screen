"use client"

import { useRef, useCallback, useEffect } from "react"
import { CyberBackground } from "@/components/cyber-background"
import { GridOverlay } from "@/components/grid-overlay"
import { ScanlineOverlay } from "@/components/scanline-overlay"
import { PanProvider, usePan } from "@/lib/pan-context"

function PageInner() {
  const { panRef, setPan, didDragRef } = usePan()
  const isDraggingRef = useRef(false)
  const dragOriginRef = useRef({ x: 0, y: 0 })
  const panOriginRef = useRef({ x: 0, y: 0 })
  const mainRef = useRef<HTMLElement>(null)

  const startDrag = useCallback((clientX: number, clientY: number) => {
    isDraggingRef.current = true
    didDragRef.current = false
    dragOriginRef.current = { x: clientX, y: clientY }
    panOriginRef.current = { x: panRef.current.x, y: panRef.current.y }
  }, [panRef, didDragRef])

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return
    const dx = clientX - dragOriginRef.current.x
    const dy = clientY - dragOriginRef.current.y
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      didDragRef.current = true
    }
    setPan({
      x: panOriginRef.current.x - dx,
      y: panOriginRef.current.y - dy,
    })
  }, [setPan, didDragRef])

  const endDrag = useCallback(() => {
    isDraggingRef.current = false
    // Reset after click event fires (click fires before setTimeout)
    setTimeout(() => { didDragRef.current = false }, 0)
  }, [didDragRef])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    startDrag(e.clientX, e.clientY)
  }, [startDrag])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    moveDrag(e.clientX, e.clientY)
  }, [moveDrag])

  const handleMouseUp = useCallback(() => {
    endDrag()
  }, [endDrag])

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setPan(prev => ({ x: prev.x + e.deltaX, y: prev.y + e.deltaY }))
    }
    window.addEventListener("wheel", onWheel, { passive: false })
    return () => window.removeEventListener("wheel", onWheel)
  }, [setPan])

  // Non-passive touch listeners — lets us preventDefault to block pull-to-refresh and native scroll
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const touch = e.touches[0]
      startDrag(touch.clientX, touch.clientY)
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const touch = e.touches[0]
      moveDrag(touch.clientX, touch.clientY)
      // Only prevent default once a real drag is confirmed — preserves click synthesis for taps
      if (didDragRef.current) e.preventDefault()
    }
    const onTouchEnd = (e: TouchEvent) => {
      const wasDrag = didDragRef.current
      endDrag()
      if (!wasDrag && e.changedTouches.length > 0) {
        // Suppress browser's delayed synthetic click (avoids double-fire)
        e.preventDefault()
        // Manually dispatch the tap so links work regardless of click synthesis
        const touch = e.changedTouches[0]
        const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null
        target?.closest('a')?.click()
      }
    }
    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    el.addEventListener("touchend", onTouchEnd, { passive: false })
    return () => {
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", onTouchEnd)
    }
  }, [startDrag, moveDrag, endDrag])

  return (
    <main
      ref={mainRef}
      className="relative min-h-screen bg-white select-none"
      style={{ cursor: "crosshair", touchAction: "none" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <CyberBackground />
      <GridOverlay />
      <ScanlineOverlay />
    </main>
  )
}

export default function Home() {
  return (
    <PanProvider>
      <PageInner />
    </PanProvider>
  )
}
