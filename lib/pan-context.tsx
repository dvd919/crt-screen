"use client"

import { createContext, useContext, useState, useRef, useCallback } from "react"
import type { RefObject } from "react"

export interface PanState { x: number; y: number }

interface PanContextValue {
  pan: PanState
  panRef: RefObject<PanState>
  setPan: (update: PanState | ((prev: PanState) => PanState)) => void
  didDragRef: RefObject<boolean>
  bhRevealedRef: RefObject<boolean>
}

const PanContext = createContext<PanContextValue | null>(null)

export function PanProvider({ children }: { children: React.ReactNode }) {
  const [pan, setPanState] = useState<PanState>({ x: 0, y: 0 })
  const panRef = useRef<PanState>({ x: 0, y: 0 })
  const didDragRef = useRef<boolean>(false)
  const bhRevealedRef = useRef<boolean>(false)

  const setPan = useCallback((update: PanState | ((prev: PanState) => PanState)) => {
    setPanState(prev => {
      const next = typeof update === "function" ? update(prev) : update
      panRef.current = next
      return next
    })
  }, [])

  return (
    <PanContext.Provider value={{ pan, panRef, setPan, didDragRef, bhRevealedRef }}>
      {children}
    </PanContext.Provider>
  )
}

export function usePan() {
  const ctx = useContext(PanContext)
  if (!ctx) throw new Error("usePan must be used inside PanProvider")
  return ctx
}
