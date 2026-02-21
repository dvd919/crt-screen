export interface GridItemConfig {
  col: number
  row: number
  colSpan: number
  rowSpan: number
  favicon: string
  label: string
  href: string
  copyText?: string
  hoverText?: string
}

export const GRID_ITEMS: GridItemConfig[] = [
  { col: 1,  row: 1, colSpan: 1, rowSpan: 1, label: "SoundCloud",     href: "https://soundcloud.com/dvdroom",                     favicon: "https://www.google.com/s2/favicons?domain=soundcloud.com&sz=64" },
  { col: 7,  row: 2, colSpan: 1, rowSpan: 1, label: "IDEARIGHTNOW", href: "https://idearightnow.com",                           favicon: "https://www.google.com/s2/favicons?domain=idearightnow.com&sz=64" },
  { col: 2,  row: 6, colSpan: 1, rowSpan: 1, label: "Instagram",      href: "https://www.instagram.com/dvd.919/",                 favicon: "https://www.google.com/s2/favicons?domain=instagram.com&sz=64" },
  { col: 8,  row: 7, colSpan: 1, rowSpan: 1, label: "YouTube",        href: "https://www.youtube.com/@dvd-919",                   favicon: "https://www.google.com/s2/favicons?domain=youtube.com&sz=64" },
  { col: 4,  row: 4, colSpan: 1, rowSpan: 1, label: "LinkedIn",       href: "https://www.linkedin.com/in/david-jueng-90875a328/", favicon: "https://www.google.com/s2/favicons?domain=linkedin.com&sz=64" },
  { col: 6,  row: 8, colSpan: 1, rowSpan: 1, label: "Email",          href: "#", copyText: "david@jue.ng",                        favicon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z'/%3E%3C/svg%3E" },
  { col: 3,  row: 2, colSpan: 1, rowSpan: 1, label: "?",             href: "#", hoverText: "made by david jueng",                 favicon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ctext x='12' y='18' text-anchor='middle' font-size='18' font-family='monospace' fill='%23000'%3E%3F%3C/text%3E%3C/svg%3E" },
]
