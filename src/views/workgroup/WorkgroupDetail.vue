<template>
  <div class="workgroup-detail" v-loading="loading">
    <!-- Page Header -->
    <div class="header-card">
      <div class="header-top">
        <el-button :icon="ArrowLeft" @click="goBack">返回</el-button>
        <div v-if="workgroup" class="header-info">
          <h2>{{ workgroup.name }}</h2>
          <el-tag
            :type="{ active: 'success', disabled: 'danger', archived: 'warning' }[workgroup.status] || 'info'"
            effect="dark"
          >
            {{ { active: '啟用', disabled: '停用', archived: '已封存' }[workgroup.status] || workgroup.status }}
          </el-tag>
        </div>
      </div>
      <p v-if="workgroup?.description" class="description">{{ workgroup.description }}</p>
    </div>

    <!-- Tabs -->
    <el-card>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="業務員" name="agents" lazy>
          <WorkgroupAgentTab :workgroup-id="workgroupId" />
        </el-tab-pane>
        <el-tab-pane label="帳號管理" name="accounts" lazy>
          <WorkgroupAccountTab :workgroup-id="workgroupId" :workgroup-type="workgroup?.type" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { workgroupApi } from '@/api/workgroup'
import type { Workgroup } from '@/api/workgroup'
import WorkgroupAgentTab from './WorkgroupAgentTab.vue'
import WorkgroupAccountTab from './WorkgroupAccountTab.vue'

const route = useRoute()
const router = useRouter()

const workgroupId = computed(() => Number(route.params.id))
const activeTab = ref('agents')

const loading = ref(false)
const workgroup = ref<Workgroup | null>(null)

const fetchWorkgroup = async () => {
  try {
    loading.value = true
    workgroup.value = await workgroupApi.getById(workgroupId.value)
  } catch (error) {
    ElMessage.error('取得工作組資訊失敗')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push({ name: 'WorkgroupList' })
}

onMounted(() => {
  fetchWorkgroup()
})
</script>

<style scoped>
.workgroup-detail {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-top {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-info h2 {
  margin: 0;
  font-size: 20px;
}

.description {
  margin: 12px 0 0;
  color: #606266;
}
</style>
