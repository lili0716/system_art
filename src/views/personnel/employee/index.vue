<!-- 员工管理页面 -->
<template>
  <div class="user-page art-full-height">
    <!-- 搜索栏 -->
    <UserSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams"></UserSearch>

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton @click="showDialog('add')" v-ripple>
              {{ t('userTable.toolbar.newEmployee') }}
            </ElButton>
            <ElButton @click="showSyncDialog" type="primary" v-ripple>
              {{ t('userTable.toolbar.syncData') }}
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
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>

      <!-- 员工弹窗 -->
      <EmployeeDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :user-data="currentUserData"
        @submit="handleDialogSubmit"
      />

      <!-- 数据同步弹窗 -->
      <DataSyncDialog v-model:visible="syncDialogVisible" @submit="handleSyncSubmit" />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchGetUserList, deleteUserById } from '@/api/system-manage'
  import UserSearch from '@/views/system/user/modules/user-search.vue'
  import EmployeeDialog from './modules/employee-dialog.vue'
  import DataSyncDialog from './modules/data-sync-dialog.vue'
  import { ElTag, ElMessageBox, ElMessage } from 'element-plus'
  import { DialogType } from '@/types'
  import { useUserStore } from '@/store/modules/user'
  import { useI18n } from 'vue-i18n'

  defineOptions({ name: 'Employee' })

  const { t } = useI18n()

  type UserListItem = Api.SystemManage.UserListItem

  // 弹窗相关
  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentUserData = ref<Partial<UserListItem>>({})

  // 数据同步弹窗相关
  const syncDialogVisible = ref(false)

  // 选中行
  const selectedRows = ref<UserListItem[]>([])

  // 搜索表单
  const searchForm = ref({
    nickName: undefined,
    employeeId: undefined,
    userGender: undefined,
    tenureMin: undefined,
    tenureMax: undefined,
    status: undefined
  })

  // 用户状态配置
  const USER_STATUS_CONFIG = {
    '1': { type: 'success' as const, text: t('userTable.status.employed') },
    '2': { type: 'danger' as const, text: t('userTable.status.left') }
  } as const

  /**
   * 获取用户状态配置
   */
  const getUserStatusConfig = (status: string) => {
    return (
      USER_STATUS_CONFIG[status as keyof typeof USER_STATUS_CONFIG] || {
        type: 'info' as const,
        text: '未知'
      }
    )
  }

  /**
   * 格式化日期
   */
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '-'
    const d = new Date(date)
    if (isNaN(d.getTime())) return '-'
    // 返回 YYYY-MM-DD
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    searchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    // 核心配置
    core: {
      apiFn: fetchGetUserList,
      apiParams: {
        current: 1,
        size: 20,
        ...searchForm.value
      },
      columnsFactory: () => [
        { type: 'selection', align: 'center' },
        { type: 'index', label: t('userTable.columns.index'), align: 'center', width: 60 },
        { prop: 'nickName', label: t('userTable.columns.nickName'), align: 'center' },
        { prop: 'userGender', label: t('userTable.columns.gender'), align: 'center' },
        { prop: 'email', label: t('userTable.columns.email'), align: 'center' },
        { prop: 'employeeId', label: t('userTable.columns.employeeId'), align: 'center' },
        {
          prop: 'status',
          label: t('userTable.columns.status'),
          align: 'center',
          formatter: (row) => {
            const statusConfig = getUserStatusConfig(row.status)
            return h(ElTag, { type: statusConfig.type }, () => statusConfig.text)
          }
        },
        {
          prop: 'tenure',
          label: t('userTable.columns.tenure'),
          align: 'center',
          formatter: (row) =>
            row.tenure
              ? `${row.tenure} ${t('userTable.units.year')}`
              : `0.0 ${t('userTable.units.year')}`
        },
        {
          prop: 'hireDate',
          label: t('userTable.columns.hireDate'),
          align: 'center',
          formatter: (row) => formatDate(row.hireDate)
        },
        {
          prop: 'leaveDate',
          label: t('userTable.columns.leaveDate'),
          align: 'center',
          formatter: (row) => formatDate(row.leaveDate)
        },
        {
          prop: 'departmentName',
          label: '所属部门',
          align: 'center',
          formatter: (row) => row.departmentName || '-'
        },
        {
          prop: 'createTime',
          label: t('userTable.columns.createTime'),
          align: 'center',
          formatter: (row) => formatDate(row.createTime)
        },
        {
          prop: 'updateTime',
          label: t('userTable.columns.updateTime'),
          align: 'center',
          formatter: (row) => formatDate(row.updateTime)
        },
        {
          prop: 'operation',
          label: t('userTable.columns.operation'),
          align: 'center',
          width: 180,
          fixed: 'right',
          formatter: (row) =>
            h('div', [
              h(ArtButtonTable, {
                type: 'view',
                text: t('userTable.actions.view'),
                onClick: () => showDialog('view', row)
              }),
              h(ArtButtonTable, {
                type: 'edit',
                text: t('userTable.actions.edit'),
                onClick: () => showDialog('edit', row)
              }),
              h(ArtButtonTable, {
                type: 'delete',
                text: t('userTable.actions.delete'),
                onClick: () => deleteUser(row)
              })
            ])
        }
      ]
    }
  })

  /**
   * 搜索处理
   */
  const handleSearch = (params: Record<string, any>) => {
    Object.assign(searchParams, params)
    getData()
  }

  /**
   * 显示用户弹窗
   */
  const showDialog = (type: DialogType, row?: UserListItem): void => {
    dialogType.value = type
    currentUserData.value = row || {}
    nextTick(() => {
      dialogVisible.value = true
    })
  }

  /**
   * 显示数据同步弹窗
   */
  const showSyncDialog = (): void => {
    nextTick(() => {
      syncDialogVisible.value = true
    })
  }

  /**
   * 删除用户
   */
  const deleteUser = (row: UserListItem): void => {
    ElMessageBox.confirm(
      t('userTable.messages.deleteConfirm'),
      t('userTable.messages.deleteTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'error'
      }
    ).then(async () => {
      try {
        await deleteUserById(row.id)
        ElMessage.success(t('userTable.messages.deleteSuccess'))
        refreshData()
      } catch (error) {
        console.error('删除用户失败:', error)
        ElMessage.error(t('userTable.messages.deleteFailed'))
      }
    })
  }

  /**
   * 处理弹窗提交事件
   */
  const handleDialogSubmit = async () => {
    try {
      dialogVisible.value = false
      currentUserData.value = {}
      refreshData()
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  /**
   * 处理表格行选择变化
   */
  const handleSelectionChange = (selection: UserListItem[]): void => {
    selectedRows.value = selection
  }

  // 用户store
  const userStore = useUserStore()

  /**
   * 处理数据同步提交
   */
  const handleSyncSubmit = async (syncData: any): Promise<void> => {
    try {
      console.log('开始数据同步:', syncData)

      // 获取token
      const token = userStore.accessToken
      console.log('Token:', token)

      // 调用后端API进行数据同步
      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify(syncData)
      })

      console.log('Response status:', response.status)

      const result = await response.json()

      if (result.code === 200) {
        ElMessage.success(t('userTable.sync.success'))
        console.log('同步结果:', result.data)
        refreshData()
      } else {
        ElMessage.error(t('userTable.sync.failedWithReason', { msg: result.msg }))
      }
    } catch (error) {
      console.error('数据同步失败:', error)
      ElMessage.error(t('userTable.sync.failedRetry'))
    }
  }
</script>
