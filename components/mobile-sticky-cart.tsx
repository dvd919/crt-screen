"use client"

import { useEffect, useState } from "react"

export function MobileStickyCart() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > window.innerHeight * 0.6)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden transition-all duration-700 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0"
      }`}
    >
      <div className="bg-background/90 backdrop-blur-xl border-t border-border/50 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-serif text-sm">Drop 001</span>
            <span className="text-xs font-mono text-muted-foreground">$120.00</span>
          </div>
          <a
            href="#product"
            className="h-11 px-8 flex items-center justify-center text-[10px] font-mono tracking-[0.3em] uppercase border border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-500"
          >
            Buy Now
          </a>
        </div>
      </div>
    </div>
  )
}
