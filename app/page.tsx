import { CyberBackground } from "@/components/cyber-background"
import { Navbar } from "@/components/navbar"
import { ProductHero } from "@/components/product-hero"
import { ProductDetails } from "@/components/product-details"
import { SiteFooter } from "@/components/site-footer"
import { MobileStickyCart } from "@/components/mobile-sticky-cart"

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <CyberBackground />
      <Navbar />
      <ProductHero />
      <ProductDetails />
      <SiteFooter />
      <MobileStickyCart />
    </main>
  )
}
