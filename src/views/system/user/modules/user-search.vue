<template>
  <ElCard class="mb-4" shadow="never">
    <ElForm :model="model" label-width="80px">
      <ElRow :gutter="20">
        <ElCol :span="6">
          <ElFormItem label="员工">
            <ApiSelect
              v-model="model.employeeId"
              api-url="/api/users/search"
              :label-field="(data) => `${data.nickName} (${data.employeeId || data.username})`"
              value-field="employeeId"
              placeholder="输入工号或姓名搜索"
              clearable
              style="width: 100%"
              :api-params="{ page: 1, size: 50 }"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem label="性别">
            <ElSelect
              v-model="model.userGender"
              placeholder="请选择性别"
              clearable
              style="width: 100%"
            >
              <ElOption label="男" value="男" />
              <ElOption label="女" value="女" />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem label="在职时长">
            <div class="flex items-center">
              <ElInputNumber
                v-model="model.tenureMin"
                :min="0"
                :precision="1"
                :step="0.5"
                placeholder="最小"
                style="width: 100px"
                :controls="false"
              />
              <span class="mx-2 text-gray-400">-</span>
              <ElInputNumber
                v-model="model.tenureMax"
                :min="0"
                :precision="1"
                :step="0.5"
                placeholder="最大"
                style="width: 100px"
                :controls="false"
              />
              <span class="ml-2 text-gray-500">年</span>
            </div>
          </ElFormItem>
        </ElCol>
      </ElRow>
      <div class="flex justify-end">
        <ElButton @click="handleReset">重置</ElButton>
        <ElButton type="primary" @click="handleSearch">查询</ElButton>
      </div>
    </ElForm>
  </ElCard>
</template>

<script setup lang="ts">
  import { PropType, computed } from 'vue'
  import { ApiSelect } from '@/components/core/forms/api-select'

  const props = defineProps({
    modelValue: {
      type: Object as PropType<any>,
      default: () => ({})
    }
  })

  const emit = defineEmits(['update:modelValue', 'search', 'reset'])

  const model = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const handleSearch = () => {
    emit('search', model.value)
  }

  const handleReset = () => {
    emit('reset')
  }
</script>
