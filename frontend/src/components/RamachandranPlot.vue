<template>
  <div class="panel">
    <h3>📊 Ramachandran图 (φ-ψ 二面角空间)</h3>
    <div class="plot-wrap">
      <canvas ref="cvs" width="500" height="500" class="plot-canvas"></canvas>
      <div v-if="emptyText" class="plot-empty">{{ emptyText }}</div>
    </div>
    <div class="legend">
      <span class="dot a"></span> α-螺旋 <span class="dot b"></span> β-折叠
      <span class="dot l"></span> 左手螺旋 <span class="dot d"></span> 禁阻区
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue"
import { useProteinStore } from "../store/protein"
import {
  REGIONS, REGION_COLORS, projectX, projectY, regionRect,
} from "../lib/angles"

const store = useProteinStore()
const cvs = ref<HTMLCanvasElement>()

const colors: Record<string, string> = { ...REGION_COLORS }

// 底色块透明度（既有值），按配色组取色
const BLOCK_FILL: Record<string, string> = {
  'alpha-helix': 'rgba(78,205,196,.08)',
  'beta-sheet': 'rgba(255,107,107,.08)',
  'left-helix': 'rgba(69,183,209,.08)',
}

function draw() {
  const c = cvs.value!; const ctx = c.getContext("2d")!; const W = c.width, H = c.height
  // 每次重画都彻底重置画布状态并清空，避免上一批底色残留
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, W, H)

  // 网格（与落点同一套角度换算）
  ctx.strokeStyle = "#e8e8e8"; ctx.lineWidth = 1
  for (let a = -180; a <= 180; a += 30) {
    const x = projectX(a, W); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    const y = projectY(a, H); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }

  // 底色热区：区间取自与后端一致的共享区域定义，投影与落点共用 projectX/projectY
  for (const region of REGIONS) {
    const fill = BLOCK_FILL[region.group]
    if (!fill) continue
    const r = regionRect(region, W, H)
    ctx.fillStyle = fill
    ctx.fillRect(r.x, r.y, r.w, r.h)
  }

  // 中线与轴标
  ctx.strokeStyle = "#999"; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke()
  ctx.fillStyle = "#666"; ctx.font = "12px sans-serif"
  ctx.fillText("φ →", W - 30, H / 2 - 6); ctx.fillText("ψ ↑", W / 2 + 6, 16)

  const confs = (store.result?.conformations || []).filter(
    c => store.selectedCluster === "all" || c.cluster === store.selectedCluster
  )
  if (confs.length === 0) return // 无落点：底色与坐标轴仍保留，空态说明由覆盖层给出

  const es = confs.map(c => c.energy); const eMin = Math.min(...es), eMax = Math.max(...es)
  for (const cf of confs) {
    const x = projectX(cf.phi, W), y = projectY(cf.psi, H)
    const t = (cf.energy - eMin) / (eMax - eMin || 1), r = 3 + t * 3
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = colors[cf.region] || "#999"; ctx.fill()
    ctx.strokeStyle = "rgba(0,0,0,.1)"; ctx.stroke()
  }

  // 选中落点：边界角向内收 8px，保证整圈高亮出现在热区/画布之内
  const sc = store.selectedConformation
  if (sc) {
    ctx.beginPath()
    ctx.arc(projectX(sc.phi, W, 8), projectY(sc.psi, H, 8), 8, 0, Math.PI * 2)
    ctx.strokeStyle = "#333"; ctx.lineWidth = 3; ctx.stroke()
  }
}

const emptyText = computed(() => {
  if (!store.result) return "暂无数据，请先点击「生成构象采样」"
  const total = store.result.conformations.length
  const shown = store.result.conformations.filter(
    c => store.selectedCluster === "all" || c.cluster === store.selectedCluster
  ).length
  if (total === 0) return "本批采样结果为空，没有可绘制的落点"
  if (shown === 0) return `当前筛选（${store.selectedCluster}）下没有落点，请切换聚类筛选`
  return ""
})

onMounted(draw)
watch(() => [store.result, store.selectedConformation, store.selectedCluster], draw, { deep: true })
</script>

<style scoped>
.panel{background:#fff;border-radius:8px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.panel h3{margin-bottom:12px;color:#333}
.plot-wrap{position:relative}
.plot-canvas{display:block;margin:0 auto;border:1px solid #eee;border-radius:8px}
.plot-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#999;font-size:14px;background:rgba(255,255,255,.75);text-align:center;padding:24px}
.legend{display:flex;gap:16px;justify-content:center;margin-top:12px;font-size:13px}
.legend .dot{display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:4px;vertical-align:middle}
.dot.a{background:#4ecdc4}.dot.b{background:#ff6b6b}.dot.l{background:#45b7d1}.dot.d{background:#ddd}
</style>
