<template>
  <ElDialog
    v-model="dialogVisible"
    title="数据同步配置"
    width="800px"
    align-center
    @close="handleClose"
  >
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
    >
      <!-- 远程数据库配置 -->
      <ElCollapse v-model="activeCollapse">
        <ElCollapseItem title="远程数据库配置" name="db">
          <ElFormItem label="数据库类型" prop="dbType">
            <ElSelect v-model="formData.dbType" placeholder="请选择数据库类型" style="width: 100%">
              <ElOption label="MySQL" value="mysql" />
              <ElOption label="PostgreSQL" value="postgres" />
              <ElOption label="Oracle" value="oracle" />
              <ElOption label="SQL Server" value="sqlserver" />
            </ElSelect>
          </ElFormItem>
          
          <ElFormItem label="主机地址" prop="host">
            <ElInput v-model="formData.host" placeholder="请输入主机地址" />
          </ElFormItem>
          
          <ElFormItem label="端口" prop="port">
            <ElInput v-model.number="formData.port" placeholder="请输入端口" />
          </ElFormItem>
          
          <ElFormItem label="数据库名" prop="database">
            <ElInput v-model="formData.database" placeholder="请输入数据库名" />
          </ElFormItem>
          
          <ElFormItem label="用户名" prop="username">
            <ElInput v-model="formData.username" placeholder="请输入用户名" />
          </ElFormItem>
          
          <ElFormItem label="密码" prop="password">
            <ElInput v-model="formData.password" type="password" placeholder="请输入密码" />
          </ElFormItem>
          
          <ElFormItem label="表名" prop="tableName">
            <ElInput v-model="formData.tableName" placeholder="请输入员工表名" />
          </ElFormItem>
        </ElCollapseItem>
        
        <!-- 字段映射配置 -->
        <ElCollapseItem title="字段映射配置" name="field">
          <div class="field-mapping-container">
            <div class="mapping-header">
              <div class="header-item">本地字段</div>
              <div class="header-item">远程字段</div>
              <div class="header-item">操作</div>
            </div>
            
            <div v-for="(mapping, index) in formData.fieldMappings" :key="index" class="mapping-row">
              <ElFormItem :prop="`fieldMappings.${index}.localField`" :rules="[{ required: true, message: '请选择本地字段', trigger: 'change' }]">
                <ElSelect v-model="mapping.localField" placeholder="请选择本地字段" style="width: 100%">
                  <ElOption label="姓名" value="nickName" />
                  <ElOption label="性别" value="userGender" />
                  <ElOption label="工号" value="employeeId" />
                  <ElOption label="身份证号" value="idCard" />
                  <ElOption label="邮箱" value="email" />
                  <ElOption label="部门ID" value="departmentId" />
                  <ElOption label="入职日期" value="hireDate" />
                </ElSelect>
              </ElFormItem>
              
              <ElFormItem :prop="`fieldMappings.${index}.remoteField`" :rules="[{ required: true, message: '请输入远程字段', trigger: 'blur' }]">
                <ElInput v-model="mapping.remoteField" placeholder="请输入远程字段名" />
              </ElFormItem>
              
              <div class="action-buttons">
                <ElButton 
                  type="danger" 
                  size="small" 
                  @click="removeMapping(index)"
                  :disabled="formData.fieldMappings.length <= 1"
                >
                  删除
                </ElButton>
              </div>
            </div>
            
            <ElButton type="primary" plain @click="addMapping" style="margin-top: 10px">
              添加字段映射
            </ElButton>
          </div>
        </ElCollapseItem>
      </ElCollapse>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">开始同步</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { ref, reactive, computed, nextTick } from 'vue'
  import { ElMessage } from 'element-plus'

  // Props
  const props = defineProps<{
    visible: boolean
  }>()

  // Emits
  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'submit', data: any): void
  }>()

  // Dialog visible
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  // Form ref
  const formRef = ref<FormInstance>()

  // Active collapse
  const activeCollapse = ref(['db', 'field'])

  // Form data
  const formData = reactive({
    // 数据库配置
    dbType: 'mysql',
    host: '',
    port: 3306,
    database: '',
    username: '',
    password: '',
    tableName: '',
    
    // 字段映射
    fieldMappings: [
      { localField: 'nickName', remoteField: '' },
      { localField: 'employeeId', remoteField: '' },
      { localField: 'userGender', remoteField: '' }
    ]
  })

  // Form rules
  const rules = reactive<FormRules>({
    dbType: [{ required: true, message: '请选择数据库类型', trigger: 'change' }],
    host: [{ required: true, message: '请输入主机地址', trigger: 'blur' }],
    port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
    database: [{ required: true, message: '请输入数据库名', trigger: 'blur' }],
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
    tableName: [{ required: true, message: '请输入表名', trigger: 'blur' }]
  })

  /**
   * 添加字段映射
   */
  const addMapping = () => {
    formData.fieldMappings.push({ localField: '', remoteField: '' })
  }

  /**
   * 删除字段映射
   */
  const removeMapping = (index: number) => {
    formData.fieldMappings.splice(index, 1)
  }

  /**
   * 处理关闭
   */
  const handleClose = () => {
    emit('update:visible', false)
  }

  /**
   * 处理提交
   */
  const handleSubmit = async () => {
    if (!formRef.value) return
    
    try {
      await formRef.value.validate()
      emit('submit', { ...formData })
      emit('update:visible', false)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }
</script>

<style scoped>
  .field-mapping-container {
    margin: 20px 0;
  }
  
  .mapping-header {
    display: grid;
    grid-template-columns: 1fr 1fr 100px;
    gap: 10px;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 4px;
    font-weight: bold;
    margin-bottom: 10px;
  }
  
  .header-item {
    text-align: center;
  }
  
  .mapping-row {
    display: grid;
    grid-template-columns: 1fr 1fr 100px;
    gap: 10px;
    margin-bottom: 10px;
    align-items: end;
  }
  
  .action-buttons {
    padding-bottom: 24px;
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
</style>