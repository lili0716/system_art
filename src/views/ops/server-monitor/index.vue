<!-- 服务器管理页面 -->
<template>
  <div class="server-monitor-page">
    <!-- 刷新按钮和轮询控制 -->
    <div class="page-header">
      <span class="last-update" v-if="lastUpdate">最后更新: {{ lastUpdate }}</span>
      <div class="header-buttons">
        <ElButton 
          :type="pollingEnabled ? 'warning' : 'success'" 
          @click="togglePolling"
          v-ripple
        >
          <i :class="pollingEnabled ? 'ri-pause-circle-line' : 'ri-play-circle-line'" style="margin-right: 4px"></i>
          {{ pollingEnabled ? '暂停轮询' : '启动轮询' }}
        </ElButton>
        <ElButton type="primary" :loading="loading" @click="handleRefresh" v-ripple>
          <i class="ri-refresh-line" style="margin-right: 4px"></i>刷新
        </ElButton>
      </div>
    </div>

    <!-- 服务器卡片 -->
    <div class="server-cards" v-loading="loading">
      <ElCard class="server-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="server-name">{{ serverData.hostName || '当前服务器' }}</span>
            <span class="server-ip">{{ serverData.ip || '-' }}</span>
          </div>
        </template>

        <div class="card-body">
          <!-- 服务器图标 -->
          <div class="server-icon-area">
            <div class="server-rack">
              <div class="rack-unit">
                <div class="rack-leds">
                  <span class="led led-green"></span>
                  <span class="led led-yellow"></span>
                  <span class="led led-red"></span>
                </div>
                <div class="rack-lines"></div>
              </div>
              <div class="rack-unit">
                <div class="rack-leds">
                  <span class="led led-green"></span>
                  <span class="led led-yellow"></span>
                  <span class="led led-red"></span>
                </div>
                <div class="rack-lines"></div>
              </div>
              <div class="rack-unit rack-bottom">
                <div class="rack-leds">
                  <span class="led led-green"></span>
                  <span class="led led-green"></span>
                  <span class="led led-green"></span>
                </div>
                <div class="rack-lines"></div>
              </div>
            </div>
          </div>

          <!-- 指标 -->
          <div class="metrics-area">
            <div class="metric-item">
              <div class="metric-label">CPU</div>
              <div class="metric-bar">
                <ElProgress
                  :percentage="serverData.cpu?.usage || 0"
                  :color="getProgressColor(serverData.cpu?.usage || 0, 'cpu')"
                  :stroke-width="16"
                  :format="(val: number) => val.toFixed(1) + '%'"
                />
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">RAM</div>
              <div class="metric-bar">
                <ElProgress
                  :percentage="serverData.ram?.usage || 0"
                  :color="getProgressColor(serverData.ram?.usage || 0, 'ram')"
                  :stroke-width="16"
                  :format="(val: number) => val.toFixed(1) + '%'"
                />
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">SWAP</div>
              <div class="metric-bar">
                <ElProgress
                  :percentage="serverData.swap?.usage || 0"
                  :color="getProgressColor(serverData.swap?.usage || 0, 'swap')"
                  :stroke-width="16"
                  :format="(val: number) => val.toFixed(1) + '%'"
                />
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">DISK</div>
              <div class="metric-bar">
                <ElProgress
                  :percentage="serverData.disk?.usage || 0"
                  :color="getProgressColor(serverData.disk?.usage || 0, 'disk')"
                  :stroke-width="16"
                  :format="(val: number) => val.toFixed(1) + '%'"
                />
              </div>
            </div>
          </div>
        </div>
      </ElCard>
    </div>

    <!-- 详细信息 -->
    <div class="detail-section" v-if="!loading && serverData.cpu">
      <ElRow :gutter="16">
        <!-- CPU 详情 -->
        <ElCol :span="8">
          <ElCard shadow="hover" class="detail-card">
            <template #header>
              <div class="detail-header">
                <i class="ri-cpu-line detail-icon cpu-icon"></i>
                <span>CPU 信息</span>
              </div>
            </template>
            <ElDescriptions :column="1" size="small" border>
              <ElDescriptionsItem label="名称">{{ serverData.cpu?.name }}</ElDescriptionsItem>
              <ElDescriptionsItem label="物理核心">{{
                serverData.cpu?.physicalCount
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="逻辑核心">{{
                serverData.cpu?.logicalCount
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="使用率">
                <span :style="{ color: getUsageColor(serverData.cpu?.usage) }"
                  >{{ serverData.cpu?.usage }}%</span
                >
              </ElDescriptionsItem>
            </ElDescriptions>
          </ElCard>
        </ElCol>

        <!-- 内存详情 -->
        <ElCol :span="8">
          <ElCard shadow="hover" class="detail-card">
            <template #header>
              <div class="detail-header">
                <i class="ri-ram-line detail-icon ram-icon"></i>
                <span>内存信息</span>
              </div>
            </template>
            <ElDescriptions :column="1" size="small" border>
              <ElDescriptionsItem label="总内存">{{ serverData.ram?.total }}</ElDescriptionsItem>
              <ElDescriptionsItem label="已使用">{{ serverData.ram?.used }}</ElDescriptionsItem>
              <ElDescriptionsItem label="可用">{{ serverData.ram?.free }}</ElDescriptionsItem>
              <ElDescriptionsItem label="使用率">
                <span :style="{ color: getUsageColor(serverData.ram?.usage) }"
                  >{{ serverData.ram?.usage }}%</span
                >
              </ElDescriptionsItem>
            </ElDescriptions>
          </ElCard>
        </ElCol>

        <!-- JVM 详情 -->
        <ElCol :span="8">
          <ElCard shadow="hover" class="detail-card">
            <template #header>
              <div class="detail-header">
                <i class="ri-code-box-line detail-icon jvm-icon"></i>
                <span>JVM 信息</span>
              </div>
            </template>
            <ElDescriptions :column="1" size="small" border>
              <ElDescriptionsItem label="版本"
                >Java {{ serverData.jvm?.version }}</ElDescriptionsItem
              >
              <ElDescriptionsItem label="最大内存">{{
                serverData.jvm?.maxMemory
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="已用内存">{{
                serverData.jvm?.usedMemory
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="运行时间">{{ serverData.jvm?.uptime }}</ElDescriptionsItem>
            </ElDescriptions>
          </ElCard>
        </ElCol>
      </ElRow>

      <!-- 磁盘详情 -->
      <ElCard
        shadow="hover"
        class="detail-card disk-detail"
        style="margin-top: 16px"
        v-if="serverData.disk?.details?.length"
      >
        <template #header>
          <div class="detail-header">
            <i class="ri-hard-drive-2-line detail-icon disk-icon"></i>
            <span>磁盘详情</span>
          </div>
        </template>
        <ElTable :data="serverData.disk.details" stripe border size="small">
          <ElTableColumn prop="mount" label="挂载点" width="120" />
          <ElTableColumn prop="type" label="文件系统" width="100" />
          <ElTableColumn prop="total" label="总容量" width="100" align="center" />
          <ElTableColumn prop="used" label="已使用" width="100" align="center" />
          <ElTableColumn prop="free" label="可用" width="100" align="center" />
          <ElTableColumn prop="usage" label="使用率" width="200">
            <template #default="{ row }">
              <ElProgress
                :percentage="row.usage"
                :color="getUsageColor(row.usage)"
                :stroke-width="12"
              />
            </template>
          </ElTableColumn>
        </ElTable>
      </ElCard>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { fetchServerInfo } from '@/api/system-manage'

  defineOptions({ name: 'ServerMonitor' })

  const loading = ref(false)
  const serverData = ref<any>({})
  const lastUpdate = ref('')
  const pollingEnabled = ref(false)
  let pollingTimer: ReturnType<typeof setInterval> | null = null
  const pollingInterval = 5000 // 5秒轮询一次

  const getProgressColor = (percent: number, type: string) => {
    const colors: Record<string, string> = {
      cpu: '#409eff',
      ram: '#67c23a',
      swap: '#e6a23c',
      disk: '#13c2c2'
    }
    if (percent > 90) return '#f56c6c'
    if (percent > 70) return '#e6a23c'
    return colors[type] || '#409eff'
  }

  const getUsageColor = (usage: number) => {
    if (usage > 90) return '#f56c6c'
    if (usage > 70) return '#e6a23c'
    return '#67c23a'
  }

  const handleRefresh = () => {
    fetchData(false)
  }

  const fetchData = async (silent = false) => {
    if (!silent) {
      loading.value = true
    }
    try {
      const res = await fetchServerInfo()
      serverData.value = res.data || res || {}
      updateLastUpdate()
    } catch (e) {
      console.error('获取服务器信息失败:', e)
    } finally {
      if (!silent) {
        loading.value = false
      }
    }
  }

  const updateLastUpdate = () => {
    const now = new Date()
    lastUpdate.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  }

  const startPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
    
    pollingTimer = setInterval(() => {
      fetchData(true)
    }, pollingInterval)
    
    console.log('轮询已启动，间隔:', pollingInterval, 'ms')
  }

  const stopPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
    console.log('轮询已停止')
  }

  const togglePolling = () => {
    pollingEnabled.value = !pollingEnabled.value
    
    if (pollingEnabled.value) {
      startPolling()
    } else {
      stopPolling()
    }
  }

  onMounted(() => {
    // 初始加载时获取一次数据
    fetchData()
    // 默认不开启轮询
    pollingEnabled.value = false
  })

  onUnmounted(() => {
    stopPolling()
  })
</script>

<style scoped>
  .server-monitor-page {
    padding: 0;
  }

  .page-header {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .header-buttons {
    display: flex;
    gap: 8px;
  }

  .last-update {
    font-size: 13px;
    color: #909399;
  }

  /* 服务器卡片 */
  .server-cards {
    margin-bottom: 16px;
  }

  .server-card {
    overflow: hidden;
    border-radius: 8px;
  }

  .server-card :deep(.el-card__header) {
    padding: 12px 20px;
    color: white;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .server-name {
    font-size: 16px;
    font-weight: 600;
  }

  .server-ip {
    font-family: Consolas, monospace;
    font-size: 14px;
    opacity: 0.9;
  }

  .card-body {
    display: flex;
    gap: 40px;
    align-items: center;
    padding: 10px 0;
  }

  /* 服务器图标 - CSS 绘制 */
  .server-icon-area {
    flex-shrink: 0;
  }

  .server-rack {
    width: 100px;
    padding: 8px;
    background: linear-gradient(180deg, #4a4a4a, #2a2a2a);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 30%);
  }

  .rack-unit {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    margin-bottom: 4px;
    background: #3a3a3a;
    border-radius: 3px;
  }

  .rack-unit.rack-bottom {
    margin-bottom: 0;
  }

  .rack-leds {
    display: flex;
    gap: 4px;
  }

  .led {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .led-green {
    background: #67c23a;
    box-shadow: 0 0 4px #67c23a;
  }

  .led-yellow {
    background: #e6a23c;
    box-shadow: 0 0 4px #e6a23c;
  }

  .led-red {
    background: #f56c6c;
    box-shadow: 0 0 4px #f56c6c;
  }

  .rack-lines {
    width: 40px;
    height: 3px;
    background: repeating-linear-gradient(
      90deg,
      #555 0,
      #555 3px,
      transparent 3px,
      transparent 5px
    );
  }

  /* 指标区域 */
  .metrics-area {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 12px;
  }

  .metric-item {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .metric-label {
    flex-shrink: 0;
    width: 45px;
    font-size: 13px;
    font-weight: 600;
    color: #606266;
  }

  .metric-bar {
    flex: 1;
    max-width: 500px;
  }

  .metric-bar :deep(.el-progress-bar__outer) {
    border-radius: 8px;
  }

  .metric-bar :deep(.el-progress-bar__inner) {
    border-radius: 8px;
    transition: width 0.6s ease;
  }

  /* 详细信息 */
  .detail-section {
    margin-top: 0;
  }

  .detail-card {
    border-radius: 8px;
  }

  .detail-header {
    display: flex;
    gap: 8px;
    align-items: center;
    font-weight: 600;
  }

  .detail-icon {
    font-size: 20px;
  }

  .cpu-icon {
    color: #409eff;
  }

  .ram-icon {
    color: #67c23a;
  }

  .jvm-icon {
    color: #e6a23c;
  }

  .disk-icon {
    color: #13c2c2;
  }
</style>
