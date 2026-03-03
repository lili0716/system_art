<template>
  <ElCard class="mb-4" shadow="never">
    <ElForm :model="model" label-width="80px">
      <ElRow :gutter="20">
        <ElCol :span="6">
          <ElFormItem label="统计月份">
            <ElDatePicker
              v-model="model.month"
              type="month"
              value-format="YYYY-MM"
              placeholder="选择月份"
              style="width: 100%"
              clearable
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem label="员工">
            <ApiSelect
              v-model="model.employeeId"
              api-url="/api/users/search"
              :label-field="(data) => `${data.nickName} (${data.employeeId || data.email})`"
              value-field="employeeId"
              placeholder="输入工号或姓名搜索"
              clearable
              style="width: 100%"
              :api-params="{ page: 1, size: 50 }"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem label="部门">
            <ElTreeSelect
              v-model="model.departmentId"
              :data="departments"
              :props="{ label: 'name', value: 'id' }"
              check-strictly
              placeholder="选择部门"
              clearable
              style="width: 100%"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <div class="flex justify-end">
        <ElButton @click="handleReset">重置</ElButton>
        <ElButton type="primary" @click="handleSearch">
          <template #icon>
            <el-icon><Search /></el-icon>
          </template>
          查询
        </ElButton>
      </div>
    </ElForm>
  </ElCard>
</template>

<script setup lang="ts">
  import { PropType, computed, ref, onMounted } from 'vue'
  import { ApiSelect } from '@/components/core/forms/api-select'
  import { getDepartmentOptions } from '@/api/system-manage'
  import { Search } from '@element-plus/icons-vue'

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

  const departments = ref<any[]>([])

  const fetchDepartments = async () => {
    try {
      const res: any = await getDepartmentOptions()
      if (res) {
        departments.value = res.nodes || []
      }
    } catch (error) {
      console.error('获取部门列表失败:', error)
    }
  }

  const handleSearch = () => {
    emit('search', model.value)
  }

  const handleReset = () => {
    emit('reset')
  }

  onMounted(() => {
    fetchDepartments()
  })
</script>
