<!-- 排班管理页面 -->
<template>
  <div class="art-full-height">
    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader :loading="loading" :show-search-bar="false" @refresh="handleRefresh">
        <template #left>
          <ElSpace wrap>
            <!-- 月份切换 -->
            <div class="month-nav">
              <ElButton :icon="ArrowLeft" circle size="small" @click="prevMonth" />
              <span class="month-label">{{ currentYear }}年 {{ currentMonth }}月</span>
              <ElButton :icon="ArrowRight" circle size="small" @click="nextMonth" />
            </div>

            <!-- 部门筛选 -->
            <ElTreeSelect
              v-model="selectedDeptId"
              :data="deptOptions"
              :props="{ label: 'name', value: 'id' }"
              check-strictly
              placeholder="全部部门"
              clearable
              style="width: 150px"
              @change="handleDeptChange"
            />

            <!-- 员工筛选 -->
            <ElSelect
              v-model="selectedEmployeeIds"
              multiple
              filterable
              remote
              reserve-keyword
              placeholder="输入工号或姓名搜索"
              :remote-method="handleEmployeeSearch"
              :loading="employeeLoading"
              clearable
              style="width: 250px"
              @change="handleEmployeeChange"
            >
              <ElOption
                v-for="item in employeeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>

            <!-- 生成排班按钮 -->
            <ElButton type="primary" :loading="generateDialogVisible" @click="handleGenerate" v-ripple>
              <el-icon><Refresh /></el-icon>
              生成本月排班
            </ElButton>

            <!-- 导入排班按钮 -->
            <ElButton type="warning" @click="openImportDialog" v-ripple>
              <el-icon><Upload /></el-icon>
              导入排班
            </ElButton>
          </ElSpace>
        </template>

        <!-- 右侧班次图例 -->
        <template #right>
          <ElSpace wrap>
            <div v-for="type in shiftTypes" :key="type.id" class="legend-item">
              <span class="legend-dot" :style="{ backgroundColor: type.color }"></span>
              <span class="legend-name">{{ type.name }}</span>
            </div>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 排班表格 -->
      <ArtTable
        :loading="loading"
        :data="data as any[]"
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
          <el-icon v-if="activeCell?.currentShiftTypeId === type.id" color="#409eff"
            ><Check
          /></el-icon>
        </div>
      </div>
      <template #footer>
        <ElButton @click="shiftDialogVisible = false">取消</ElButton>
      </template>
    </el-dialog>

    <!-- 生成排班进度弹窗 -->
    <el-dialog
      v-model="generateDialogVisible"
      title="正在疯狂计算生成排班中，请勿关闭页面"
      width="400px"
      append-to-body
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div style="text-align: center; margin: 25px 0 10px 0;">
        <el-progress 
           type="circle" 
           :percentage="Math.round(generateProgress)" 
           :status="generateHasError ? 'exception' : (generateProgress === 100 ? 'success' : '')" />
        <div style="margin-top: 15px; color: #606266; font-size: 14px;">{{ generateMessage }}</div>
      </div>
      <template #footer>
        <ElButton v-if="generateHasError || generateProgress === 100" type="primary" @click="closeGenerateDialog">
          关闭面板
        </ElButton>
      </template>
    </el-dialog>

    <!-- 导入排班弹窗 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入排班"
      width="450px"
      append-to-body
      destroy-on-close
    >
      <div v-loading="uploading" element-loading-text="正在导入并解析数据，请稍候...">
        <div class="import-tips" style="font-size: 13px; color: var(--el-text-color-regular); line-height: 1.6;">
          <p>1. 请先下载排班模板，使用内置的下拉菜单选择班别。</p>
          <p>2. 以工号为准录入排班。格子留空时将保留系统原有的排班，不作覆盖。</p>
        </div>
        <div class="import-actions" style="margin: 15px 0; text-align: center;">
          <ElButton type="primary" plain @click="handleDownloadTemplate" :loading="downloading">
            <el-icon><Download /></el-icon> 下载 {{ currentYear }}年{{ currentMonth }}月 导入模板
          </ElButton>
        </div>
        <el-upload
          ref="importUploadRef"
          class="upload-drag"
          drag
          action=""
          :auto-upload="false"
          :limit="1"
          :on-change="handleImportFileChange"
          :on-exceed="handleImportExceed"
          accept=".xls,.xlsx"
          :disabled="uploading"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            将 Excel 文件拖拽至此处，或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip" style="text-align: center;">只能上传 Excel 表格文件 (.xls, .xlsx)</div>
          </template>
        </el-upload>
        <!-- 进度条模拟展示 -->
        <div v-if="uploadProgress > 0" class="upload-progress" style="margin-top: 15px;">
          <el-progress :percentage="uploadProgress" :status="uploadProgress === 100 ? 'success' : ''" />
        </div>

        <!-- 悬停已选文件并提供上层按钮控制 -->
        <div v-if="selectedImportFile && uploadProgress === 0" style="margin-top: 15px; text-align: center;">
          <ElIcon><Document /></ElIcon> <span>{{ selectedImportFile.name }}</span>
        </div>
        <div style="margin-top: 20px; text-align: center;">
          <ElButton @click="importDialogVisible = false" :disabled="uploading">取消</ElButton>
          <ElButton type="primary" @click="handleImportUpload" :loading="uploading" :disabled="!selectedImportFile">开始导入</ElButton>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, h, onMounted } from 'vue'
  import { ArrowLeft, ArrowRight, Refresh, Check, Upload, Download, UploadFilled, Document } from '@element-plus/icons-vue'
  import type { UploadFile, UploadInstance } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { useTable } from '@/hooks/core/useTable'
  import {
    getMonthSchedule,
    generateMonthSchedule,
    updateScheduleCell,
    importSchedule,
    downloadScheduleTemplate,
    getGenerateProgress
  } from '@/api/schedule'
  import { getDepartmentOptions, searchEmployees } from '@/api/system-manage'
  import { useUserStore } from '@/store/modules/user'
  // import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'

  defineOptions({ name: 'AttendanceSchedule' })

  // ===== 年月状态 =====
  const now = new Date()
  const currentYear = ref(now.getFullYear())
  const currentMonth = ref(now.getMonth() + 1)

  // ===== 部门 =====
  const selectedDeptId = ref<number | undefined>(undefined)
  const deptOptions = ref<any[]>([])

  // ===== 员工筛选 =====
  const selectedEmployeeIds = ref<string[]>([])
  const employeeOptions = ref<Array<{ label: string; value: string }>>([])
  const employeeLoading = ref(false)

  const handleEmployeeSearch = async (query: string) => {
    if (query.length < 1) {
      employeeOptions.value = []
      return
    }
    employeeLoading.value = true
    try {
      const res: any = await searchEmployees(query)
      if (res && res.records) {
        employeeOptions.value = res.records.map((item: any) => ({
          label: `${item.nickName} (${item.employeeId})`,
          value: item.employeeId
        }))
      } else {
        employeeOptions.value = []
      }
    } catch (error) {
      console.error('搜索员工失败', error)
    } finally {
      employeeLoading.value = false
    }
  }

  function handleEmployeeChange() {
    ;(searchParams as any).employeeIds = selectedEmployeeIds.value.length
      ? selectedEmployeeIds.value.join(',')
      : undefined
    ;(searchParams as any).page = 1
    getData()
  }

  // ===== 班次类型（从接口返回中提取） =====
  const shiftTypes = ref<any[]>([])
  const daysInMonth = ref(30)
  const scheduleMap = ref<Record<string, Record<number, number>>>({})
  const holidays = ref<Set<string>>(new Set())

  // ===== 调班弹窗 =====
  const shiftDialogVisible = ref(false)
  interface ActiveCell {
    emp: any
    day: number
    currentShiftTypeId: number | undefined
  }
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
    return (
      t.getFullYear() === currentYear.value &&
      t.getMonth() + 1 === currentMonth.value &&
      t.getDate() === day
    )
  }
  function getWeekday(day: number) {
    return ['日', '一', '二', '三', '四', '五', '六'][
      new Date(currentYear.value, currentMonth.value - 1, day).getDay()
    ]
  }
  function getShiftType(employeeId: string, day: number) {
    const id = scheduleMap.value[employeeId]?.[day]
    return id ? shiftTypes.value.find((t) => t.id === id) : null
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
          return h(
            'div',
            {
              class: 'shift-cell',
              onClick: () => openShiftDialog(row, day)
            },
            st
              ? h(
                  'div',
                  {
                    style: { 
                      color: st.color, 
                      backgroundColor: (st.color || '#409eff') + '26',
                      border: `1px solid ${(st.color || '#409eff')}40`,
                      borderRadius: '5px'
                    }
                  },
                  st.isRest ? '休' : st.name
                )
              : h('div', { }, '-')
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
        formatter: (row: any) =>
          h('div', { class: 'emp-cell' }, [
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
      params.pageSize,
      params.employeeIds
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
        employeeIds: undefined as string | undefined,
        page: 1,
        pageSize: 20
      },
      paginationKey: { current: 'page', size: 'pageSize' },
      immediate: false
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
    if (currentMonth.value === 1) {
      currentMonth.value = 12
      currentYear.value -= 1
    } else {
      currentMonth.value -= 1
    }
    updateMonthParams()
  }
  function nextMonth() {
    if (currentMonth.value === 12) {
      currentMonth.value = 1
      currentYear.value += 1
    } else {
      currentMonth.value += 1
    }
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

  // ===== 进度条颜色渐变器 =====
  const customColors = [
    { color: '#f56c6c', percentage: 20 },
    { color: '#e6a23c', percentage: 40 },
    { color: '#5cb87a', percentage: 60 },
    { color: '#1989fa', percentage: 80 },
    { color: '#6f7ad3', percentage: 100 }
  ]

  // ===== 生成排班 (基于 Redis 分布式锁与异步秒级轮询架构) =====
  const generateDialogVisible = ref(false)
  const generateProgress = ref(0)
  const generateMessage = ref('正在准备请求服务器...')
  const generateHasError = ref(false)
  let pollTimer: number | null = null

  async function handleGenerate() {
    generateDialogVisible.value = true
    generateProgress.value = 0
    generateMessage.value = '正在申请分布式排班事务锁...'
    generateHasError.value = false
    
    if (pollTimer) clearInterval(pollTimer)

    try {
      // 1. 发起生成请求获取 taskId
      const res: any = await generateMonthSchedule(currentYear.value, currentMonth.value)
      // 在当前项目的 Axios 拦截器中，如果状态不为 200 就会直接进 catch，成功则直接返回 data 层
      if (!res || !res.taskId) {
        generateHasError.value = true
        generateMessage.value = '无法从服务器获取任务凭证'
        ElMessage.error(generateMessage.value)
        return
      }

      const taskId = res.taskId

      // 2. 开启每秒轮询
      pollTimer = window.setInterval(async () => {
        try {
          const pRes: any = await getGenerateProgress(taskId)
          
          if (pRes) {
            generateProgress.value = pRes.progress
            generateMessage.value = pRes.message
            
            if (pRes.error) {
              generateHasError.value = true
              ElMessage.error(pRes.message || '生成期间发生异常')
              if (pollTimer) clearInterval(pollTimer)
            } else if (pRes.complete || pRes.progress >= 100) {
              generateProgress.value = 100
              generateMessage.value = pRes.message || '生成完毕'
              ElMessage.success(generateMessage.value)
              refreshData()
              if (pollTimer) clearInterval(pollTimer)
              
              setTimeout(() => {
                closeGenerateDialog()
              }, 1200)
            }
          } else {
            // 查不到进度也认为异常 (例如过期或者锁释放丢弃)
            generateHasError.value = true
            generateMessage.value = '无法获取生成进度，请重试'
            ElMessage.error(generateMessage.value)
            if (pollTimer) clearInterval(pollTimer)
          }
        } catch (e) {
          generateHasError.value = true
          generateMessage.value = '流式轮询网络断开，可能网关阻断'
          if (pollTimer) clearInterval(pollTimer)
        }
      }, 1000)

    } catch (e: any) {
      generateHasError.value = true
      generateMessage.value = e.message || '网络请求异常'
      ElMessage.error(generateMessage.value)
    }
  }

  function closeGenerateDialog() {
    generateDialogVisible.value = false
    if (pollTimer) {
       clearInterval(pollTimer)
       pollTimer = null
    }
  }

  const importDialogVisible = ref(false)
  const uploading = ref(false)
  const uploadProgress = ref(0)
  const downloading = ref(false)

  const importUploadRef = ref<UploadInstance>()
  const selectedImportFile = ref<File | null>(null)

  function openImportDialog() {
    importDialogVisible.value = true
    uploadProgress.value = 0
    selectedImportFile.value = null
    importUploadRef.value?.clearFiles()
  }

  async function handleDownloadTemplate() {
    downloading.value = true
    try {
      const res = await downloadScheduleTemplate(currentYear.value, currentMonth.value)
      const blob = new Blob([res as any])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `schedule_template_${currentYear.value}_${currentMonth.value}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      ElMessage.error('下载模板失败')
    } finally {
      downloading.value = false
    }
  }

  const handleImportFileChange = (file: UploadFile) => {
    selectedImportFile.value = file.raw as File
  }

  const handleImportExceed = () => {
    ElMessage.warning('只能选择一个文件，请先移除当前文件后再选')
  }

  const handleImportUpload = async () => {
    if (!selectedImportFile.value) {
      ElMessage.warning('请先选择要导入的Excel文件')
      return
    }

    uploading.value = true
    uploadProgress.value = 10
    
    // 模拟平滑进度条动画
    const progressTimer = setInterval(() => {
      if (uploadProgress.value < 85) {
        uploadProgress.value += Math.floor(Math.random() * 10) + 5
      }
    }, 500)

    try {
      const res = await importSchedule(selectedImportFile.value, currentYear.value, currentMonth.value)
      clearInterval(progressTimer)
      uploadProgress.value = 100
      ElMessage.success(res?.msg || '导入成功')
      
      // 等待动画结束自动关闭弹窗刷新
      setTimeout(() => {
        importDialogVisible.value = false
        selectedImportFile.value = null
        importUploadRef.value?.clearFiles()
        refreshData()
      }, 600)
    } catch {
      clearInterval(progressTimer)
      uploadProgress.value = 0
    } finally {
      uploading.value = false
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
      const res: any = await getDepartmentOptions()
      deptOptions.value = res?.nodes || res?.data || res || []
    } catch (e) {
      console.error(e)
    }
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
    gap: 8px;
    align-items: center;
  }

  .month-label {
    min-width: 110px;
    font-size: 15px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    text-align: center;
  }

  /* 班次图例 */
  .legend-item {
    display: flex;
    gap: 5px;
    align-items: center;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .legend-dot {
    flex-shrink: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .legend-name {
    white-space: nowrap;
    font-size: 13px;
    font-weight: 500;
  }

  /* 员工列 */
  .emp-cell {
    line-height: 1.4;

    .emp-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .emp-dept {
      margin-top: 2px;
      font-size: 11px;
      color: var(--el-text-color-secondary);
    }
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

    &:hover {
      background: rgb(64 158 255 / 6%);
    }
  }

  /* 调班弹窗内容 */
  .shift-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .shift-option {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px 14px;
    cursor: pointer;
    background: var(--el-fill-color-light);
    border: 2px solid transparent;
    border-radius: 8px;
    transition: all 0.15s;

    &:hover {
      background: var(--el-fill-color);
      border-color: var(--el-border-color);
    }

    &.is-active {
      background: rgb(64 158 255 / 8%);
      border-color: var(--el-color-primary);
    }
  }

  .shift-opt-dot {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    border-radius: 50%;
  }

  .shift-opt-info {
    flex: 1;

    .shift-opt-name {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .shift-opt-time {
      display: block;
      margin-top: 2px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  :deep(.col-holiday .cell) {
    color: #f56c6c;
  }

  :deep(.col-today .cell) {
    font-weight: 700;
    color: #409eff;
  }

  /* td padding 正常 */
  :deep(.el-table td) {
    padding: 8px 0;
  }

  :deep(.el-table th) {
    padding: 10px 0;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-line;
  }

  :deep(.el-table .cell) {
    padding: 0 4px;
  }
</style>
