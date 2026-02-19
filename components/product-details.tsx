"use client"

import { useEffect, useRef, useState } from "react"

function FadeInSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-8 blur-sm"
      } ${className}`}
    >
      {children}
    </div>
  )
}

export function ProductDetails() {
  return (
    <section id="details" className="relative z-10 px-6 md:px-12 py-32 md:py-48">
      <div className="max-w-4xl mx-auto">
        {/* Divider */}
        <FadeInSection>
          <div className="w-full h-px bg-border mb-24 md:mb-32" />
        </FadeInSection>

        {/* Description */}
        <FadeInSection className="mb-24 md:mb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
            <div className="flex flex-col gap-4">
              <span className="text-xs font-mono tracking-[0.3em] text-muted-foreground uppercase">
                About
              </span>
              <h2 className="font-serif text-2xl md:text-3xl tracking-tight text-balance">
                Engineered for the new era
              </h2>
            </div>
            <div className="flex flex-col gap-6">
              <p className="text-sm leading-relaxed text-foreground/60">
                Crafted from heavyweight 280gsm organic cotton, this piece represents the 
                intersection of fashion and digital culture. Every thread carries the weight 
                of intentional design, from the oversized silhouette to the precision-placed 
                logo mark.
              </p>
              <p className="text-sm leading-relaxed text-foreground/60">
                This is not just a garment. It is a statement of belonging to a community 
                that values craft, code, and the courage to exist differently.
              </p>
            </div>
          </div>
        </FadeInSection>

        {/* Specs */}
        <FadeInSection className="mb-24 md:mb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
            <div className="flex flex-col gap-4">
              <span className="text-xs font-mono tracking-[0.3em] text-muted-foreground uppercase">
                Specifications
              </span>
            </div>
            <div className="flex flex-col gap-0">
              {[
                { label: "Material", value: "100% Organic Cotton" },
                { label: "Weight", value: "280gsm Heavy" },
                { label: "Fit", value: "Oversized" },
                { label: "Color", value: "Void Black" },
                { label: "Print", value: "High-density screen print" },
                { label: "Care", value: "Cold wash, hang dry" },
              ].map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-center justify-between py-4 border-b border-border/50"
                >
                  <span className="text-xs font-mono tracking-[0.15em] text-muted-foreground uppercase">
                    {spec.label}
                  </span>
                  <span className="text-sm text-foreground/70">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </FadeInSection>

        {/* Shipping */}
        <FadeInSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
            <div className="flex flex-col gap-4">
              <span className="text-xs font-mono tracking-[0.3em] text-muted-foreground uppercase">
                Shipping
              </span>
            </div>
            <div className="flex flex-col gap-6">
              <p className="text-sm leading-relaxed text-foreground/60">
                Worldwide shipping available. Orders ship within 3-5 business days. 
                Each piece is individually numbered and ships in custom packaging 
                designed for this drop.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { region: "Domestic", time: "3-5 days", price: "Free" },
                  { region: "International", time: "7-14 days", price: "$15" },
                ].map((row) => (
                  <div
                    key={row.region}
                    className="flex items-center justify-between py-3 border-b border-border/50"
                  >
                    <span className="text-xs font-mono tracking-[0.15em] text-muted-foreground uppercase">
                      {row.region}
                    </span>
                    <div className="flex items-center gap-6">
                      <span className="text-xs font-mono text-foreground/40">
                        {row.time}
                      </span>
                      <span className="text-sm text-foreground/70">
                        {row.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeInSection>
      </div>
    </section>
  )
}
