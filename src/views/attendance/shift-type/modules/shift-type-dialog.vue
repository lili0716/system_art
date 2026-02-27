<template>
  <ElDialog
    v-model="visible"
    :title="formData.id ? '编辑班别' : '新增班别'"
    width="500px"
    destroy-on-close
    @closed="handleClosed"
  >
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      label-position="right"
    >
      <ElFormItem label="班别名称" prop="name">
        <ElInput v-model="formData.name" placeholder="请输入班别名称 (如: 常规班、早班、晚班)" />
      </ElFormItem>

      <ElFormItem label="班别类型" prop="isRest">
        <ElRadioGroup v-model="formData.isRest">
          <ElRadio :value="false">工作日</ElRadio>
          <ElRadio :value="true">休息日</ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <template v-if="!formData.isRest">
        <ElFormItem label="上班时间" prop="workStart">
          <ElTimePicker
            v-model="formData.workStart"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="选择上班时间"
            style="width: 100%"
          />
        </ElFormItem>

        <ElFormItem label="下班时间" prop="workEnd">
          <ElTimePicker
            v-model="formData.workEnd"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="选择下班时间"
            style="width: 100%"
          />
        </ElFormItem>
      </template>

      <ElFormItem label="显示颜色" prop="color">
        <ElColorPicker v-model="formData.color" />
        <span style="margin-left: 10px; font-size: 13px; color: #909399">在排班表中显示的颜色</span>
      </ElFormItem>

      <ElFormItem label="排序" prop="sortOrder">
        <ElInputNumber v-model="formData.sortOrder" :min="0" :max="999" controls-position="right" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="visible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">确定</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { createShiftType, updateShiftType } from '@/api/schedule'

  const props = defineProps<{
    modelValue: boolean
    typeData: any
  }>()

  const emit = defineEmits(['update:modelValue', 'save'])

  const visible = ref(false)
  const formRef = ref<FormInstance>()
  const submitLoading = ref(false)

  const formData = ref<any>({
    id: 0,
    name: '',
    workStart: '09:00',
    workEnd: '18:00',
    isRest: false,
    color: '#409EFF',
    sortOrder: 0
  })

  // 监听显示状态
  watch(
    () => props.modelValue,
    (val) => {
      visible.value = val
      if (val) {
        formData.value = { ...props.typeData }
        // 补全默认值
        if (!formData.value.color) formData.value.color = '#409EFF'
      }
    }
  )

  // 监听内部窗体关闭，同步更新外部
  watch(visible, (val) => {
    emit('update:modelValue', val)
  })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入班别名称', trigger: 'blur' }],
    workStart: [{ required: true, message: '请选择上班时间', trigger: 'change' }],
    workEnd: [{ required: true, message: '请选择下班时间', trigger: 'change' }],
    color: [{ required: true, message: '请选择标识颜色', trigger: 'change' }]
  }

  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
      if (valid) {
        submitLoading.value = true
        try {
          const params = { ...formData.value }
          if (params.isRest) {
            params.workStart = null
            params.workEnd = null
          }

          if (params.id) {
            await updateShiftType(params.id, params)
            ElMessage.success('更新成功')
          } else {
            // 删除无用主键以便创建
            delete params.id
            await createShiftType(params)
            ElMessage.success('新增成功')
          }
          visible.value = false
          emit('save')
        } catch (error) {
          console.error('保存班别失败:', error)
          ElMessage.error('保存失败')
        } finally {
          submitLoading.value = false
        }
      }
    })
  }

  const handleClosed = () => {
    formRef.value?.resetFields()
  }
</script>
