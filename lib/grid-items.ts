export interface GridItemConfig {
  col: number
  row: number
  colSpan: number
  rowSpan: number
  icon: string
  label: string
  href: string
}

export const GRID_ITEMS: GridItemConfig[] = [
  { col: 7, row: 3, colSpan: 2, rowSpan: 2, icon: "🌐", label: "Google", href: "https://google.com" },
  { col: 10, row: 3, colSpan: 1, rowSpan: 1, icon: "🐙", label: "GitHub", href: "https://github.com" },
  { col: 10, row: 4, colSpan: 1, rowSpan: 1, icon: "𝕏", label: "X", href: "https://x.com" },
  { col: 7, row: 6, colSpan: 1, rowSpan: 1, icon: "▶", label: "YouTube", href: "https://youtube.com" },
  { col: 8, row: 6, colSpan: 2, rowSpan: 1, icon: "🔵", label: "Figma", href: "https://figma.com" },
]
