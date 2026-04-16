<template>
  <div class="dashboard">
    <h1>仪表板</h1>
    <p>欢迎使用 WhatsApp 管理系统</p>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon size="32" color="#409eff">
                <User />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">1,234</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon size="32" color="#67c23a">
                <ChatDotRound />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">5,678</div>
              <div class="stat-label">消息总数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon size="32" color="#e6a23c">
                <UserFilled />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">89</div>
              <div class="stat-label">活跃群组</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon size="32" color="#f56c6c">
                <TrendCharts />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">92%</div>
              <div class="stat-label">在线率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { User, ChatDotRound, UserFilled, TrendCharts } from '@element-plus/icons-vue'
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stats-cards {
  margin-top: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}
</style>