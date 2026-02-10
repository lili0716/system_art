<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogType === 'add' ? '新员工入职' : dialogType === 'view' ? '查看详情' : '编辑用户'"
    width="600px"
    align-center
    @close="handleClose"
  >
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      :disabled="dialogType === 'view'"
    >
      <!-- 姓名 -->
      <ElFormItem label="姓名" prop="nickName">
        <ElInput v-model="formData.nickName" placeholder="请输入姓名" />
      </ElFormItem>

      <!-- 性别 -->
      <ElFormItem label="性别" prop="userGender">
        <ElSelect v-model="formData.userGender" placeholder="请选择性别" style="width: 100%">
          <ElOption label="男" value="男" />
          <ElOption label="女" value="女" />
        </ElSelect>
      </ElFormItem>

      <!-- 工号 -->
      <ElFormItem label="工号" prop="employeeId">
        <ElInput v-model="formData.employeeId" placeholder="请输入工号" />
      </ElFormItem>

      <!-- 身份证号 -->
      <ElFormItem label="身份证号" prop="idCard">
        <ElInput v-model="formData.idCard" placeholder="请输入身份证号" />
      </ElFormItem>

      <!-- 部门 -->
      <ElFormItem label="工作部门" prop="departmentId">
        <ElTreeSelect
          v-model="formData.departmentId"
          :data="departmentTree"
          :props="{ label: 'name', value: 'id' }"
          check-strictly
          placeholder="请选择工作部门"
          style="width: 100%"
        />
      </ElFormItem>

      <!-- 岗位 -->
      <ElFormItem label="岗位" prop="positionId">
        <ElSelect
          v-model="formData.positionId"
          placeholder="请选择岗位"
          style="width: 100%"
          filterable
          clearable
        >
          <ElOption
            v-for="item in positionList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </ElSelect>
      </ElFormItem>

      <!-- 角色 -->
      <ElFormItem label="角色" prop="roleIds">
        <ElSelect v-model="formData.roleIds" multiple placeholder="请选择角色" style="width: 100%">
          <ElOption
            v-for="role in roleList"
            :key="role.roleId"
            :label="role.roleName"
            :value="role.roleId"
          />
        </ElSelect>
      </ElFormItem>

      <!-- 新增时：入职日期（必填） -->
      <ElFormItem v-if="dialogType === 'add' || formData.hireDate" label="入职日期" prop="hireDate">
        <ElDatePicker
          v-model="formData.hireDate"
          type="date"
          placeholder="请选择入职日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </ElFormItem>

      <!-- 编辑/查看时：在职状态 -->
      <ElFormItem v-if="dialogType !== 'add'" label="在职状态" prop="status">
        <ElSelect v-model="formData.status" placeholder="请选择在职状态" style="width: 100%">
          <ElOption label="在职" value="1" />
          <ElOption label="离职" value="2" />
        </ElSelect>
      </ElFormItem>

      <!-- 编辑/查看时：离职日期 -->
      <ElFormItem
        v-if="dialogType !== 'add' && formData.status === '2'"
        label="离职日期"
        prop="leaveDate"
      >
        <ElDatePicker
          v-model="formData.leaveDate"
          type="date"
          placeholder="请选择离职日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </ElFormItem>

      <!-- 备注 -->
      <ElFormItem label="备注" prop="remark">
        <ElInput v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">{{
          dialogType === 'view' ? '关闭' : '取消'
        }}</ElButton>
        <ElButton v-if="dialogType !== 'view'" type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    createUser,
    updateUser,
    getDepartmentOptions,
    getRoleOptions,
    fetchPositionAll
  } from '@/api/system-manage'

  interface Props {
    visible: boolean
    type: string // Using string to allow 'view' without strict type check issues if DialogType import is tricky here
    userData?: Partial<Api.SystemManage.UserListItem>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const dialogType = computed(() => props.type)

  // 表单实例
  const formRef = ref<FormInstance>()

  // 数据源
  const departmentTree = ref<any[]>([])
  const roleList = ref<Api.SystemManage.RoleListItem[]>([])
  const positionList = ref<any[]>([])

  // 表单数据
  const formData = reactive({
    id: undefined as number | undefined,
    nickName: '',
    userGender: '男',
    employeeId: '',
    idCard: '',
    // salary: '',
    departmentId: undefined as number | undefined,
    positionId: undefined as number | undefined,
    roleIds: [] as number[],
    status: '1',
    hireDate: '',
    leaveDate: '',
    remark: ''
  })

  // 表单验证规则
  const rules = computed<FormRules>(() => ({
    nickName: [
      { required: true, message: '请输入姓名', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    userGender: [{ required: true, message: '请选择性别', trigger: 'change' }],
    employeeId: [{ required: true, message: '请输入工号', trigger: 'blur' }],
    idCard: [{ required: true, message: '请输入身份证号', trigger: 'blur' }],
    departmentId: [{ required: true, message: '请选择工作部门', trigger: 'change' }],
    roleIds: [{ required: true, message: '请选择角色', trigger: 'change' }],
    hireDate:
      dialogType.value === 'add'
        ? [{ required: true, message: '请选择入职日期', trigger: 'change' }]
        : [],
    status:
      dialogType.value === 'edit'
        ? [{ required: true, message: '请选择在职状态', trigger: 'change' }]
        : [],
    leaveDate:
      dialogType.value === 'edit' && formData.status === '2'
        ? [{ required: true, message: '请选择离职日期', trigger: 'change' }]
        : []
  }))

  /**
   * 加载基础数据
   */
  const loadBasicData = async () => {
    try {
      const deptRes = (await getDepartmentOptions()) as any
      // request utility unwraps response, returns valid data or throws error
      if (deptRes) {
        departmentTree.value = deptRes.nodes || []
      }

      const roleRes = (await getRoleOptions()) as any
      if (roleRes) {
        // request utility returns the data payload directly (List<Role>)
        roleList.value = roleRes || []
      }

      const posRes = (await fetchPositionAll()) as any
      if (posRes) {
        positionList.value = posRes || []
      }
    } catch (error) {
      console.error('加载基础数据失败:', error)
    }
  }

  /**
   * 初始化表单数据
   */
  const initFormData = () => {
    const isEdit = (props.type === 'edit' || props.type === 'view') && props.userData
    const row = props.userData

    // 提取角色ID列表
    let roleIds: number[] = []
    if (isEdit && row && row.roles) {
      // 假设 row.roles 是对象数组，Role对象主键为 roleId
      roleIds = row.roles.map((r: any) => r.roleId)
    }

    // 提取部门ID
    let departmentId = undefined
    if (isEdit && row && row.department) {
      departmentId = row.department.id
    }

    Object.assign(formData, {
      id: isEdit && row ? row.id : undefined,
      nickName: isEdit && row ? row.nickName || '' : '',
      userGender: isEdit && row ? row.userGender || '男' : '男',
      employeeId: isEdit && row ? row.employeeId || '' : '',
      idCard: isEdit && row ? (row as any).idCard || '' : '',
      // salary: isEdit && row ? (row as any).salary || '' : '', // Removed
      departmentId: departmentId,
      positionId: isEdit && row && (row as any).position ? (row as any).position.id : undefined,
      roleIds: roleIds,
      status: isEdit && row ? row.status || '1' : '1',
      hireDate: isEdit && row && row.hireDate ? row.hireDate : '',
      leaveDate: isEdit && row && row.leaveDate ? row.leaveDate : '',
      remark: isEdit && row ? row.remark || '' : ''
    })
  }

  /**
   * 关闭弹窗时重置表单
   */
  const handleClose = () => {
    formRef.value?.resetFields()
  }

  /**
   * 监听对话框状态变化
   */
  watch(
    () => [props.visible, props.type, props.userData],
    ([visible]) => {
      if (visible) {
        loadBasicData()
        initFormData()
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    },
    { immediate: true }
  )

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
      if (valid) {
        try {
          // 构造提交数据，后端需要 Role 对象列表和 Department 对象
          const submitData: any = { ...formData }

          // 处理部门
          if (formData.departmentId) {
            submitData.department = { id: formData.departmentId }
          }

          // 处理角色
          if (formData.roleIds && formData.roleIds.length > 0) {
            // 关键修复：后端Role实体主键为roleId，必须使用roleId而不是id
            submitData.roles = formData.roleIds.map((id) => ({ roleId: id }))
          }

          // 处理岗位
          if (formData.positionId) {
            submitData.position = { id: formData.positionId }
          }

          if (dialogType.value === 'add') {
            await createUser(submitData)
            ElMessage.success('添加成功')
          } else {
            await updateUser(submitData)
            ElMessage.success('更新成功')
          }
          dialogVisible.value = false
          emit('submit')
        } catch (error) {
          console.error('保存用户失败:', error)
          ElMessage.error('保存失败，请重试')
        }
      }
    })
  }
</script>
