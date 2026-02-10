<template>
  <ElDialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增岗位' : '编辑岗位'"
    width="500px"
    align-center
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElFormItem label="岗位名称" prop="name">
        <ElInput v-model="form.name" placeholder="请输入岗位名称" />
      </ElFormItem>
      <ElFormItem label="岗位编码" prop="code">
        <ElInput v-model="form.code" placeholder="请输入岗位编码" />
      </ElFormItem>
      <ElFormItem label="显示顺序" prop="sort">
        <ElInputNumber v-model="form.sort" :min="0" :max="9999" style="width: 100%" />
      </ElFormItem>
      <ElFormItem label="岗位状态" prop="enabled">
        <ElRadioGroup v-model="form.enabled">
          <ElRadio :value="true">启用</ElRadio>
          <ElRadio :value="false">禁用</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="备注" prop="description">
        <ElInput
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入岗位备注"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleSubmit">提交</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { createPosition, updatePosition } from '@/api/system-manage'

  interface Props {
    modelValue: boolean
    dialogType: 'add' | 'edit'
    rowData?: any
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    dialogType: 'add',
    rowData: undefined
  })

  const emit = defineEmits(['update:modelValue', 'success'])

  const formRef = ref<FormInstance>()
  const loading = ref(false)

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const form = reactive({
    id: undefined,
    name: '',
    code: '',
    sort: 0,
    enabled: true,
    description: ''
  })

  const rules = reactive<FormRules>({
    name: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
    code: [{ required: true, message: '请输入岗位编码', trigger: 'blur' }],
    sort: [{ required: true, message: '请输入显示顺序', trigger: 'blur' }]
  })

  watch(
    () => props.modelValue,
    (val) => {
      if (val) {
        if (props.dialogType === 'edit' && props.rowData) {
          Object.assign(form, props.rowData)
        } else {
          form.id = undefined
          form.name = ''
          form.code = ''
          form.sort = 0
          form.enabled = true
          form.description = ''
        }
      }
    }
  )

  const handleClose = () => {
    visible.value = false
    formRef.value?.resetFields()
  }

  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      loading.value = true

      if (props.dialogType === 'add') {
        await createPosition(form)
        ElMessage.success('新增成功')
      } else {
        await updatePosition(form)
        ElMessage.success('修改成功')
      }

      emit('success')
      handleClose()
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }
</script>
