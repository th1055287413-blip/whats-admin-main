<template>
  <div class="analytics">
    <!-- Header -->
    <div class="page-header">
      <h1>掉线时长分析</h1>
      <el-radio-group v-model="period" @change="load">
        <el-radio-button value="7d">近7天</el-radio-button>
        <el-radio-button value="30d">近30天</el-radio-button>
        <el-radio-button value="90d">近90天</el-radio-button>
        <el-radio-button value="all">全部</el-radio-button>
      </el-radio-group>
    </div>

    <el-skeleton v-if="loading" :rows="6" animated style="padding: 20px" />

    <template v-else-if="stats">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <el-card class="summary-card">
          <div class="card-value">{{ stats.total_disconnected }}</div>
          <div class="card-label">已掉线账号</div>
        </el-card>
        <el-card class="summary-card">
          <div class="card-value">{{ stats.never_disconnected }}</div>
          <div class="card-label">从未掉线</div>
        </el-card>
      </div>

      <!-- Bar Chart -->
      <el-card class="chart-card">
        <template #header><span>授权后首次掉线时长分布</span></template>
        <div class="chart">
          <div v-for="item in stats.distribution" :key="item.label" class="bar-row">
            <div class="bar-label">{{ item.label }}</div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: item.percentage + '%' }"></div>
            </div>
            <div class="bar-meta">{{ item.count }} <span class="pct">({{ item.percentage.toFixed(1) }}%)</span></div>
          </div>
        </div>
      </el-card>

      <!-- Table -->
      <el-card>
        <template #header><span>详细数据</span></template>
        <el-table :data="stats.distribution" size="small">
          <el-table-column prop="label" label="时长区间" />
          <el-table-column prop="count" label="账号数" align="right" />
          <el-table-column label="占比" align="right">
            <template #default="{ row }">{{ row.percentage.toFixed(1) }}%</template>
          </el-table-column>
          <el-table-column label="占比条" min-width="120">
            <template #default="{ row }">
              <div class="inline-bar">
                <div class="inline-bar-fill" :style="{ width: row.percentage + '%' }"></div>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <el-empty v-else description="暂无数据" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { accountApi } from '@/api/account'

type Period = '7d' | '30d' | '90d' | 'all'
type Stats = Awaited<ReturnType<typeof accountApi.getDisconnectStats>>

const period = ref<Period>('30d')
const loading = ref(false)
const stats = ref<Stats | null>(null)

async function load() {
  loading.value = true
  try {
    stats.value = await accountApi.getDisconnectStats({ period: period.value })
  } catch {
    stats.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.analytics {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.summary-card {
  text-align: center;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-color-primary);
}

.card-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.chart {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 8px 0;
}

.bar-row {
  display: grid;
  grid-template-columns: 80px 1fr 100px;
  align-items: center;
  gap: 12px;
}

.bar-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  text-align: right;
}

.bar-track {
  background: var(--el-fill-color-light);
  border-radius: 4px;
  height: 20px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--el-color-primary);
  border-radius: 4px;
  transition: width 0.4s ease;
}

.bar-meta {
  font-size: 13px;
  font-weight: 500;
}

.pct {
  color: var(--el-text-color-secondary);
  font-weight: 400;
}

.inline-bar {
  background: var(--el-fill-color-light);
  border-radius: 3px;
  height: 8px;
  overflow: hidden;
}

.inline-bar-fill {
  height: 100%;
  background: var(--el-color-primary-light-3);
  border-radius: 3px;
}

@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
