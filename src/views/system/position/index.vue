<!-- 岗位管理页面 -->
<template>
  <div class="art-full-height">
    <!-- 搜索栏 -->
    <ArtSearchBar :items="searchItems" @search="handleSearch" @reset="handleReset" />

    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElButton type="primary" @click="showDialog('add')" v-ripple>新增岗位</ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <!-- 岗位编辑弹窗 -->
    <PositionAddEdit
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :row-data="currentRowData"
      @success="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import { fetchPositionList, deletePosition } from '@/api/system-manage'
  import { useTable } from '@/hooks/core/useTable'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import PositionAddEdit from './modules/position-add-edit.vue'

  defineOptions({ name: 'Position' })

  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const currentRowData = ref<any>(undefined)

  // 搜索项配置
  const searchItems = computed(() => [
    {
      type: 'input',
      key: 'name',
      label: '岗位名称',
      props: { placeholder: '请输入岗位名称' }
    },
    {
      type: 'input',
      key: 'code',
      label: '岗位编码',
      props: { placeholder: '请输入岗位编码' }
    },
    {
      type: 'select',
      key: 'enabled',
      label: '状态',
      props: {
        placeholder: '全部',
        options: [
          { label: '启用', value: true },
          { label: '禁用', value: false }
        ]
      }
    }
  ])

  // 表格 Hook
  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    searchParams,
    getData,
    handleSizeChange,
    handleCurrentChange,
    refreshData,
    resetSearchParams
  } = useTable({
    core: {
      apiFn: fetchPositionList,
      apiParams: {
        current: 1,
        size: 20
      },
      columnsFactory: () => [
        {
          prop: 'id',
          label: '岗位ID',
          width: 80,
          align: 'center'
        },
        {
          prop: 'name',
          label: '岗位名称',
          minWidth: 120
        },
        {
          prop: 'code',
          label: '岗位编码',
          minWidth: 120
        },
        {
          prop: 'sort',
          label: '排序',
          width: 80,
          align: 'center'
        },
        {
          prop: 'enabled',
          label: '状态',
          width: 100,
          align: 'center',
          formatter: (row: any) => {
            return h(ElTag, { type: row.enabled ? 'success' : 'danger' }, () =>
              row.enabled ? '启用' : '禁用'
            )
          }
        },
        {
          prop: 'description',
          label: '备注',
          minWidth: 150,
          showOverflowTooltip: true
        },
        {
          prop: 'createTime',
          label: '创建一个时间',
          width: 170,
          align: 'center'
        },
        {
          prop: 'operation',
          label: '操作',
          width: 160,
          fixed: 'right',
          align: 'center',
          formatter: (row: any) => {
            return h('div', [
              h(ArtButtonTable, {
                type: 'edit',
                title: '编辑',
                onClick: () => showDialog('edit', row)
              }),
              h(ArtButtonTable, {
                type: 'delete',
                title: '删除',
                onClick: () => handleDelete(row)
              })
            ])
          }
        }
      ]
    }
  })

  const handleSearch = (params: any) => {
    Object.assign(searchParams, params)
    getData()
  }

  const handleReset = () => {
    resetSearchParams()
  }

  const showDialog = (type: 'add' | 'edit', row?: any) => {
    dialogType.value = type
    currentRowData.value = row
    dialogVisible.value = true
  }

  const handleDelete = (row: any) => {
    ElMessageBox.confirm(`确定删除岗位"${row.name}"吗？`, '提示', {
      type: 'warning'
    }).then(async () => {
      await deletePosition(row.id)
      ElMessage.success('删除成功')
      refreshData()
    })
  }
</script>
