<template>
  <div class="art-full-height">
    <!-- 搜索区 -->
    <ElCard shadow="never" class="mb-[10px]">
      <ElSpace wrap>
        <el-date-picker
          v-model="searchForm.date"
          type="date"
          placeholder="选择报表日期"
          value-format="YYYY-MM-DD"
          :clearable="false"
          style="width: 150px"
          @change="handleSearch"
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
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getDailyReport, exportDailyReport } from '@/api/attendance-report'
import { getDepartmentTree, searchEmployees } from '@/api/system-manage'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

defineOptions({ name: 'AttendanceDailyReport' })

// 搜索栏状态
const searchForm = reactive({
  date: dayjs().format('YYYY-MM-DD'),
  deptId: undefined as number | undefined,
  employeeIds: [] as string[]
})

// 下拉字典类
const deptTree = ref([])

const employeeOptions = ref<any[]>([])
const searchLoading = ref(false)

// 表格状态
const loading = ref(false)
const tableData = ref([])
const exportLoading = ref(false)
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
})

const columns = [
  { type: 'index' as const, label: '序号', width: 60, align: 'center' },
  { prop: 'employeeId', label: '工号', width: 120, align: 'center', fixed: 'left' as const },
  { prop: 'nickName', label: '姓名', width: 120, align: 'center', fixed: 'left' as const },
  { prop: 'departmentName', label: '部门', width: 150, align: 'center' },
  { prop: 'date', label: '考勤日期', width: 120, align: 'center' },
  { prop: 'shiftName', label: '排班班次', width: 120, align: 'center' },
  { prop: 'workInTime', label: '上班打卡', width: 120, align: 'center' },
  { prop: 'workOutTime', label: '下班打卡', width: 120, align: 'center' },
  { prop: 'actualWorkHours', label: '实际工时(H)', width: 120, align: 'center' },
  { prop: 'remark', label: '综合状态备注', minWidth: 200, align: 'center' }
]

// 生命周期
onMounted(() => {
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

// 数据加载与动作
const fetchData = async () => {
  if (!searchForm.date) {
    ElMessage.warning('请选择报表日期')
    return
  }
  
  loading.value = true
  try {
    const params = {
      date: searchForm.date,
      deptId: searchForm.deptId || undefined,
      employeeIds: searchForm.employeeIds.join(',') || undefined,
      page: pagination.current,
      pageSize: pagination.size
    }
    const res: any = await getDailyReport(params)
    tableData.value = res.list || []
    pagination.total = res.total || 0
  } catch (error) {
    console.error('加载考勤日报失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  fetchData()
}

const resetSearch = () => {
  searchForm.date = dayjs().format('YYYY-MM-DD')
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

const handleExport = async () => {
  if (!searchForm.date) {
    ElMessage.warning('请选择要导出的报表日期')
    return
  }
  
  exportLoading.value = true
  try {
    const params = {
      date: searchForm.date,
      deptId: searchForm.deptId || undefined,
      employeeIds: searchForm.employeeIds.join(',') || undefined
    }
    const blob = await exportDailyReport(params)
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob as any)
    const link = document.createElement('a')
    link.href = url
    link.download = `考勤日报_${searchForm.date}.xlsx`
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
</style>
