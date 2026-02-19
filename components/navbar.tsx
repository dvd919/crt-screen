"use client"

import { useState } from "react"
import { ShoppingBag } from "lucide-react"

export function Navbar() {
  const [cartCount] = useState(0)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-12 md:py-6">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono tracking-[0.3em] text-foreground/60 uppercase">
          Drop 001
        </span>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        <a
          href="#product"
          className="text-xs font-mono tracking-[0.2em] text-foreground/40 uppercase hover:text-foreground transition-colors duration-500"
        >
          Product
        </a>
        <a
          href="#details"
          className="text-xs font-mono tracking-[0.2em] text-foreground/40 uppercase hover:text-foreground transition-colors duration-500"
        >
          Details
        </a>
      </nav>

      <button
        className="relative flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors duration-500"
        aria-label={`Shopping cart with ${cartCount} items`}
      >
        <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-2 text-[10px] font-mono text-foreground bg-foreground/10 rounded-full w-4 h-4 flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>
    </header>
  )
}
