<template>
  <div class="panel">
    <h3>📊 Ramachandran图 (φ-ψ 二面角空间)</h3>
    <div class="plot-wrap">
      <canvas ref="cvs" width="500" height="500" class="plot-canvas"></canvas>
      <div v-if="emptyTip" class="empty-tip">{{ emptyTip }}</div>
    </div>
    <div class="legend">
      <span class="dot a"></span> α-螺旋 <span class="dot b"></span> β-折叠
      <span class="dot l"></span> 左手螺旋 <span class="dot d"></span> 禁阻区
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue"
import { useProteinStore } from "../store/protein"
import { REGION_ZONES, angleToX, angleToY } from "../utils/ramachandran"
const store = useProteinStore()
const cvs = ref<HTMLCanvasElement>()

const colors: Record<string,string> = {"alpha-helix":"#4ecdc4","beta-sheet":"#ff6b6b","left-helix":"#45b7d1","disallowed":"#ddd"}

const visibleConfs = computed(() =>
  (store.result?.conformations || []).filter(c => store.selectedRegion === "all" || c.region === store.selectedRegion)
)
const emptyTip = computed(() => {
  if (!store.result) return "暂无采样数据，请先点击「生成构象采样」"
  if (store.result.conformations.length === 0) return "采样数据为空，请调整参数后重新生成"
  if (visibleConfs.value.length === 0) return "当前筛选条件下没有落点，请切换筛选或重新采样"
  return ""
})

function draw() {
  const c = cvs.value
  if (!c) return
  const ctx = c.getContext("2d")!; const W=c.width,H=c.height
  ctx.clearRect(0,0,W,H)
  // 网格：与落点共用同一套角度换算
  ctx.strokeStyle="#e8e8e8"; ctx.lineWidth=1
  for(let a=-180;a<=180;a+=30){
    const x=angleToX(a,W); ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke()
    const y=angleToY(a,H); ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke()
  }
  // 底色热区：范围与后端分区定义一致，同一套换算保证负角与边界值落在正确位置
  for(const z of REGION_ZONES){
    const x1=angleToX(z.phi[0],W), x2=angleToX(z.phi[1],W)
    const y1=angleToY(z.psi[1],H), y2=angleToY(z.psi[0],H) // ψ 大端在画布上方
    ctx.fillStyle=z.color
    ctx.fillRect(x1,y1,x2-x1,y2-y1)
  }
  ctx.strokeStyle="#999"; ctx.lineWidth=2
  ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke()
  ctx.fillStyle="#666"; ctx.font="12px sans-serif"
  ctx.fillText("φ →",W-30,H/2-6); ctx.fillText("ψ ↑",W/2+6,16)
  // 落点：坐标换算与配色保持不变
  const confs = visibleConfs.value
  if(confs.length){
    const es = confs.map(c=>c.energy); const eMin=Math.min(...es),eMax=Math.max(...es)
    for(const cf of confs){
      const x = angleToX(cf.phi,W), y = angleToY(cf.psi,H)
      const t = (cf.energy-eMin)/(eMax-eMin||1), r = 3 + t*3
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2)
      ctx.fillStyle=colors[cf.region]||"#999"; ctx.fill()
      ctx.strokeStyle="rgba(0,0,0,.1)"; ctx.stroke()
    }
  }
  if(store.selectedConformation){
    const sc=store.selectedConformation
    ctx.beginPath(); ctx.arc(angleToX(sc.phi,W), angleToY(sc.psi,H), 8, 0, Math.PI*2)
    ctx.strokeStyle="#333"; ctx.lineWidth=3; ctx.stroke()
  }
}
onMounted(draw)
watch(()=>[store.result,store.selectedConformation,store.selectedRegion],draw,{deep:true})
</script>

<style scoped>
.panel{background:#fff;border-radius:8px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.panel h3{margin-bottom:12px;color:#333}
.plot-wrap{position:relative;width:fit-content;margin:0 auto}
.plot-canvas{display:block;border:1px solid #eee;border-radius:8px}
.empty-tip{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 48px;color:#999;font-size:14px;pointer-events:none}
.legend{display:flex;gap:16px;justify-content:center;margin-top:12px;font-size:13px}
.legend .dot{display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:4px;vertical-align:middle}
.dot.a{background:#4ecdc4}.dot.b{background:#ff6b6b}.dot.l{background:#45b7d1}.dot.d{background:#ddd}
</style>
