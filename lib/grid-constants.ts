export const GRID_N_COLS = 10
export const GRID_N_COLS_MOBILE = 10
export const GRID_N_ROWS = 10
export const GRID_BLEND = 0.5
export const GRID_CURV_K = 0.12

export function genPos(n: number, size: number): number[] {
  const arr: number[] = []
  for (let i = 0; i <= n; i++) {
    const u = i / n
    const s = u * u * (3 - 2 * u) // smoothstep
    arr.push((u * (1 - GRID_BLEND) + s * GRID_BLEND) * size)
  }
  return arr
}

/** Maps a raw screen position (gx, gy) to its warped (bowed) counterpart. */
export function warpPoint(gx: number, gy: number, w: number, h: number): { x: number; y: number } {
  const nx = (gx / w - 0.5) * 2
  const ny = (gy / h - 0.5) * 2
  return {
    x: gx + GRID_CURV_K * nx * Math.sin(Math.PI * gy / h) * w * 0.5,
    y: gy + GRID_CURV_K * ny * Math.sin(Math.PI * gx / w) * h * 0.5,
  }
}
