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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    startDrag(touch.clientX, touch.clientY)
  }, [startDrag])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    moveDrag(touch.clientX, touch.clientY)
  }, [moveDrag])

  const handleTouchEnd = useCallback(() => {
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

  return (
    <main
      className="relative min-h-screen bg-white select-none"
      style={{ cursor: "grab" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
