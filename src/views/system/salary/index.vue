<!-- 薪资管理页面 -->
<template>
  <div class="salary-page art-full-height">
    <!-- 搜索栏 -->
    <div class="search-wrapper">
      <ElForm :model="searchForm" inline>
        <ElFormItem label="姓名">
          <ElInput v-model="searchForm.nickName" placeholder="请输入姓名" clearable @keyup.enter="handleSearch" />
        </ElFormItem>
        <ElFormItem label="工号">
          <ElInput v-model="searchForm.employeeId" placeholder="请输入工号" clearable @keyup.enter="handleSearch" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleSearch">查询</ElButton>
          <ElButton @click="resetSearch">重置</ElButton>
        </ElFormItem>
      </ElForm>
    </div>

    <ElCard class="art-table-card" shadow="never">
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

      <!-- 薪资编辑弹窗 -->
      <SalaryDialog
        v-model:visible="dialogVisible"
        :user-data="currentUserData"
        @submit="handleDialogSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchGetUserList } from '@/api/system-manage'
  import SalaryDialog from './modules/salary-dialog.vue'
  
  defineOptions({ name: 'Salary' })

  type UserListItem = Api.SystemManage.UserListItem

  // 弹窗相关
  const dialogVisible = ref(false)
  const currentUserData = ref<Partial<UserListItem>>({})

  // 搜索表单
  const searchForm = ref({
    nickName: undefined,
    employeeId: undefined
  })

  const {
    columns,
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
        { type: 'index', label: '序号', align: 'center', width: 60 },
        { prop: 'nickName', label: '员工姓名', align: 'center' },
        { prop: 'employeeId', label: '工号', align: 'center' },
        { prop: 'salary', label: '薪资', align: 'center' },
        {
          prop: 'operation',
          label: '操作',
          align: 'center',
          width: 100,
          fixed: 'right',
          formatter: (row) =>
            h('div', [
              h(ArtButtonTable, {
                type: 'edit',
                onClick: () => showDialog(row)
              })
            ])
        }
      ]
    }
  })

  // 搜索处理
  const handleSearch = () => {
    Object.assign(searchParams, searchForm.value)
    getData()
  }

  const resetSearch = () => {
    searchForm.value = {
        nickName: undefined,
        employeeId: undefined
    }
    resetSearchParams()
  }

  // 显示弹窗
  const showDialog = (row: UserListItem): void => {
    currentUserData.value = row || {}
    nextTick(() => {
      dialogVisible.value = true
    })
  }

  // 处理弹窗提交
  const handleDialogSubmit = async () => {
    try {
      dialogVisible.value = false
      currentUserData.value = {}
      refreshData()
    } catch (error) {
      console.error('提交失败:', error)
    }
  }
</script>

<style scoped>
.search-wrapper {
    background-color: #fff;
    padding: 18px 18px 0 18px;
    margin-bottom: 15px;
    border-radius: 4px;
}
</style>
