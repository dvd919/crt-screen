"use client"

export function SiteFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative z-10 px-6 md:px-12 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <div className="w-full h-px bg-border mb-16" />

        <div className="flex flex-col md:flex-row items-start justify-between gap-12">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <span className="font-serif text-lg tracking-tight">Drop 001</span>
            <span className="text-xs font-mono tracking-[0.15em] text-muted-foreground/50">
              {`\u00A9 ${currentYear}. All rights reserved.`}
            </span>
          </div>

          {/* Social Links */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono tracking-[0.3em] text-muted-foreground uppercase">
              Connect
            </span>
            <div className="flex gap-6">
              {[
                { label: "Instagram", href: "#" },
                { label: "Twitter", href: "#" },
                { label: "TikTok", href: "#" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-xs font-mono tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors duration-500"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono tracking-[0.3em] text-muted-foreground uppercase">
              Legal
            </span>
            <div className="flex gap-6">
              {[
                { label: "Privacy", href: "#" },
                { label: "Terms", href: "#" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-xs font-mono tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors duration-500"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Large brand text */}
        <div className="mt-24 md:mt-32 overflow-hidden">
          <p
            className="font-serif text-[clamp(3rem,12vw,10rem)] leading-none tracking-tighter text-foreground/[0.03] select-none"
            aria-hidden="true"
          >
            DROP 001
          </p>
        </div>
      </div>
    </footer>
  )
}
