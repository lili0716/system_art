<template>
  <div class="salary-statistics-page art-full-height">
    <!-- 搜索栏 -->
    <SalaryStatisticsSearch
      v-model="searchForm"
      @search="handleSearch"
      @reset="resetSearchParams"
    />

    <!-- 表格 -->
    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData" />

      <!-- 表格内容 -->
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, h } from 'vue'
  import { ElTag, ElCard } from 'element-plus'
  import dayjs from 'dayjs'
  import { useTable } from '@/hooks/core/useTable'
  import { getSalaryStatistics } from '@/api/system-manage'
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import SalaryStatisticsSearch from './modules/salary-statistics-search.vue'

  defineOptions({ name: 'SalaryStatistics' })

  // 搜索表单
  const searchForm = ref({
    month: dayjs().format('YYYY-MM'),
    employeeId: undefined,
    departmentId: undefined
  })

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    searchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    // 核心配置
    core: {
      apiFn: (params: any) => getSalaryStatistics(params.month, params.employeeId, params.departmentId, params.page, params.size),
      apiParams: {
        ...searchForm.value
      },
      paginationKey: {
        current: 'page',
        size: 'size'
      },
      columnsFactory: () => [
        { type: 'index', label: '序号', align: 'center', width: 60 },
        { prop: 'userName', label: '姓名', minWidth: 100, fixed: 'left', align: 'center' },
        { prop: 'employeeId', label: '工号', minWidth: 100, align: 'center' },
        { prop: 'departmentName', label: '部门', minWidth: 120, align: 'center' },
        {
          prop: 'actualAttendanceDays',
          label: '出勤天数',
          minWidth: 120,
          align: 'center',
          formatter: (row: any) => `${row.actualAttendanceDays} / ${row.shouldAttendanceDays || '-'}`
        },
        {
          prop: 'weekdayOvertimeHours',
          label: '平时加班(h)',
          minWidth: 120,
          align: 'center',
          formatter: (row: any) => {
            if (row.weekdayOvertimeHours > 0) {
              return h(ElTag, { type: 'success', size: 'small' }, () => row.weekdayOvertimeHours)
            }
            return '-'
          }
        },
        {
          prop: 'weekendOvertimeHours',
          label: '周末加班(h)',
          minWidth: 120,
          align: 'center',
          formatter: (row: any) => {
            if (row.weekendOvertimeHours > 0) {
              return h(ElTag, { type: 'warning', size: 'small' }, () => row.weekendOvertimeHours)
            }
            return '-'
          }
        },
        {
          prop: 'sickLeaveHours',
          label: '病假(h)',
          minWidth: 90,
          align: 'center',
          formatter: (row: any) => row.sickLeaveHours > 0 ? row.sickLeaveHours : '-'
        },
        {
          prop: 'personalLeaveHours',
          label: '事假(h)',
          minWidth: 90,
          align: 'center',
          formatter: (row: any) => row.personalLeaveHours > 0 ? row.personalLeaveHours : '-'
        },
        {
          prop: 'mealSubsidy',
          label: '餐补',
          minWidth: 120,
          align: 'center',
          formatter: (row: any) => `¥${row.mealSubsidy} (${row.mealCount}次)`
        },
        {
          prop: 'grossSalary',
          label: '应发工资',
          minWidth: 150,
          fixed: 'right',
          align: 'center',
          formatter: (row: any) => h('span', { class: 'text-red-500 font-bold' }, `¥${row.grossSalary}`)
        }
      ]
    },
    transform: {
      responseAdapter: (res: any) => {
        const data = res.data || {}
        return {
          records: data.content || [],
          total: data.totalElements || 0,
          current: data.number ? data.number + 1 : 1,
          size: data.size || 10
        }
      }
    }
  })

  /**
   * 搜索处理
   */
  const handleSearch = (params: Record<string, any>) => {
    Object.assign(searchParams, params)
    getData()
  }

</script>
