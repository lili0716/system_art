<!-- 班别管理页面 (Shift Type) -->
<template>
  <div class="art-full-height">
    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader
        v-model:columns="columnChecks"
        :loading="loading"
        :show-search-bar="false"
        @refresh="refreshData"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" @click="handleAdd" v-ripple>
              <el-icon><Plus /></el-icon>
              新增班别
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 表格 -->
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>
    </ElCard>

    <!-- 编辑弹窗 -->
    <ShiftTypeDialog v-model="dialogVisible" :type-data="currentType" @save="handleSave" />
  </div>
</template>

<script setup lang="ts">
  import { ref, h } from 'vue'
  import { useTable } from '@/hooks/core/useTable'
  import { getShiftTypes, deleteShiftType } from '@/api/schedule'
  import ShiftTypeDialog from './modules/shift-type-dialog.vue'
  import { ElTag, ElMessage, ElMessageBox } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
  import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'

  defineOptions({ name: 'AttendanceShiftType' })

  // 弹窗
  const dialogVisible = ref(false)
  const currentType = ref<any>({
    id: 0,
    name: '',
    workStart: '',
    workEnd: '',
    isRest: false,
    color: '#409eff',
    sortOrder: 0
  })

  /**
   * 格式化时间
   */
  const formatTime = (time: string) => {
    if (!time) return '-'
    if (time.length > 5 && time.length <= 8) return time.substring(0, 5)
    return time
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: getShiftTypes,
      apiParams: {},
      columnsFactory: () => [
        {
          prop: 'name',
          label: '名称',
          minWidth: 100,
          align: 'center',
          formatter: (row: any) => {
            return h(
              'div',
              {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }
              },
              [
                h('span', {
                  style: {
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: row.color
                  }
                }),
                h('span', null, row.name)
              ]
            )
          }
        },
        {
          prop: 'workStart',
          label: '上班时间',
          minWidth: 100,
          align: 'center',
          formatter: (row: any) => (row.isRest ? '-' : formatTime(row.workStart))
        },
        {
          prop: 'workEnd',
          label: '下班时间',
          minWidth: 100,
          align: 'center',
          formatter: (row: any) => (row.isRest ? '-' : formatTime(row.workEnd))
        },
        {
          prop: 'isRest',
          label: '班别类型',
          minWidth: 80,
          align: 'center',
          formatter: (row: any) => {
            return h(ElTag, { type: row.isRest ? 'success' : 'primary' }, () =>
              row.isRest ? '休息日' : '常规班次'
            )
          }
        },
        {
          prop: 'sortOrder',
          label: '排序',
          minWidth: 60,
          align: 'center'
        },
        {
          prop: 'operation',
          label: '操作',
          width: 80,
          fixed: 'right',
          align: 'center',
          formatter: (row: any) => {
            const items: ButtonMoreItem[] = [
              {
                key: 'edit',
                label: '编辑',
                icon: 'ri:edit-2-line'
              },
              {
                key: 'delete',
                label: '删除',
                icon: 'ri:delete-bin-4-line',
                color: '#f56c6c'
              }
            ]

            return h('div', [
              h(ArtButtonMore, {
                list: items,
                onClick: (item: ButtonMoreItem) => buttonMoreClick(item, row)
              })
            ])
          }
        }
      ]
    },
    transform: {
      responseAdapter: (response: any) => {
        const list = Array.isArray(response) ? response : response.data || []
        return {
          data: list,
          total: list.length
        }
      }
    }
  })

  const buttonMoreClick = (item: ButtonMoreItem, row: any) => {
    switch (item.key) {
      case 'edit':
        handleEdit(row)
        break
      case 'delete':
        handleDelete(row.id)
        break
    }
  }

  const handleAdd = () => {
    currentType.value = {
      id: 0,
      name: '',
      workStart: '09:00',
      workEnd: '18:00',
      isRest: false,
      color: '#409EFF',
      sortOrder: 0
    }
    dialogVisible.value = true
  }

  const handleEdit = (row: any) => {
    currentType.value = { ...row }
    dialogVisible.value = true
  }

  const handleDelete = (id: number) => {
    ElMessageBox.confirm('确定要删除该班别吗？已经应用该班别的排班可能受到影响。', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          await deleteShiftType(id)
          ElMessage.success('删除成功')
          refreshData()
        } catch (error) {
          console.error('删除班别失败:', error)
          ElMessage.error('删除失败')
        }
      })
      .catch(() => {})
  }

  const handleSave = () => {
    dialogVisible.value = false
    refreshData()
  }
</script>
