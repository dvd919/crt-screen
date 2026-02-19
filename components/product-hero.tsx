"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"

const SIZES = ["S", "M", "L", "XL"] as const
type Size = (typeof SIZES)[number]

export function ProductHero() {
  const [selectedSize, setSelectedSize] = useState<Size | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const rotateRef = useRef({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!imageContainerRef.current) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const x = ((e.clientY - centerY) / rect.height) * -6
    const y = ((e.clientX - centerX) / rect.width) * 6
    rotateRef.current = { x, y }
    imageContainerRef.current.style.transform = `perspective(1000px) rotateX(${x}deg) rotateY(${y}deg) scale(1.02)`
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (!imageContainerRef.current) return
    imageContainerRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)"
  }, [])

  const handleAddToCart = () => {
    if (!selectedSize) return
    setIsAdding(true)
    setTimeout(() => setIsAdding(false), 2000)
  }

  return (
    <section
      id="product"
      className="relative min-h-screen flex items-center justify-center px-6 md:px-12"
    >
      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-24 w-full max-w-6xl mx-auto pt-24 pb-12 lg:pt-0 lg:pb-0">
        {/* Product image */}
        <div className="flex-1 flex items-center justify-center w-full lg:w-auto">
          <div
            ref={imageContainerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full max-w-[320px] md:max-w-[420px] lg:max-w-[500px] aspect-square opacity-0 animate-fade-in-up stagger-2"
            style={{ transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-foreground/[0.03] blur-3xl scale-110 animate-glow-pulse" />

            <Image
              src="/images/tshirt-front.jpg"
              alt="Drop 001 - Limited edition black t-shirt front view"
              fill
              priority
              className="object-contain drop-shadow-2xl relative z-10"
              sizes="(max-width: 768px) 320px, (max-width: 1024px) 420px, 500px"
            />
          </div>
        </div>

        {/* Product info */}
        <div className="flex-1 flex flex-col items-center lg:items-start gap-8 w-full lg:w-auto">
          <div className="flex flex-col items-center lg:items-start gap-4">
            <span className="text-xs font-mono tracking-[0.3em] text-muted-foreground uppercase opacity-0 animate-fade-in-up stagger-1">
              Limited Edition
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight text-center lg:text-left text-balance opacity-0 animate-fade-in-up stagger-2">
              Drop 001
            </h1>
            <p className="text-lg md:text-xl font-light text-foreground/70 tracking-wide opacity-0 animate-fade-in-up stagger-3">
              $120.00
            </p>
          </div>

          {/* Size selector */}
          <div className="flex flex-col gap-3 opacity-0 animate-fade-in-up stagger-4">
            <span className="text-xs font-mono tracking-[0.2em] text-muted-foreground uppercase">
              Size
            </span>
            <div className="flex gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 flex items-center justify-center text-sm font-mono tracking-wider border transition-all duration-500 ${
                    selectedSize === size
                      ? "border-foreground text-foreground bg-foreground/5"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground/70"
                  }`}
                  aria-label={`Select size ${size}`}
                  aria-pressed={selectedSize === size}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedSize || isAdding}
            className={`w-full max-w-xs h-14 flex items-center justify-center text-xs font-mono tracking-[0.3em] uppercase border transition-all duration-700 opacity-0 animate-fade-in-up stagger-5 ${
              !selectedSize
                ? "border-border text-muted-foreground cursor-not-allowed"
                : isAdding
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground text-foreground hover:bg-foreground hover:text-background"
            }`}
            aria-label={isAdding ? "Added to cart" : "Add to cart"}
          >
            {isAdding ? "Added" : selectedSize ? "Add to Cart" : "Select Size"}
          </button>

          <p className="text-[10px] font-mono tracking-[0.15em] text-muted-foreground/50 uppercase opacity-0 animate-fade-in-up stagger-6">
            Secure checkout via Shopify
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-0 animate-fade-in stagger-6">
        <span className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground/40 uppercase">
          Scroll
        </span>
        <div className="w-px h-8 bg-foreground/10 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-full bg-foreground/30 animate-[scanline_2s_ease-in-out_infinite]" />
        </div>
      </div>
    </section>
  )
}
