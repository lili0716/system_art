<template>
  <ElSelect
    v-model="localValue"
    filterable
    remote
    :placeholder="placeholder"
    :remote-method="handleRemoteSearch"
    :loading="loading"
    :disabled="disabled"
    :clearable="clearable"
    :multiple="multiple"
    :value-key="valueKey"
    :style="style"
    @change="handleChange"
    v-bind="$attrs"
  >
    <ElOption
      v-for="item in options"
      :key="getOptionKey(item)"
      :label="getOptionLabel(item)"
      :value="getOptionValue(item)"
    />
  </ElSelect>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import request from '@/utils/http'
  import { ElSelect, ElOption } from 'element-plus'

  interface Props {
    modelValue: any
    apiUrl: string
    labelField?: string | ((data: any) => string)
    valueField?: string
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
    multiple?: boolean
    valueKey?: string
    style?: any
    apiParams?: Record<string, any>
  }

  const props = withDefaults(defineProps<Props>(), {
    labelField: 'label',
    valueField: 'value',
    placeholder: '请输入搜索',
    disabled: false,
    clearable: true,
    multiple: false,
    valueKey: 'value',
    style: () => ({ width: '100%' }),
    apiParams: () => ({})
  })

  const emit = defineEmits(['update:modelValue', 'change'])

  const options = ref<any[]>([])
  const loading = ref(false)
  const currentKeyword = ref('')
  const localValue = ref(props.modelValue)

  // 监听modelValue变化，更新localValue
  watch(
    () => props.modelValue,
    (newValue) => {
      localValue.value = newValue
    }
  )

  // 监听localValue变化，通知父组件
  watch(
    () => localValue.value,
    (newValue) => {
      emit('update:modelValue', newValue)
    }
  )

  // 获取选项的key
  const getOptionKey = (item: any) => {
    return item[props.valueKey] || item[props.valueField] || item.id || Math.random()
  }

  // 获取选项的value
  const getOptionValue = (item: any) => {
    // 确保返回指定的valueField，即使它不存在也不返回id
    if (props.valueField && item[props.valueField] !== undefined) {
      return item[props.valueField]
    }
    return item.value || item.id
  }

  // 获取选项的label
  const getOptionLabel = (item: any) => {
    if (typeof props.labelField === 'function') {
      return props.labelField(item)
    } else {
      return item[props.labelField] || item.label || item.name || JSON.stringify(item)
    }
  }

  // 远程搜索处理
  const handleRemoteSearch = async (keyword: string) => {
    if (keyword.length < 1) {
      options.value = []
      return
    }

    currentKeyword.value = keyword
    loading.value = true

    try {
      const res = await request.get({
        url: props.apiUrl,
        params: {
          keyword,
          ...props.apiParams
        }
      })

      // 处理不同的返回格式
      if (Array.isArray(res)) {
        options.value = res
      } else if (res.records) {
        options.value = res.records
      } else if (res.data && Array.isArray(res.data)) {
        options.value = res.data
      } else if (res.data && res.data.records) {
        options.value = res.data.records
      } else {
        options.value = []
      }
    } catch (error) {
      console.error('ApiSelect搜索失败:', error)
      options.value = []
    } finally {
      loading.value = false
    }
  }

  // 选择变化处理
  const handleChange = (value: any) => {
    localValue.value = value
    emit('change', value)
  }

  // 监听modelValue变化，处理回显
  watch(
    () => localValue.value,
    async (newValue) => {
      if (newValue && options.value.length === 0) {
        // 如果有值但选项为空，尝试搜索
        await handleRemoteSearch(currentKeyword.value || '')
      }
    },
    { immediate: true }
  )
</script>

<style scoped></style>
