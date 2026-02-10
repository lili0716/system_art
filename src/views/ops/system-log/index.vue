<!-- 系统日志页面 -->
<template>
  <div class="system-log-page">
    <!-- 搜索栏 -->
    <ElCard class="search-card" shadow="never">
      <ElForm :model="searchForm" inline>
        <ElFormItem label="时间范围">
          <ElDatePicker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            :shortcuts="dateShortcuts"
            style="width: 360px"
          />
        </ElFormItem>
        <ElFormItem label="用户">
          <ElInput
            v-model="searchForm.nickName"
            placeholder="用户姓名"
            clearable
            style="width: 140px"
          />
        </ElFormItem>
        <ElFormItem label="工号">
          <ElInput
            v-model="searchForm.employeeId"
            placeholder="工号"
            clearable
            style="width: 120px"
          />
        </ElFormItem>
        <ElFormItem label="请求方法">
          <ElSelect v-model="searchForm.method" placeholder="全部" clearable style="width: 100px">
            <ElOption label="GET" value="GET" />
            <ElOption label="POST" value="POST" />
            <ElOption label="PUT" value="PUT" />
            <ElOption label="DELETE" value="DELETE" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="URI">
          <ElInput v-model="searchForm.uri" placeholder="请求路径" clearable style="width: 180px" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleSearch" v-ripple>
            <i class="ri-search-line" style="margin-right: 4px"></i>查询
          </ElButton>
          <ElButton @click="handleReset" v-ripple>
            <i class="ri-refresh-line" style="margin-right: 4px"></i>重置
          </ElButton>
          <ElButton type="success" @click="handleExport" :loading="exporting" v-ripple>
            <i class="ri-file-excel-2-line" style="margin-right: 4px"></i>导出Excel
          </ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <!-- 表格 -->
    <ElCard class="table-card" shadow="never">
      <ElTable
        :data="tableData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', fontWeight: '600' }"
        row-key="id"
      >
        <ElTableColumn type="index" label="序号" width="60" align="center" />
        <ElTableColumn prop="requestTime" label="请求时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatTime(row.requestTime) }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="employeeId" label="工号" width="90" align="center" />
        <ElTableColumn prop="nickName" label="用户" width="90" align="center">
          <template #default="{ row }">
            <span>{{ row.nickName || '-' }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="method" label="方法" width="80" align="center">
          <template #default="{ row }">
            <ElTag :type="getMethodTagType(row.method)" size="small" effect="dark">
              {{ row.method }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="uri" label="请求URI" min-width="220" show-overflow-tooltip />
        <ElTableColumn prop="requestParams" label="请求参数" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="params-text">{{ row.requestParams || '-' }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="responseCode" label="状态码" width="80" align="center">
          <template #default="{ row }">
            <ElTag :type="row.responseCode === 200 ? 'success' : 'danger'" size="small">
              {{ row.responseCode }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="duration" label="耗时" width="90" align="center">
          <template #default="{ row }">
            <span :class="{ 'slow-request': row.duration > 1000 }">{{ row.duration }}ms</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="ip" label="IP地址" width="130" align="center" />
        <ElTableColumn label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="showDetail(row)">详情</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <ElPagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </ElCard>

    <!-- 详情弹窗 -->
    <ElDialog v-model="detailVisible" title="日志详情" width="700px" top="5vh">
      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="请求时间" :span="2">{{
          formatTime(detailData.requestTime)
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="用户工号">{{ detailData.employeeId || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="用户姓名">{{ detailData.nickName || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="请求方法">
          <ElTag :type="getMethodTagType(detailData.method)" size="small" effect="dark">{{
            detailData.method
          }}</ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="状态码">
          <ElTag :type="detailData.responseCode === 200 ? 'success' : 'danger'" size="small">{{
            detailData.responseCode
          }}</ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="请求URI" :span="2">{{ detailData.uri }}</ElDescriptionsItem>
        <ElDescriptionsItem label="耗时">{{ detailData.duration }}ms</ElDescriptionsItem>
        <ElDescriptionsItem label="IP地址">{{ detailData.ip }}</ElDescriptionsItem>
      </ElDescriptions>
      <div v-if="detailData.requestParams" style="margin-top: 16px">
        <div class="detail-label">请求参数:</div>
        <ElInput
          type="textarea"
          :model-value="formatJson(detailData.requestParams)"
          :rows="6"
          readonly
        />
      </div>
      <div v-if="detailData.responseBody" style="margin-top: 16px">
        <div class="detail-label">响应内容:</div>
        <ElInput
          type="textarea"
          :model-value="formatJson(detailData.responseBody)"
          :rows="8"
          readonly
        />
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { fetchSystemLogs, exportSystemLogs } from '@/api/system-manage'

  defineOptions({ name: 'SystemLog' })

  const loading = ref(false)
  const exporting = ref(false)
  const tableData = ref<any[]>([])
  const dateRange = ref<[string, string] | null>(null)

  const searchForm = reactive({
    nickName: '',
    employeeId: '',
    method: '',
    uri: ''
  })

  const pagination = reactive({
    current: 1,
    size: 20,
    total: 0
  })

  const detailVisible = ref(false)
  const detailData = ref<any>({})

  // 时间快捷选项
  const dateShortcuts = [
    {
      text: '最近1小时',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setTime(start.getTime() - 3600 * 1000)
        return [start, end]
      }
    },
    {
      text: '今天',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        return [start, end]
      }
    },
    {
      text: '最近7天',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setTime(start.getTime() - 7 * 24 * 3600 * 1000)
        return [start, end]
      }
    },
    {
      text: '最近30天',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setTime(start.getTime() - 30 * 24 * 3600 * 1000)
        return [start, end]
      }
    }
  ]

  const getMethodTagType = (method: string) => {
    const map: Record<string, string> = {
      GET: 'primary',
      POST: 'success',
      PUT: 'warning',
      DELETE: 'danger'
    }
    return map[method] || 'info'
  }

  const formatTime = (time: any) => {
    if (!time) return '-'
    if (typeof time === 'string') return time.replace('T', ' ')
    if (Array.isArray(time)) {
      // Java LocalDateTime 序列化为数组 [year, month, day, hour, min, sec, nano]
      const [y, m, d, h, mi, s] = time
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return String(time)
  }

  const formatJson = (str: string) => {
    if (!str) return ''
    try {
      return JSON.stringify(JSON.parse(str), null, 2)
    } catch {
      return str
    }
  }

  const buildQueryParams = () => {
    const params: any = {
      current: pagination.current,
      size: pagination.size
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    if (searchForm.nickName) params.nickName = searchForm.nickName
    if (searchForm.employeeId) params.employeeId = searchForm.employeeId
    if (searchForm.method) params.method = searchForm.method
    if (searchForm.uri) params.uri = searchForm.uri
    return params
  }

  const fetchData = async () => {
    loading.value = true
    try {
      const res = await fetchSystemLogs(buildQueryParams())
      const data = res.data || res
      tableData.value = data.records || []
      pagination.total = data.total || 0
    } catch (e) {
      console.error('查询日志失败:', e)
    } finally {
      loading.value = false
    }
  }

  const handleSearch = () => {
    pagination.current = 1
    fetchData()
  }

  const handleReset = () => {
    searchForm.nickName = ''
    searchForm.employeeId = ''
    searchForm.method = ''
    searchForm.uri = ''
    dateRange.value = null
    pagination.current = 1
    fetchData()
  }

  const handleSizeChange = (val: number) => {
    pagination.size = val
    pagination.current = 1
    fetchData()
  }

  const handleCurrentChange = (val: number) => {
    pagination.current = val
    fetchData()
  }

  const handleExport = async () => {
    exporting.value = true
    try {
      const params = buildQueryParams()
      delete params.current
      delete params.size
      const res = await exportSystemLogs(params)
      // 判断响应类型
      const blob =
        res instanceof Blob
          ? res
          : new Blob([res as any], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `系统日志_${Date.now()}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
      ElMessage.success('导出成功')
    } catch (e) {
      console.error('导出失败:', e)
      ElMessage.error('导出失败')
    } finally {
      exporting.value = false
    }
  }

  const showDetail = (row: any) => {
    detailData.value = row
    detailVisible.value = true
  }

  onMounted(() => {
    fetchData()
  })
</script>

<style scoped>
  .system-log-page {
    padding: 0;
  }

  .search-card {
    margin-bottom: 16px;
  }

  .search-card :deep(.el-form-item) {
    margin-bottom: 8px;
  }

  .table-card {
    /* fill remaining */
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .params-text {
    font-family: Consolas, Monaco, monospace;
    font-size: 12px;
    color: #666;
  }

  .slow-request {
    font-weight: bold;
    color: #e6a23c;
  }

  .detail-label {
    margin-bottom: 8px;
    font-weight: 600;
    color: #303133;
  }
</style>
