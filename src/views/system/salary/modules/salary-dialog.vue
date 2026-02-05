<template>
  <ElDialog
    v-model="dialogVisible"
    title="编辑薪资"
    width="500px"
    align-center
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <!-- 姓名 (只读) -->
      <ElFormItem label="姓名">
        <ElInput v-model="formData.nickName" disabled />
      </ElFormItem>

      <!-- 工号 (只读) -->
      <ElFormItem label="工号">
        <ElInput v-model="formData.employeeId" disabled />
      </ElFormItem>

      <!-- 薪资 (可编辑) -->
      <ElFormItem label="薪资" prop="salary">
        <ElInput v-model="formData.salary" placeholder="请输入薪资" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { updateUserSalary } from '@/api/system-manage'

  interface Props {
    visible: boolean
    userData?: Partial<Api.SystemManage.UserListItem>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const formRef = ref<FormInstance>()

  const formData = reactive({
    id: undefined as number | undefined,
    nickName: '',
    employeeId: '',
    salary: ''
  })

  // 验证规则，薪资必填
  const rules = reactive<FormRules>({
    salary: [{ required: true, message: '请输入薪资', trigger: 'blur' }]
  })

  // 初始化表单
  watch(
    () => [props.visible, props.userData],
    ([visible]) => {
      if (visible && props.userData) {
        formData.id = props.userData.id
        formData.nickName = props.userData.nickName || ''
        formData.employeeId = props.userData.employeeId || ''
        formData.salary = (props.userData as any).salary || ''
        nextTick(() => {
            formRef.value?.clearValidate()
        })
      }
    },
    { immediate: true }
  )

  const handleClose = () => {
    formRef.value?.resetFields()
  }

  const handleSubmit = async () => {
    if (!formRef.value || !formData.id) return

    await formRef.value.validate(async (valid) => {
      if (valid) {
        try {
          await updateUserSalary({
              id: formData.id!,
              salary: formData.salary
          })
          ElMessage.success('薪资更新成功')
          dialogVisible.value = false
          emit('submit')
        } catch (error) {
          console.error('更新薪资失败:', error)
          ElMessage.error('更新失败')
        }
      }
    })
  }
</script>
