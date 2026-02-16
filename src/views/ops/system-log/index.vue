<template>
  <div class="system-log-page art-full-height">
    <ArtSearchBar :items="searchItems" @search="handleSearch" @reset="handleReset" />

    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElButton type="default" @click="handleExport" :loading="exporting" v-ripple>
            <i class="ri-file-excel-2-line" style="margin-right: 4px"></i>
            {{ t('systemLog.toolbar.exportExcel') }}
          </ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable
        class="auto-height"
        :height="height"
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <!-- 详情弹窗 -->
    <ElDialog v-model="detailVisible" :title="t('systemLog.dialog.title')" width="700px" top="5vh">
      <ElDescriptions :column="2" border>
        <ElDescriptionsItem :label="t('systemLog.detail.requestTime')" :span="2">{{
          formatTime(detailData.requestTime)
        }}</ElDescriptionsItem>
        <ElDescriptionsItem :label="t('systemLog.detail.employeeId')">
          {{ detailData.employeeId || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="t('systemLog.detail.nickName')">
          {{ detailData.nickName || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="t('systemLog.detail.method')">
          <ElTag :type="getMethodTagType(detailData.method)" size="small" effect="dark">{{
            detailData.method
          }}</ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="t('systemLog.detail.statusCode')">
          <ElTag :type="detailData.responseCode === 200 ? 'success' : 'danger'" size="small">{{
            detailData.responseCode
          }}</ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="t('systemLog.detail.uri')" :span="2">
          {{ detailData.uri }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="t('systemLog.detail.duration')">
          {{ detailData.duration }}ms
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="t('systemLog.detail.ip')">
          {{ detailData.ip }}
        </ElDescriptionsItem>
      </ElDescriptions>
      <div v-if="detailData.requestParams" style="margin-top: 16px">
        <div class="detail-label">{{ t('systemLog.detail.requestParams') }}</div>
        <ElInput
          type="textarea"
          :model-value="formatJson(detailData.requestParams)"
          :rows="6"
          readonly
        />
      </div>
      <div v-if="detailData.responseBody" style="margin-top: 16px">
        <div class="detail-label">{{ t('systemLog.detail.responseBody') }}</div>
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
  import { ref, computed } from 'vue'
  import { ElMessage, ElTag, ElButton } from 'element-plus'
  import { fetchSystemLogs, exportSystemLogs } from '@/api/system-manage'
  import { useTable } from '@/hooks/core/useTable'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useI18n } from 'vue-i18n'

  defineOptions({ name: 'SystemLog' })

  const { t } = useI18n()

  const exporting = ref(false)
  const detailVisible = ref(false)
  const detailData = ref<any>({})

  // 搜索项配置
  const searchItems = computed(() => [
    {
      type: 'daterange',
      key: 'dateRange',
      label: t('systemLog.search.dateRange'),
      props: {
        type: 'daterange',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        defaultTime: [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 2, 1, 23, 59, 59)]
      }
    },
    {
      type: 'input',
      key: 'nickName',
      label: t('systemLog.search.nickName'),
      props: { placeholder: t('systemLog.search.nickNamePlaceholder') }
    },
    {
      type: 'input',
      key: 'employeeId',
      label: t('systemLog.search.employeeId'),
      props: { placeholder: t('systemLog.search.employeeIdPlaceholder') }
    },
    {
      type: 'select',
      key: 'method',
      label: t('systemLog.search.method'),
      props: {
        placeholder: t('systemLog.search.methodPlaceholder'),
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' }
        ]
      }
    },
    {
      type: 'input',
      key: 'uri',
      label: t('systemLog.search.uri'),
      props: { placeholder: t('systemLog.search.uriPlaceholder') }
    }
  ])

  // 时间格式化
  const formatTime = (time: any) => {
    if (!time) return '-'
    if (typeof time === 'string') return time.replace('T', ' ')
    if (Array.isArray(time)) {
      const [y, m, d, h, mi, s] = time
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return String(time)
  }

  // JSON 格式化
  const formatJson = (str: string) => {
    if (!str) return ''
    try {
      return JSON.stringify(JSON.parse(str), null, 2)
    } catch {
      return str
    }
  }

  // 方法标签颜色
  const getMethodTagType = (method: string) => {
    const map: Record<string, string> = {
      GET: 'primary',
      POST: 'success',
      PUT: 'warning',
      DELETE: 'danger'
    }
    return map[method] || 'info'
  }

  // 表格 Hook
  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    searchParams,
    getData,
    handleSizeChange,
    handleCurrentChange,
    refreshData,
    resetSearchParams,
    height // 解构出 height
  } = useTable({
    core: {
      apiFn: fetchSystemLogs,
      // 自定义参数处理：将 dateRange 拆分为 startTime 和 endTime
      apiParams: {
        current: 1,
        size: 20
      },
      columnsFactory: () => [
        {
          prop: 'id',
          label: 'ID',
          width: 80,
          align: 'center'
        },
        {
          prop: 'requestTime',
          label: t('systemLog.table.requestTime'),
          width: 170,
          align: 'center',
          formatter: (row: any) => formatTime(row.requestTime)
        },
        {
          prop: 'employeeId',
          label: t('systemLog.table.employeeId'),
          width: 100,
          align: 'center'
        },
        {
          prop: 'nickName',
          label: t('systemLog.table.nickName'),
          width: 100,
          align: 'center',
          formatter: (row: any) => row.nickName || '-'
        },
        {
          prop: 'method',
          label: t('systemLog.table.method'),
          width: 90,
          align: 'center',
          formatter: (row: any) => {
            return h(
              ElTag,
              { type: getMethodTagType(row.method), size: 'small', effect: 'dark' },
              () => row.method
            )
          }
        },
        {
          prop: 'uri',
          label: t('systemLog.table.uri'),
          minWidth: 200,
          showOverflowTooltip: true
        },
        {
          prop: 'requestParams',
          label: t('systemLog.table.requestParams'),
          minWidth: 150,
          showOverflowTooltip: true,
          formatter: (row: any) => row.requestParams || '-'
        },
        {
          prop: 'responseCode',
          label: t('systemLog.table.statusCode'),
          width: 90,
          align: 'center',
          formatter: (row: any) => {
            return h(
              ElTag,
              { type: row.responseCode === 200 ? 'success' : 'danger', size: 'small' },
              () => row.responseCode
            )
          }
        },
        {
          prop: 'duration',
          label: t('systemLog.table.duration'),
          width: 100,
          align: 'center',
          formatter: (row: any) => {
            return h(
              'span',
              { class: row.duration > 1000 ? 'slow-request' : '' },
              `${row.duration}ms`
            )
          }
        },
        {
          prop: 'ip',
          label: t('systemLog.table.ip'),
          width: 130,
          align: 'center'
        },
        {
          prop: 'operation',
          label: t('systemLog.table.operation'),
          width: 90,
          fixed: 'right',
          align: 'center',
          formatter: (row: any) => {
            return h(ArtButtonTable, {
              type: 'view',
              text: t('systemLog.table.detail'),
              title: t('systemLog.table.detailTitle'),
              onClick: () => showDetail(row)
            })
          }
        }
      ]
    },
    // 启用高度自适应
    tableHeight: {
      enable: true
      // 这里的 220 大概是 搜索栏高度(约60-80) + 表头栏高度(约50) + 分页栏高度(约50) + padding/margin
      // 根据实际情况调整，通常 useTableHeight 会自动计算，但如果布局复杂可能需要 extraHeight
      // 保持默认即可尝试
    }
  })

  // 搜索处理
  const handleSearch = (params: any) => {
    const safeParams = params || {}
    const { dateRange, ...rest } = safeParams
    const queryParams: any = { ...rest }

    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
      queryParams.startTime = dateRange[0]
      queryParams.endTime = dateRange[1]
    } else {
      queryParams.startTime = undefined
      queryParams.endTime = undefined
    }

    // 更新 searchParams 并查询
    Object.assign(searchParams, queryParams)
    getData() // getData is actually getDataByPage (reset pagination)
  }

  const handleReset = () => {
    resetSearchParams()
  }

  const showDetail = (row: any) => {
    detailData.value = row
    detailVisible.value = true
  }

  const handleExport = async () => {
    exporting.value = true
    try {
      // 构造当前所有查询参数
      // searchParams 包含分页参数，导出时可能不需要分页或者后端忽略
      const params = { ...searchParams }
      delete params.current
      delete params.size

      const res = await exportSystemLogs(params)
      const blob =
        res instanceof Blob
          ? res
          : new Blob([res as any], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${t('systemLog.export.filenamePrefix')}_${Date.now()}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
      ElMessage.success(t('systemLog.messages.exportSuccess'))
    } catch (e) {
      console.error('导出失败:', e)
      ElMessage.error(t('systemLog.messages.exportFailed'))
    } finally {
      exporting.value = false
    }
  }
</script>

<style scoped lang="scss">
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
