<template>
  <div class="art-full-height">
    <!-- 搜索区 -->
    <ElCard shadow="never" class="mb-[10px]">
      <ElSpace wrap>
        <el-date-picker
          v-model="searchDate"
          type="month"
          placeholder="选择报表月份"
          value-format="YYYY-MM"
          :clearable="false"
          style="width: 150px"
          @change="handleDateChange"
        />
        <el-tree-select
          v-model="searchForm.deptId"
          :data="deptTree"
          :props="{ label: 'name', value: 'id' }"
          check-strictly
          placeholder="全部部门"
          clearable
          style="width: 150px"
          @change="handleSearch"
        />
        <el-select
          v-model="searchForm.employeeIds"
          multiple
          filterable
          remote
          reserve-keyword
          placeholder="输入员工姓名/工号"
          :remote-method="remoteSearch"
          :loading="searchLoading"
          style="width: 240px"
          clearable
          @change="handleSearch"
        >
          <el-option
            v-for="item in employeeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
        <ElButton type="success" :loading="exportLoading" @click="handleExport">导出 Excel</ElButton>
      </ElSpace>
    </ElCard>

    <!-- 主表格区 -->
    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader :loading="loading" :show-search-bar="false" @refresh="handleSearch" />

      <ArtTable
        :loading="loading"
        :data="tableData"
        :columns="columns"
        :pagination="pagination"
        class="monthly-table"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>


    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h, watch } from 'vue'
import { getMonthlyReport, exportMonthlyReport } from '@/api/attendance-report'
import { getDepartmentTree, searchEmployees } from '@/api/system-manage'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

defineOptions({ name: 'AttendanceMonthlyReport' })

// 表格及加载状态
const loading = ref(false)
const tableData = ref([])

// 搜索设置
const searchDate = ref(dayjs().format('YYYY-MM'))
const searchForm = reactive({
  year: dayjs().year(),
  month: dayjs().month() + 1,
  deptId: undefined as number | undefined,
  employeeIds: [] as string[]
})

const daysInMonth = ref(dayjs().daysInMonth())

const handleDateChange = (val: string) => {
  if (val) {
    const d = dayjs(val)
    searchForm.year = d.year()
    searchForm.month = d.month() + 1
    daysInMonth.value = d.daysInMonth()
    buildColumns() // 当月份变动时立刻重建表格列
  }
}

// 字典关联组
const deptTree = ref([])

const employeeOptions = ref<any[]>([])
const searchLoading = ref(false)

// 表格及加载状态
const exportLoading = ref(false)
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
})

const columns = ref<any[]>([])

// 依据当月天数动态构建 ArtTable columns
const buildColumns = () => {
  const baseCols = [
    { prop: 'employeeId', label: '工号', width: 100, align: 'center', fixed: 'left' as const },
    { prop: 'nickName', label: '姓名', width: 100, align: 'center', fixed: 'left' as const },
    { prop: 'departmentName', label: '部门', width: 120, align: 'center', fixed: 'left' as const }
  ]

  const dayCols = Array.from({ length: daysInMonth.value }, (_, i) => {
    const day = i + 1
    return {
      label: `${day}日`,
      width: 65,
      align: 'center',
      formatter: (row: any) => {
        const item = row.dailyList?.[day - 1]
        if (!item || !item.text) return '-'
        let className = ''
        if (item.status === 'leave') className = 'cell-leave'
        else if (item.status === 'missing') className = 'cell-missing'
        else if (item.status === 'insufficient') className = 'cell-insufficient'

        return h(
          'div',
          { class: className, style: 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; min-height: 24px;' },
          item.text
        )
      }
    }
  })

  const statsCols = [
    {
      label: '本月统计',
      align: 'center',
      children: [
        { prop: 'attendanceDays', label: '出勤天数', width: 90, align: 'center' },
        { prop: 'workHours', label: '出勤工时', width: 90, align: 'center' },
        { prop: 'weekendWorkHours', label: '双休班(时)', width: 100, align: 'center' },
        { prop: 'weekdayOvertimeHours', label: '平时加班(时)', width: 110, align: 'center' },
        { prop: 'weekendOvertimeHours', label: '周末加班(时)', width: 110, align: 'center' }
      ]
    },
    {
      label: '异常记录',
      align: 'center',
      children: [
        { prop: 'lateCount', label: '迟到(次)', width: 80, align: 'center' },
        { prop: 'earlyCount', label: '早退(次)', width: 80, align: 'center' },
        { prop: 'absentCount', label: '旷工(次)', width: 80, align: 'center' }
      ]
    },
    {
      label: '请假汇总 (天)',
      align: 'center',
      children: [
        { label: '事假', width: 80, align: 'center', formatter: (row: any) => row.leaveStats?.['事假'] || 0 },
        { label: '病假', width: 80, align: 'center', formatter: (row: any) => row.leaveStats?.['病假'] || 0 },
        { label: '年假', width: 80, align: 'center', formatter: (row: any) => row.leaveStats?.['年假'] || 0 },
        { label: '调休', width: 80, align: 'center', formatter: (row: any) => row.leaveStats?.['调休'] || 0 },
        { label: '产假', width: 80, align: 'center', formatter: (row: any) => row.leaveStats?.['产假'] || 0 },
        { label: '其他', width: 80, align: 'center', formatter: (row: any) => row.leaveStats?.['其他'] || 0 }
      ]
    }
  ]

  columns.value = [...baseCols, ...dayCols, ...statsCols]
}

onMounted(() => {
  buildColumns()
  fetchDeptTree()
  fetchData()
})

const fetchDeptTree = async () => {
  try {
    const res: any = await getDepartmentTree()
    deptTree.value = res?.nodes || res?.data || res || []
  } catch (error) {
    console.error('获取部门树失败:', error)
  }
}

const remoteSearch = async (query: string) => {
  if (query) {
    searchLoading.value = true
    try {
      const res: any = await searchEmployees(query)
      employeeOptions.value = res || []
    } catch (error) {
      console.error('搜索员工失败:', error)
    } finally {
      searchLoading.value = false
    }
  } else {
    employeeOptions.value = []
  }
}

const fetchData = async () => {
  if (!searchForm.year || !searchForm.month) return
  
  loading.value = true
  try {
    const params = {
      year: searchForm.year,
      month: searchForm.month,
      deptId: searchForm.deptId || undefined,
      employeeIds: searchForm.employeeIds.join(',') || undefined,
      page: pagination.current,
      pageSize: pagination.size
    }
    const res: any = await getMonthlyReport(params)
    tableData.value = res.list || []
    pagination.total = res.total || 0
    daysInMonth.value = res.daysInMonth || dayjs().daysInMonth()
  } catch (error) {
    console.error('加载考勤月报失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  fetchData()
}

const resetSearch = () => {
  searchDate.value = dayjs().format('YYYY-MM')
  handleDateChange(searchDate.value)
  searchForm.deptId = undefined
  searchForm.employeeIds = []
  employeeOptions.value = []
  handleSearch()
}

const handleSizeChange = (val: number) => {
  pagination.size = val
  fetchData()
}

const handleCurrentChange = (val: number) => {
  pagination.current = val
  fetchData()
}

// 单元格渲染核心色系处理器
const getCellClass = ({ row, column, rowIndex, columnIndex }: any) => {
  // 我们只针对动态天数这一块生效 (基于索引判定，基础列占3个 0, 1, 2)
  if (columnIndex >= 3 && columnIndex < 3 + daysInMonth.value) {
    const dayIndex = columnIndex - 3
    if (row.dailyList && row.dailyList[dayIndex]) {
      const status = row.dailyList[dayIndex].status
      if (status === 'leave') {
        return 'cell-leave'
      } else if (status === 'missing') {
        return 'cell-missing'
      } else if (status === 'insufficient') {
        return 'cell-insufficient'
      }
    }
  }
  return ''
}

const handleExport = async () => {
  exportLoading.value = true
  try {
    const params = {
      year: searchForm.year,
      month: searchForm.month,
      deptId: searchForm.deptId || undefined,
      employeeIds: searchForm.employeeIds.join(',') || undefined
    }
    const blob = await exportMonthlyReport(params)
    
    // 下载流判定
    const url = window.URL.createObjectURL(blob as any)
    const link = document.createElement('a')
    link.href = url
    const formattedMonth = searchForm.month.toString().padStart(2, '0')
    link.download = `考勤月报_${searchForm.year}-${formattedMonth}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  } finally {
    exportLoading.value = false
  }
}
</script>

<style scoped>
.art-table-card {
  height: calc(100% - 65px);
  display: flex;
  flex-direction: column;
}

/* 根据状态进行样式覆写。此处因为使用了 border 表格，可以用背景色填充，或者直接对文字着色 */
:deep(.cell-leave) {
  background-color: lightgoldenrodyellow !important;
  color: #e6a23c;
  font-weight: bold;
}

:deep(.cell-missing) {
  background-color: #f0f0f0 !important;
  color: #909399;
}

:deep(.cell-insufficient) {
  background-color: #fef0f0 !important;
  color: #f56c6c;
  font-weight: bold;
}
</style>
