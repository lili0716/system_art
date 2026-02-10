<template>
  <div class="salary-statistics-page art-full-height">
    <!-- 搜索栏 -->
    <div class="search-wrapper">
      <el-form inline>
        <el-form-item label="统计月份">
          <el-date-picker
            v-model="month"
            type="month"
            value-format="YYYY-MM"
            placeholder="选择月份"
            style="width: 140px"
            @change="fetchData"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">
            <template #icon>
              <el-icon><Search /></el-icon>
            </template>
            查询
          </el-button>
          <el-button @click="handleExport">
            <template #icon>
              <el-icon><Download /></el-icon>
            </template>
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格 -->
    <el-card class="art-table-card" shadow="never">
      <el-table v-loading="loading" :data="data" height="100%" border style="width: 100%">
        <el-table-column prop="userName" label="姓名" min-width="100" fixed="left" align="center" />
        <el-table-column prop="employeeId" label="工号" min-width="100" align="center" />
        <el-table-column prop="departmentName" label="部门" min-width="120" align="center" />
        <el-table-column label="出勤天数" min-width="120" align="center">
          <template #default="{ row }">
            {{ row.actualAttendanceDays }} / {{ row.shouldAttendanceDays || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="平时加班(h)" min-width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.weekdayOvertimeHours > 0" type="success" size="small">{{
              row.weekdayOvertimeHours
            }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="周末加班(h)" min-width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.weekendOvertimeHours > 0" type="warning" size="small">{{
              row.weekendOvertimeHours
            }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sickLeaveHours" label="病假(h)" min-width="90" align="center">
          <template #default="{ row }">{{
            row.sickLeaveHours > 0 ? row.sickLeaveHours : '-'
          }}</template>
        </el-table-column>
        <el-table-column prop="personalLeaveHours" label="事假(h)" min-width="90" align="center">
          <template #default="{ row }">{{
            row.personalLeaveHours > 0 ? row.personalLeaveHours : '-'
          }}</template>
        </el-table-column>
        <el-table-column label="餐补" min-width="120" align="center">
          <template #default="{ row }">{{ `¥${row.mealSubsidy} (${row.mealCount}次)` }}</template>
        </el-table-column>
        <el-table-column label="应发工资" min-width="150" fixed="right" align="center">
          <template #default="{ row }">
            <span class="text-red-500 font-bold">¥{{ row.grossSalary }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { getSalaryStatistics } from '@/api/system-manage'
  import dayjs from 'dayjs'
  import { ElMessage } from 'element-plus'
  import { Search, Download } from '@element-plus/icons-vue'

  defineOptions({ name: 'SalaryStatistics' })

  const month = ref(dayjs().format('YYYY-MM'))
  const data = ref([])
  const loading = ref(false)

  const fetchData = async () => {
    if (!month.value) return
    loading.value = true
    try {
      const res = await getSalaryStatistics(month.value)
      if ((res as any).data) {
        data.value = (res as any).data
      }
    } catch (error) {
      console.error(error)
    } finally {
      loading.value = false
    }
  }

  const handleExport = () => {
    ElMessage.info('导出功能开发中')
  }

  onMounted(() => {
    fetchData()
  })
</script>

<style scoped>
  .search-wrapper {
    padding: 18px 18px 0;
    margin-bottom: 15px;
    background-color: #fff;
    border-radius: 4px;
  }
</style>
