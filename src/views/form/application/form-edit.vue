<!-- 表单填写页面 -->
<template>
  <div class="form-edit-page art-full-height">
    <ElCard class="form-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">新增申请</span>
        </div>
      </template>

      <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" class="edit-form">
        <!-- Common Fields -->
        <el-form-item label="表单类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择表单类型" @change="handleTypeChange">
            <el-option label="补打卡" :value="1" />
            <el-option label="出差" :value="2" />
            <el-option label="外勤" :value="3" />
            <el-option label="请假" :value="4" />
          </el-select>
        </el-form-item>

        <!-- Punch Card Fields -->
        <template v-if="formData.type === 1">
          <el-form-item label="打卡时间" prop="punchTime">
            <el-date-picker
              v-model="formData.punchTime"
              type="datetime"
              placeholder="选择日期时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item label="打卡地点" prop="location">
            <el-input v-model="formData.location" placeholder="请输入打卡地点" />
          </el-form-item>
        </template>

        <!-- Business Trip Fields -->
        <template v-if="formData.type === 2">
          <el-form-item label="出差地点" prop="destination">
            <el-input v-model="formData.destination" placeholder="请输入出差地点" />
          </el-form-item>
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              type="datetime"
              placeholder="选择开始时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              type="datetime"
              placeholder="选择结束时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item label="出差事由" prop="reason">
            <el-input v-model="formData.reason" type="textarea" placeholder="请输入出差事由" />
          </el-form-item>
        </template>

        <!-- Field Work Fields -->
        <template v-if="formData.type === 3">
          <el-form-item label="外勤地点" prop="location">
            <el-input v-model="formData.location" placeholder="请输入外勤地点" />
          </el-form-item>
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              type="datetime"
              placeholder="选择开始时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              type="datetime"
              placeholder="选择结束时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item label="外勤事由" prop="reason">
            <el-input v-model="formData.reason" type="textarea" placeholder="请输入外勤事由" />
          </el-form-item>
        </template>

        <!-- Leave Fields -->
        <template v-if="formData.type === 4">
          <el-form-item label="请假类型" prop="leaveType">
            <el-select v-model="formData.leaveType" placeholder="请选择请假类型">
              <el-option label="事假" :value="1" />
              <el-option label="病假" :value="2" />
              <el-option label="婚假" :value="4" />
              <el-option label="年假" :value="6" />
              <el-option label="调休" :value="7" />
            </el-select>
          </el-form-item>
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              type="datetime"
              placeholder="选择开始时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              type="datetime"
              placeholder="选择结束时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item label="请假天数" prop="leaveDays">
            <el-input-number v-model="formData.leaveDays" :precision="1" :step="0.5" :min="0" disabled />
          </el-form-item>
          <el-form-item label="请假原因" prop="reason">
            <el-input v-model="formData.reason" type="textarea" placeholder="请输入请假原因" />
          </el-form-item>
        </template>
        
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>

      <div class="form-footer">
        <ElButton @click="handleCancel">取消申请</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="submitting">提交表单</ElButton>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { useUserStore } from '@/store/modules/user'
  import { createPunchCardForm, createBusinessTripForm, createFieldWorkForm, createLeaveForm } from '@/api/system-manage'

  defineOptions({ name: 'FormEdit' })

  const router = useRouter()
  const userStore = useUserStore()

  const formRef = ref<FormInstance>()
  const submitting = ref(false)

  const formData = reactive<any>({
    type: undefined,
    reason: '',
    startTime: '',
    endTime: '',
    days: 1,
    location: '',
    destination: '',
    punchTime: '',
    content: '',
    leaveType: undefined,
    remark: ''
  })

  const rules = reactive<FormRules>({
    type: [{ required: true, message: '请选择表单类型', trigger: 'change' }],
    punchTime: [{ required: true, message: '请选择打卡时间', trigger: 'change' }],
    destination: [{ required: true, message: '请输入地点', trigger: 'blur' }],
    location: [{ required: true, message: '请输入地点', trigger: 'blur' }],
    startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
    endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
    reason: [{ required: true, message: '请输入事由', trigger: 'blur' }],
    content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
    leaveType: [{ required: true, message: '请选择请假类型', trigger: 'change' }],
    days: [{ required: true, message: '请输入天数', trigger: 'blur' }]
  })

  const calculateLeaveDuration = (startTimeStr: string, endTimeStr: string): number => {
    const startDate = new Date(startTimeStr)
    const endDate = new Date(endTimeStr)

    if (startDate >= endDate) return 0

    let workStartHour = 9
    let workStartMinute = 0
    let workEndHour = 18
    let workEndMinute = 0
    
    const LUNCH_START_HOUR = 12
    const LUNCH_END_HOUR = 13

    if (userStore.info && userStore.info.attendanceRule) {
      const rule = userStore.info.attendanceRule
      if (rule.workInTime) {
        const [h, m] = rule.workInTime.split(':').map(Number)
        workStartHour = h
        workStartMinute = m
      }
      if (rule.workOutTime) {
        const [h, m] = rule.workOutTime.split(':').map(Number)
        workEndHour = h
        workEndMinute = m
      }
    }
    
    let totalMilliseconds = 0
    
    let current = new Date(startDate)
    current.setHours(0, 0, 0, 0)
    
    const endDay = new Date(endDate)
    endDay.setHours(0, 0, 0, 0)

    while (current <= endDay) {
      const workStart = new Date(current)
      workStart.setHours(workStartHour, workStartMinute, 0, 0)
      
      const workEnd = new Date(current)
      workEnd.setHours(workEndHour, workEndMinute, 0, 0)
      
      const lunchStart = new Date(current)
      lunchStart.setHours(LUNCH_START_HOUR, 0, 0, 0)
      
      const lunchEnd = new Date(current)
      lunchEnd.setHours(LUNCH_END_HOUR, 0, 0, 0)

      const actualStart = new Date(Math.max(workStart.getTime(), startDate.getTime()))
      const actualEnd = new Date(Math.min(workEnd.getTime(), endDate.getTime()))
      
      if (actualStart < actualEnd) {
        let duration = actualEnd.getTime() - actualStart.getTime()
        
        const lunchOverlapStart = new Date(Math.max(actualStart.getTime(), lunchStart.getTime()))
        const lunchOverlapEnd = new Date(Math.min(actualEnd.getTime(), lunchEnd.getTime()))
        
        if (lunchOverlapStart < lunchOverlapEnd) {
          duration -= (lunchOverlapEnd.getTime() - lunchOverlapStart.getTime())
        }
        
        totalMilliseconds += duration
      }
      
      current.setDate(current.getDate() + 1)
    }

    const hours = totalMilliseconds / (1000 * 60 * 60)
    const days = hours / 8
    
    return parseFloat(days.toFixed(1))
  }

  watch([() => formData.startTime, () => formData.endTime], ([start, end]) => {
    if (formData.type === 4 && start && end) {
      formData.leaveDays = calculateLeaveDuration(start, end)
    }
  })

  const handleTypeChange = () => {
  }

  const handleCancel = () => {
    router.push('/form/application')
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    
    await formRef.value.validate(async (valid) => {
      if (valid) {
        submitting.value = true
        try {
          const payload = { ...formData }
          payload.applicant = { id: userStore.info.userId }
          
          if (payload.type === 1) {
              if (payload.punchTime) {
                  const [date, time] = payload.punchTime.split(' ')
                  payload.punchDate = date
                  payload.punchTime = time
              }
              await createPunchCardForm(payload)
          } else if (payload.type === 2) {
              payload.location = payload.destination
              payload.purpose = payload.reason
              if (payload.startTime) payload.startDate = payload.startTime.split(' ')[0]
              if (payload.endTime) payload.endDate = payload.endTime.split(' ')[0]
              await createBusinessTripForm(payload)
          } else if (payload.type === 3) {
              payload.content = payload.reason
              if (payload.startTime) {
                  const [date, time] = payload.startTime.split(' ')
                  payload.workDate = date
                  payload.startTime = time
              }
              if (payload.endTime) {
                  payload.endTime = payload.endTime.split(' ')[1]
              }
              await createFieldWorkForm(payload)
          } else if (payload.type === 4) {
              if (payload.startTime) {
                  const [date, time] = payload.startTime.split(' ')
                  payload.startDate = date
                  payload.startTime = time
              }
               if (payload.endTime) {
                  const [date, time] = payload.endTime.split(' ')
                  payload.endDate = date
                  payload.endTime = time
              }
              await createLeaveForm(payload)
          }
          
          ElMessage.success('提交成功')
          router.push('/form/application')
        } catch (error) {
          console.error(error)
          ElMessage.error('提交失败')
        } finally {
          submitting.value = false
        }
      }
    })
  }
</script>

<style scoped lang="scss">
.form-edit-page {
  padding: 16px;
  display: flex;
  flex-direction: column;

  .form-card {
    flex: 1;
    display: flex;
    flex-direction: column;

    :deep(.el-card__body) {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .card-header {
      .title {
        font-size: 16px;
        font-weight: 600;
      }
    }

    .edit-form {
      flex: 1;
      padding: 20px 0;
    }

    .form-footer {
      display: flex;
      justify-content: center;
      gap: 12px;
      padding-top: 20px;
      border-top: 1px solid var(--el-border-color-light);
    }
  }
}
</style>
