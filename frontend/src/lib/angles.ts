// φ/ψ 二面角的唯⼀角度换算来源：底色块、落点、列表区间共用本文件。
// 区域定义与后端 backend/app/main.py 的 RAMACHANDRAN_REGIONS 保持一一对应。

export interface RegionDef {
  /** 区域标识（与后端 classify_region 返回值一致） */
  name: string
  /** 所属配色组（beta-sheet-2 与 beta-sheet 同色） */
  group: string
  /** φ 角度区间（闭区间，单位：度） */
  phi: [number, number]
  /** ψ 角度区间（闭区间，单位：度） */
  psi: [number, number]
}

export const REGIONS: RegionDef[] = [
  { name: 'alpha-helix', group: 'alpha-helix', phi: [-100, -30], psi: [-80, -10] },
  { name: 'beta-sheet', group: 'beta-sheet', phi: [-180, -45], psi: [60, 180] },
  { name: 'left-helix', group: 'left-helix', phi: [20, 100], psi: [-40, 80] },
  // 后端 beta-sheet-2 在分类时归入 beta-sheet，这里保留同色块以对应真实区间
  { name: 'beta-sheet-2', group: 'beta-sheet', phi: [-180, -45], psi: [-180, -60] },
]

/** 区域显示名 */
export function regionLabel(name: string): string {
  const m: Record<string, string> = {
    'alpha-helix': 'α-螺旋',
    'beta-sheet': 'β-折叠',
    'beta-sheet-2': 'β-折叠',
    'left-helix': '左手螺旋',
    'disallowed': '禁阻区',
  }
  return m[name] ?? name
}

/** 区域落点/底色配色（既有配色，不修改） */
export const REGION_COLORS: Record<string, string> = {
  'alpha-helix': '#4ecdc4',
  'beta-sheet': '#ff6b6b',
  'left-helix': '#45b7d1',
  'disallowed': '#ddd',
}

/** 单个区域的 φ/ψ 区间文本 */
function rangeOf(region: RegionDef): string {
  return `φ[${region.phi[0]}°, ${region.phi[1]}°] ψ[${region.psi[0]}°, ${region.psi[1]}°]`
}

/**
 * 数据行区域 -> 区间文本。
 * beta-sheet 在后端由 beta-sheet 与 beta-sheet-2 两个矩形区间合并而成，
 * 面板上两块同色，故列表同时列出两者，保证与底色块一一对应。
 */
export function regionRangeText(name: string): string {
  if (name === 'beta-sheet') {
    return REGIONS
      .filter(r => r.group === 'beta-sheet')
      .map(rangeOf)
      .join(' 或 ')
  }
  const region = REGIONS.find(r => r.name === name)
  return region ? rangeOf(region) : '—'
}

const ANGLE_MIN = -180
const ANGLE_MAX = 180
const RANGE = ANGLE_MAX - ANGLE_MIN // 360

function axisX(phi: number, width: number): number {
  return ((phi - ANGLE_MIN) / RANGE) * width
}
function axisY(psi: number, height: number): number {
  return height - ((psi - ANGLE_MIN) / RANGE) * height
}

/**
 * 角度 -> 像素的统一换算（底色块、落点、坐标轴共用）：
 *   x: -180° 在左，+180° 在右；
 *   y: +180° 在顶部，-180° 在底部（canvas y 向下，故做翻转）。
 *
 * inset 仅作用于精确的边界角（±180°），把落点及其描边收进画布与热区之内；
 * 所有内部角度（-180 < a < 180）返回的像素位置与旧实现逐像素一致，不改变既有落点。
 */
export function projectX(phi: number, width: number, inset = 0): number {
  if (phi <= ANGLE_MIN) return inset
  if (phi >= ANGLE_MAX) return width - inset
  return axisX(phi, width)
}

export function projectY(psi: number, height: number, inset = 0): number {
  if (psi <= ANGLE_MIN) return height - inset
  if (psi >= ANGLE_MAX) return inset
  return axisY(psi, height)
}

/** 区域矩形（左上 x/y 与宽高），底色块绘制与命中判断共用 */
export function regionRect(region: RegionDef, width: number, height: number) {
  const left = projectX(region.phi[0], width)
  const right = projectX(region.phi[1], width)
  // psi 区间上界对应较小的 y（顶部）
  const top = projectY(region.psi[1], height)
  const bottom = projectY(region.psi[0], height)
  return { x: left, y: top, w: right - left, h: bottom - top }
}
