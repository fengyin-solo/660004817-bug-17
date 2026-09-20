<template>
  <div class="panel" style="margin-top:16px">
    <div class="table-header">
      <h3>📋 构象数据 (共 {{ confs.length }} 条)</h3>
      <el-button size="small" :disabled="confs.length === 0" @click="exportCSV">导出 CSV</el-button>
    </div>
    <el-table
      :data="confs" stripe max-height="360" highlight-current-row
      @row-click="onRowClick" size="small"
      :empty-text="emptyText"
    >
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="phi" label="φ (°)" width="100">
        <template #default="{ row }">{{ row.phi.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="psi" label="ψ (°)" width="100">
        <template #default="{ row }">{{ row.psi.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="energy" label="LJ能量 (kcal/mol)" width="150">
        <template #default="{ row }">{{ row.energy.toFixed(3) }}</template>
      </el-table-column>
      <el-table-column prop="region" label="构象区域 / 角度区间" width="240">
        <template #default="{ row }">
          <el-tag :type="tagType(row.region)" size="small">{{ regionLabel(row.region) }}</el-tag>
          <span class="range">{{ regionRangeText(row.region) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="cluster" label="聚类" />
      <template #empty>
        <span class="empty-tip">{{ emptyText }}</span>
      </template>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProteinStore } from '../store/protein'
import type { Conformation } from '../types'
import { regionLabel, regionRangeText } from '../lib/angles'

const store = useProteinStore()
const confs = computed(() => (store.result?.conformations || []).filter(c =>
  store.selectedCluster === 'all' || c.cluster === store.selectedCluster
))

const emptyText = computed(() => {
  if (!store.result) return '暂无数据，请先点击「生成构象采样」'
  if (store.result.conformations.length === 0) return '本批采样结果为空，没有构象数据'
  return `当前筛选（${store.selectedCluster}）下没有构象数据，请切换聚类筛选`
})

function onRowClick(row: Conformation) { store.selectConformation(row) }
function tagType(r: string) {
  const m: Record<string, any> = { 'alpha-helix': 'success', 'beta-sheet': 'danger', 'beta-sheet-2': 'danger', 'left-helix': 'warning' }
  return m[r] || 'info'
}
function exportCSV() {
  const header = 'id,phi,psi,energy,region,cluster\n'
  const rows = confs.value.map(c => `${c.id},${c.phi},${c.psi},${c.energy},${c.region},${c.cluster}`).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'conformations.csv'; a.click()
}
</script>

<style scoped>
.panel { background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.table-header h3 { color: #333; font-size: 15px; }
.range { display: block; margin-top: 2px; font-size: 11px; color: #999; }
.empty-tip { color: #999; font-size: 13px; }
</style>
