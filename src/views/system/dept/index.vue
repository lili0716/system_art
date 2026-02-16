<template>
  <div class="system-dept-container">
    <div class="page-header">
      <h1>{{ $t('dept.title') }}</h1>
      <el-button type="primary" @click="handleCreate(null)">
        <el-icon><Plus /></el-icon>
        {{ $t('dept.actions.createRoot') }}
      </el-button>
    </div>

    <!-- 部门列表 -->
    <el-card class="list-card">
      <template #header>
        <div class="flex justify-between items-center">
          <span>{{ $t('dept.list.title') }}</span>
          <el-button size="small" @click="fetchTree">
            {{ $t('dept.actions.refresh') }}
          </el-button>
        </div>
      </template>
      <el-table
        v-loading="loading"
        :data="deptTree"
        style="width: 100%"
        :height="tableHeight"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="name" :label="$t('dept.columns.name')" min-width="200" />
        <el-table-column
          prop="code"
          :label="$t('dept.columns.code')"
          min-width="120"
          align="center"
        />
        <el-table-column
          prop="leaderName"
          :label="$t('dept.columns.leader')"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            {{ row.leaderName || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="employeeCount"
          :label="$t('dept.columns.employeeCount')"
          width="80"
          align="center"
        />
        <el-table-column prop="sort" :label="$t('dept.columns.sort')" width="80" align="center" />
        <el-table-column :label="$t('dept.columns.status')" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'danger'">
              {{ row.enabled ? $t('dept.status.enabled') : $t('dept.status.disabled') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('dept.columns.operation')"
          width="250"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              {{ $t('dept.actions.edit') }}
            </el-button>
            <el-button link type="primary" size="small" @click="handleCreate(row)">
              {{ $t('dept.actions.createChild') }}
            </el-button>
            <el-button link type="warning" size="small" @click="handlePermission(row)">
              {{ $t('dept.actions.menuPermission') }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              {{ $t('dept.actions.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="resetForm">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item :label="$t('dept.form.parent')">
          <el-tree-select
            v-model="formData.parentId"
            :data="deptTree"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            value-key="id"
            :placeholder="$t('dept.form.parentPlaceholder')"
            check-strictly
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="$t('dept.form.name')" prop="name">
          <el-input v-model="formData.name" :placeholder="$t('dept.form.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('dept.form.code')" prop="code">
          <el-input v-model="formData.code" :placeholder="$t('dept.form.codePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('dept.form.leader')">
          <ApiSelect
            v-model="formData.leaderId"
            api-url="/api/users/search"
            :label-field="(data) => `${data.nickName} (${data.employeeId || data.username})`"
            value-field="id"
            :placeholder="$t('dept.form.leaderPlaceholder')"
            style="width: 100%"
            :api-params="{ page: 1, size: 50 }"
          />
        </el-form-item>
        <el-form-item :label="$t('dept.form.sort')" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item :label="$t('dept.form.status')" prop="enabled">
          <el-switch
            v-model="formData.enabled"
            :active-text="$t('dept.status.enabled')"
            :inactive-text="$t('dept.status.disabled')"
          />
        </el-form-item>
        <el-form-item :label="$t('dept.form.description')">
          <el-input v-model="formData.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">
            {{ $t('common.cancel') }}
          </el-button>
          <el-button type="primary" @click="handleSave">
            {{ $t('common.confirm') }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Permission Dialog -->
    <el-dialog v-model="permDialogVisible" :title="$t('dept.permission.title')" width="500px">
      <el-tree
        ref="permTreeRef"
        :data="menuTreeData"
        show-checkbox
        node-key="id"
        :props="{ label: 'title', children: 'children' }"
        :default-checked-keys="checkedKeys"
      >
        <template #default="{ data }">
          <span>{{ data.meta ? data.meta.title : data.name }}</span>
        </template>
      </el-tree>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="permDialogVisible = false">
            {{ $t('common.cancel') }}
          </el-button>
          <el-button type="primary" @click="handleSavePermission">
            {{ $t('common.confirm') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, computed } from 'vue'
  import { Plus } from '@element-plus/icons-vue'
  import {
    getDepartmentTree,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    fetchGetMenuList,
    getDepartmentRoutes,
    updateDepartmentRoutes
  } from '@/api/system-manage'
  import { ApiSelect } from '@/components/core/forms/api-select'
  import { ElMessage, ElMessageBox, FormInstance, FormRules, ElTree } from 'element-plus'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  const loading = ref(false)
  const deptTree = ref([])
  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()

  // 表格高度
  const tableHeight = ref('600px')

  // Permission Logic
  const permDialogVisible = ref(false)
  const menuTreeData = ref([])
  const checkedKeys = ref<number[]>([])
  const currentDeptId = ref<number | null>(null)
  const permTreeRef = ref<InstanceType<typeof ElTree>>()

  const handlePermission = async (row: any) => {
    currentDeptId.value = row.id
    permDialogVisible.value = true
    checkedKeys.value = []

    // 1. Fetch all menu data
    try {
      const res: any = await fetchGetMenuList()
      menuTreeData.value = res // Routes with ID

      // 2. Fetch current dept routes
      const routeIds: number[] = await getDepartmentRoutes(row.id)
      checkedKeys.value = routeIds

      // Need to set checked keys after tree render or use nextTick, but default-checked-keys handles init?
      // If dialog opens and data changes, might need setCheckedKeys
      setTimeout(() => {
        permTreeRef.value?.setCheckedKeys(routeIds)
      }, 100)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSavePermission = async () => {
    if (!currentDeptId.value) return
    const checked = permTreeRef.value?.getCheckedKeys(false) // false means leaf only? No, default is false (all checked)
    const halfChecked = permTreeRef.value?.getHalfCheckedKeys()
    // Usually backend needs full list including parents if we want to reconstruct?
    // But my backend implementation simply saves what I send.
    // If I select a leaf, does backend need parent?
    // My Dynamic Router logic in backend converts list to tree structure for API response,
    // IF the list is flat. If I send leaf IDs, and backend saves them.
    // When backend returns "getRoutes", it constructs response.
    // If I have logic that assumes parent IS present in the list, I should send parents too.
    // Standard approach: Send checked + halfChecked.
    const allChecked = [...(checked || []), ...(halfChecked || [])] as number[]

    try {
      await updateDepartmentRoutes(currentDeptId.value, allChecked)
      ElMessage.success('权限更新成功')
      permDialogVisible.value = false
    } catch (e) {
      console.error(e)
    }
  }

  const formData = reactive({
    id: undefined,
    parentId: undefined,
    name: '',
    code: '',
    sort: 0,
    enabled: true,
    description: '',
    leaderName: '',
    leaderId: undefined
  })

  const isEdit = computed(() => !!formData.id)
  const dialogTitle = computed(() =>
    isEdit.value ? t('dept.dialog.editTitle') : t('dept.dialog.createTitle')
  )

  const rules = reactive<FormRules>({
    name: [{ required: true, message: t('dept.rules.nameRequired'), trigger: 'blur' }],
    code: [{ required: true, message: t('dept.rules.codeRequired'), trigger: 'blur' }]
  })

  const fetchTree = async () => {
    loading.value = true
    try {
      const res: any = await getDepartmentTree()
      deptTree.value = res.nodes || []
    } catch (error) {
      console.error(error)
    } finally {
      loading.value = false
    }
  }

  const resetForm = () => {
    formData.id = undefined
    formData.parentId = undefined
    formData.name = ''
    formData.code = ''
    formData.sort = 0
    formData.enabled = true
    formData.description = ''
    formData.leaderName = ''
    formData.leaderId = undefined
    formRef.value?.resetFields()
  }

  const handleCreate = (row: any) => {
    resetForm()
    if (row) {
      formData.parentId = row.id
    }
    dialogVisible.value = true
  }

  const handleEdit = (row: any) => {
    resetForm()
    Object.assign(formData, row)
    dialogVisible.value = true
  }

  const handleDelete = (row: any) => {
    ElMessageBox.confirm(t('dept.messages.deleteConfirm'), t('dept.messages.warningTitle'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    }).then(async () => {
      try {
        await deleteDepartment(row.id)
        ElMessage.success(t('dept.messages.deleteSuccess'))
        fetchTree()
      } catch (error) {
        console.error(error)
      }
    })
  }

  const handleSave = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (valid) {
        try {
          const payload = { ...formData }
          // Provide parent object structure for backend JPA if creating/updating
          if (payload.parentId) {
            // @ts-expect-error: Parent field is required for backend JPA
            payload.parent = { id: payload.parentId }
          } else {
            // @ts-expect-error: Parent field can be null for root department
            payload.parent = null
          }

          if (isEdit.value) {
            await updateDepartment(payload.id!, payload)
          } else {
            await createDepartment(payload)
          }
          ElMessage.success(
            isEdit.value ? t('dept.messages.updateSuccess') : t('dept.messages.createSuccess')
          )
          dialogVisible.value = false
          fetchTree()
        } catch (error) {
          console.error(error)
        }
      }
    })
  }

  onMounted(() => {
    fetchTree()
  })
</script>

<style scoped lang="scss">
  .system-dept-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 20px;

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;

      h1 {
        margin: 0;
        font-size: 24px;
        font-weight: bold;
      }
    }

    .list-card {
      display: flex;
      flex: 1;
      flex-direction: column;

      :deep(.el-card__body) {
        flex: 1;
        padding: 0;
      }
    }
  }
</style>
