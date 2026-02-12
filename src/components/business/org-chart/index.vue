<template>
  <div class="org-chart" :style="{ height: height, overflow: 'auto' }">
    <el-tree
      :data="processedData"
      node-key="id"
      default-expand-all
      :expand-on-click-node="true"
      :props="defaultProps"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  data: any[]
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '600px'
})

// 默认属性配置
const defaultProps = {
  children: 'children',
  label: (node: any) => {
    return `${node.name} (${node.employeeCount || 0}人)`
  }
}

// 处理数据，确保数据结构正确
const processedData = computed(() => {
  // 检查数据是否为空或格式不正确
  if (!props.data || !Array.isArray(props.data)) {
    return []
  }
  
  // 确保每个节点都有必要的属性
  const processNode = (node: any) => {
    return {
      id: node.id,
      name: node.name || '未命名部门',
      employeeCount: node.employeeCount || 0,
      children: node.children && node.children.length > 0 ? node.children.map((child: any) => processNode(child)) : []
    }
  }
  
  return props.data.map(node => processNode(node))
})
</script>

<style scoped>
.org-chart {
  width: 100%;
  background-color: #ffffff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  padding: 10px;
}
</style>