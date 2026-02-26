<!-- 排班管理页面 -->
<template>
  <div class="art-full-height">
    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader
        :loading="loading"
        :show-search-bar="false"
        @refresh="handleRefresh"
      >
        <template #left>
          <ElSpace wrap>
            <!-- 月份切换 -->
            <div class="month-nav">
              <ElButton :icon="ArrowLeft" circle size="small" @click="prevMonth" />
              <span class="month-label">{{ currentYear }}年 {{ currentMonth }}月</span>
              <ElButton :icon="ArrowRight" circle size="small" @click="nextMonth" />
            </div>

            <!-- 部门筛选 -->
            <ElSelect
              v-model="selectedDeptId"
              placeholder="全部部门"
              clearable
              style="width: 150px"
              @change="handleDeptChange"
            >
              <ElOption
                v-for="dept in deptOptions"
                :key="dept.id"
                :label="dept.name"
                :value="dept.id"
              />
            </ElSelect>

            <!-- 生成排班按钮 -->
            <ElButton type="primary" :loading="generating" @click="handleGenerate" v-ripple>
              <el-icon><Refresh /></el-icon>
              生成本月排班
            </ElButton>
          </ElSpace>
        </template>

        <!-- 右侧班次图例 -->
        <template #right>
          <ElSpace wrap>
            <div
              v-for="type in shiftTypes"
              :key="type.id"
              class="legend-item"
            >
              <span class="legend-dot" :style="{ backgroundColor: type.color }"></span>
              <span class="legend-name">{{ type.name }}</span>
            </div>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 排班表格 -->
      <ArtTable
        :loading="loading"
        :data="(data as any[])"
        :columns="scheduleColumns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>
    </ElCard>

    <!-- 调班弹窗 -->
    <el-dialog
      v-model="shiftDialogVisible"
      :title="`调班 - ${activeCell?.emp?.nickName} · ${currentMonth}/${activeCell?.day}`"
      width="360px"
      destroy-on-close
    >
      <div class="shift-options">
        <div
          v-for="type in shiftTypes"
          :key="type.id"
          class="shift-option"
          :class="{ 'is-active': activeCell?.currentShiftTypeId === type.id }"
          @click="applyShift(type)"
        >
          <span class="shift-opt-dot" :style="{ backgroundColor: type.color }"></span>
          <div class="shift-opt-info">
            <span class="shift-opt-name">{{ type.name }}</span>
            <span class="shift-opt-time">
              {{ type.isRest ? '休息日' : `${type.workStart} - ${type.workEnd}` }}
            </span>
          </div>
          <el-icon v-if="activeCell?.currentShiftTypeId === type.id" color="#409eff"><Check /></el-icon>
        </div>
      </div>
      <template #footer>
        <ElButton @click="shiftDialogVisible = false">取消</ElButton>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, h, onMounted } from 'vue'
  import { ArrowLeft, ArrowRight, Refresh, Check } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  import { useTable } from '@/hooks/core/useTable'
  import {
    getMonthSchedule,
    generateMonthSchedule,
    updateScheduleCell,
  } from '@/api/schedule'
  import { getDepartmentOptions } from '@/api/system-manage'
  // import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'

  defineOptions({ name: 'AttendanceSchedule' })

  // ===== 年月状态 =====
  const now = new Date()
  const currentYear = ref(now.getFullYear())
  const currentMonth = ref(now.getMonth() + 1)

  // ===== 部门 =====
  const selectedDeptId = ref<number | undefined>(undefined)
  const deptOptions = ref<any[]>([])

  // ===== 班次类型（从接口返回中提取） =====
  const shiftTypes = ref<any[]>([])
  const daysInMonth = ref(30)
  const scheduleMap = ref<Record<string, Record<number, number>>>({})
  const holidays = ref<Set<string>>(new Set())

  // ===== 调班弹窗 =====
  const shiftDialogVisible = ref(false)
  interface ActiveCell { emp: any; day: number; currentShiftTypeId: number | undefined }
  const activeCell = ref<ActiveCell | null>(null)

  const generating = ref(false)

  // ===== 工具函数 =====
  function isHoliday(day: number) {
    return holidays.value.has(`${currentYear.value}-${currentMonth.value}-${day}`)
  }
  function isWeekend(day: number) {
    return new Date(currentYear.value, currentMonth.value - 1, day).getDay() === 0
  }
  function isToday(day: number) {
    const t = new Date()
    return t.getFullYear() === currentYear.value && t.getMonth() + 1 === currentMonth.value && t.getDate() === day
  }
  function getWeekday(day: number) {
    return ['日', '一', '二', '三', '四', '五', '六'][new Date(currentYear.value, currentMonth.value - 1, day).getDay()]
  }
  function getShiftType(employeeId: string, day: number) {
    const id = scheduleMap.value[employeeId]?.[day]
    return id ? shiftTypes.value.find(t => t.id === id) : null
  }

  // ===== 响应式动态列（数据返回后自动重建）=====
  const scheduleColumns = computed(() => {
    const days = daysInMonth.value || 30
    const dayCols = Array.from({ length: days }, (_, i) => {
      const day = i + 1
      const isRed = isHoliday(day) || isWeekend(day)
      const isTodayDay = isToday(day)
      return {
        prop: `day_${day}`,
        label: `${day}\n${getWeekday(day)}`,
        minWidth: 66,
        align: 'center' as const,
        className: isRed ? 'col-holiday' : isTodayDay ? 'col-today' : '',
        formatter: (row: any) => {
          const st = getShiftType(row.employeeId, day)
          return h('div', {
            class: 'shift-cell',
            onClick: () => openShiftDialog(row, day)
          }, st
            ? h('span', {
                class: 'shift-tag',
                style: { backgroundColor: st.color }
              }, st.isRest ? '休' : st.name.slice(0, 2))
            : h('span', { class: 'shift-empty' }, '-')
          )
        }
      }
    })
    return [
      {
        prop: 'nickName',
        label: '员工',
        width: 90,
        fixed: 'left' as const,
        align: 'center' as const,
        formatter: (row: any) => h('div', { class: 'emp-cell' }, [
          h('div', { class: 'emp-name' }, row.nickName),
          h('div', { class: 'emp-dept' }, row.departmentName || '')
        ])
      },
      ...dayCols
    ]
  })

  // ===== 包装 API，适配 useTable =====
  function scheduleApiFn(params: any) {
    return getMonthSchedule(
      params.year,
      params.month,
      params.deptId,
      params.page,
      params.pageSize
    )
  }

  // ===== useTable =====
  const {
    data,
    loading,
    pagination,
    getData,
    handleSizeChange,
    handleCurrentChange,
    refreshData,
    searchParams
  } = useTable({
    core: {
      apiFn: scheduleApiFn,
      apiParams: {
        year: currentYear.value,
        month: currentMonth.value,
        deptId: undefined as number | undefined,
        page: 1,
        pageSize: 20
      },
      paginationKey: { current: 'page', size: 'pageSize' },
      immediate: false,
    },
    transform: {
      responseAdapter: (response: any) => {
        const d = response?.data || response
        // 提取辅助数据
        shiftTypes.value = d.shiftTypes || []
        daysInMonth.value = d.daysInMonth || 30
        scheduleMap.value = d.schedules || {}
        holidays.value = new Set(d.holidays || [])
        return {
          records: d.employees || [],
          total: d.total || 0,
          current: d.page || 1,
          size: d.pageSize || 20
        }
      }
    }
  })

  // ===== 部门切换 =====
  function handleDeptChange() {
    ;(searchParams as any).deptId = selectedDeptId.value
    ;(searchParams as any).page = 1
    getData()
  }

  // ===== 月份切换 =====
  function prevMonth() {
    if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value -= 1 }
    else { currentMonth.value -= 1 }
    updateMonthParams()
  }
  function nextMonth() {
    if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value += 1 }
    else { currentMonth.value += 1 }
    updateMonthParams()
  }
  function updateMonthParams() {
    ;(searchParams as any).year = currentYear.value
    ;(searchParams as any).month = currentMonth.value
    ;(searchParams as any).page = 1
    getData()
  }

  // ===== 刷新 =====
  function handleRefresh() {
    refreshData()
  }

  // ===== 生成排班 =====
  async function handleGenerate() {
    generating.value = true
    try {
      const res = await generateMonthSchedule(currentYear.value, currentMonth.value)
      ElMessage.success(res?.msg || '生成成功')
      refreshData()
    } catch {
      ElMessage.error('生成排班失败')
    } finally {
      generating.value = false
    }
  }

  // ===== 调班弹窗 =====
  function openShiftDialog(emp: any, day: number) {
    const shiftTypeId = scheduleMap.value[emp.employeeId]?.[day]
    activeCell.value = { emp, day, currentShiftTypeId: shiftTypeId }
    shiftDialogVisible.value = true
  }

  async function applyShift(type: any) {
    if (!activeCell.value) return
    const { emp, day } = activeCell.value
    try {
      await updateScheduleCell({
        year: currentYear.value,
        month: currentMonth.value,
        day,
        employeeId: emp.employeeId,
        shiftTypeId: type.id
      })
      if (!scheduleMap.value[emp.employeeId]) scheduleMap.value[emp.employeeId] = {}
      scheduleMap.value[emp.employeeId][day] = type.id
      activeCell.value.currentShiftTypeId = type.id
      ElMessage.success(`已将 ${emp.nickName} ${currentMonth.value}/${day} 调整为 ${type.name}`)
    } catch {
      ElMessage.error('调班失败')
    }
    shiftDialogVisible.value = false
  }

  // ===== 加载部门选项 =====
  async function loadDeptOptions() {
    try {
      const res = await getDepartmentOptions()
      deptOptions.value = res?.data || res || []
    } catch (e) { console.error(e) }
  }

  onMounted(async () => {
    await loadDeptOptions()
    getData()
  })
</script>

<style scoped lang="scss">
  /* 月份导航 */
  .month-nav {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .month-label {
    font-size: 15px;
    font-weight: 700;
    min-width: 110px;
    text-align: center;
    color: var(--el-text-color-primary);
  }

  /* 班次图例 */
  .legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .legend-name {
    white-space: nowrap;
  }

  /* 员工列 */
  .emp-cell {
    line-height: 1.4;
    .emp-name { font-size: 13px; font-weight: 500; color: var(--el-text-color-primary); }
    .emp-dept { font-size: 11px; color: var(--el-text-color-secondary); margin-top: 2px; }
  }

  /* 班次格 */
  .shift-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 48px;
    cursor: pointer;
    transition: background 0.15s;
    &:hover { background: rgba(64, 158, 255, 0.06); }
  }
  .shift-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: 28px;
    border-radius: 6px;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    user-select: none;
  }
  .shift-empty {
    color: var(--el-text-color-placeholder);
    font-size: 13px;
    user-select: none;
  }

  /* 调班弹窗内容 */
  .shift-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .shift-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 8px;
    cursor: pointer;
    border: 2px solid transparent;
    background: var(--el-fill-color-light);
    transition: all 0.15s;
    &:hover { border-color: var(--el-border-color); background: var(--el-fill-color); }
    &.is-active { border-color: var(--el-color-primary); background: rgba(64, 158, 255, 0.08); }
  }
  .shift-opt-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .shift-opt-info {
    flex: 1;
    .shift-opt-name { font-size: 14px; font-weight: 600; display: block; color: var(--el-text-color-primary); }
    .shift-opt-time { font-size: 12px; color: var(--el-text-color-secondary); display: block; margin-top: 2px; }
  }

  :deep(.col-holiday .cell) { color: #f56c6c; }
  :deep(.col-today .cell) { color: #409eff; font-weight: 700; }
  /* td padding 正常 */
  :deep(.el-table td) { padding: 8px 0; }
  :deep(.el-table th) { padding: 10px 0; white-space: pre-line; font-size: 13px; line-height: 1.5; }
  :deep(.el-table .cell) { padding: 0 4px; }
  /* 员工列定宽调大字体 */
  .emp-cell {
    line-height: 1.5;
    .emp-name { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
    .emp-dept { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 3px; }
  }
</style>
