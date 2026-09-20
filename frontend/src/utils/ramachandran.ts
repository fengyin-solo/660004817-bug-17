/**
 * Ramachandran 图共用的角度换算与热区定义。
 *
 * 角度约定：φ/ψ ∈ [-180, 180]；画布 x 轴为 φ（向右增大），y 轴为 ψ（向上增大，
 * 与画布像素 y 轴相反）。底色热区、落点、网格与选中标记必须使用同一套换算，
 * 保证同一 (φ, ψ) 永远映射到同一像素，负角与 ±180 边界值也不例外。
 */

/** φ（度）→ 画布 x 坐标 */
export function angleToX(phi: number, width: number): number {
  return ((phi + 180) / 360) * width
}

/** ψ（度）→ 画布 y 坐标（ψ 向上为正，故相对像素 y 轴翻转） */
export function angleToY(psi: number, height: number): number {
  return height - ((psi + 180) / 360) * height
}

export interface RegionZone {
  /** 区域名，与后端 classify_region 的返回值及落点配色一致 */
  name: string
  /** φ 取值范围（度），含边界 */
  phi: [number, number]
  /** ψ 取值范围（度），含边界 */
  psi: [number, number]
  /** 热区底色（沿用既有区域配色的 8% 透明版本） */
  color: string
}

/**
 * 热区定义，与后端 app/main.py 的 RAMACHANDRAN_REGIONS 保持一致——
 * 表格中每行的"构象区域"标签即按此范围分类，底色块必须与其对齐。
 *
 * 数组顺序即绘制顺序：alpha-helix 与 beta-sheet-2 在 φ∈[-100,-45]、ψ∈[-80,-60]
 * 处存在重叠，后端分类时 alpha-helix 优先命中，故它最后绘制，使重叠区显示
 * 实际生效的分类颜色。
 */
export const REGION_ZONES: RegionZone[] = [
  { name: "beta-sheet", phi: [-180, -45], psi: [-180, -60], color: "rgba(255,107,107,.08)" },
  { name: "beta-sheet", phi: [-180, -45], psi: [60, 180], color: "rgba(255,107,107,.08)" },
  { name: "left-helix", phi: [20, 100], psi: [-40, 80], color: "rgba(69,183,209,.08)" },
  { name: "alpha-helix", phi: [-100, -30], psi: [-80, -10], color: "rgba(78,205,196,.08)" },
]
