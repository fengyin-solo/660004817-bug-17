import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { Conformation, SamplingResult, ProteinParams } from '@/types'

export const useProteinStore = defineStore('protein', () => {
  const loading = ref(false)
  const result = ref<SamplingResult | null>(null)
  const selectedConformation = ref<Conformation | null>(null)
  const selectedRegion = ref('all')

  async function runSampling(params: ProteinParams) {
    loading.value = true
    try {
      const { data } = await axios.post('/api/sample', params)
      result.value = data
      selectedConformation.value = null
      selectedRegion.value = 'all'
    } finally { loading.value = false }
  }

  function selectConformation(conf: Conformation) { selectedConformation.value = conf }
  function filterByRegion(region: string) { selectedRegion.value = region }

  return { loading, result, selectedConformation, selectedRegion, runSampling, selectConformation, filterByRegion }
})
