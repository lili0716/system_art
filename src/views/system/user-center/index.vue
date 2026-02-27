<!-- 个人中心页面 -->
<template>
  <div class="w-full h-full p-0 bg-transparent border-none shadow-none">
    <div class="relative flex-b mt-2.5 max-md:block max-md:mt-1">
      <div class="w-112 mr-5 max-md:w-full max-md:mr-0">
        <div class="art-card-sm relative p-9 pb-6 overflow-hidden text-center">
          <img class="absolute top-0 left-0 w-full h-50 object-cover" src="@imgs/user/bg.webp" />
          <img
            class="relative z-10 w-20 h-20 mt-30 mx-auto object-cover border-2 border-white rounded-full"
            src="@imgs/user/avatar.webp"
          />
          <h2 class="mt-5 text-xl font-normal">{{ userInfo.userName }}</h2>
          <p class="mt-5 text-sm">{{ $t('userCenter.subtitle') }}</p>

          <div class="w-75 mx-auto mt-7.5 text-left">
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:mail-line" class="text-g-700" />
              <span class="ml-2 text-sm">jdkjjfnndf@mall.com</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:user-3-line" class="text-g-700" />
              <span class="ml-2 text-sm">交互专家</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:map-pin-line" class="text-g-700" />
              <span class="ml-2 text-sm">广东省深圳市</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:dribbble-fill" class="text-g-700" />
              <span class="ml-2 text-sm">字节跳动－某某平台部－UED</span>
            </div>
          </div>

          <div class="mt-10">
            <h3 class="text-sm font-medium">{{ $t('userCenter.tags.title') }}</h3>
            <div class="flex flex-wrap justify-center mt-3.5">
              <div
                v-for="item in lableList"
                :key="item"
                class="py-1 px-1.5 mr-2.5 mb-2.5 text-xs border border-g-300 rounded"
              >
                {{ item }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex-1 overflow-hidden max-md:w-full max-md:mt-3.5">
        <div class="art-card-sm">
          <h1 class="p-4 text-xl font-normal border-b border-g-300">
            {{ $t('userCenter.sections.basicSettings') }}
          </h1>

          <ElForm
            :model="form"
            class="box-border p-5 [&>.el-row_.el-form-item]:w-[calc(50%-10px)] [&>.el-row_.el-input]:w-full [&>.el-row_.el-select]:w-full"
            ref="ruleFormRef"
            :rules="rules"
            label-width="86px"
            label-position="top"
          >
            <ElRow>
              <ElFormItem :label="$t('userCenter.form.realName')" prop="realName">
                <ElInput v-model="form.realName" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem :label="$t('userCenter.form.sex')" prop="sex" class="ml-5">
                <ElSelect
                  v-model="form.sex"
                  :placeholder="$t('userCenter.form.sexPlaceholder')"
                  :disabled="!isEdit"
                >
                  <ElOption
                    v-for="item in options"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem :label="$t('userCenter.form.nickName')" prop="nikeName">
                <ElInput v-model="form.nikeName" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem :label="$t('userCenter.form.email')" prop="email" class="ml-5">
                <ElInput v-model="form.email" :disabled="!isEdit" />
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem :label="$t('userCenter.form.mobile')" prop="mobile">
                <ElInput v-model="form.mobile" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem :label="$t('userCenter.form.address')" prop="address" class="ml-5">
                <ElInput v-model="form.address" :disabled="!isEdit" />
              </ElFormItem>
            </ElRow>

            <ElFormItem :label="$t('userCenter.form.description')" prop="des" class="h-32">
              <ElInput type="textarea" :rows="4" v-model="form.des" :disabled="!isEdit" />
            </ElFormItem>

            <div class="flex-c justify-end [&_.el-button]:!w-27.5">
              <ElButton type="primary" class="w-22.5" v-ripple @click="edit">
                {{ isEdit ? $t('userCenter.actions.save') : $t('userCenter.actions.edit') }}
              </ElButton>
            </div>
          </ElForm>
        </div>

        <div class="art-card-sm my-5">
          <h1 class="p-4 text-xl font-normal border-b border-g-300">
            {{ $t('userCenter.sections.changePassword') }}
          </h1>

          <ElForm :model="pwdForm" class="box-border p-5" label-width="86px" label-position="top">
            <ElFormItem :label="$t('userCenter.password.current')" prop="password">
              <ElInput
                v-model="pwdForm.password"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <ElFormItem :label="$t('userCenter.password.new')" prop="newPassword">
              <ElInput
                v-model="pwdForm.newPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <ElFormItem :label="$t('userCenter.password.confirm')" prop="confirmPassword">
              <ElInput
                v-model="pwdForm.confirmPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <div class="flex-c justify-end [&_.el-button]:!w-27.5">
              <ElButton type="primary" class="w-22.5" v-ripple @click="editPwd">
                {{ isEditPwd ? $t('userCenter.actions.save') : $t('userCenter.actions.edit') }}
              </ElButton>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/store/modules/user'
  import type { FormInstance, FormRules } from 'element-plus'
  import { useI18n } from 'vue-i18n'

  defineOptions({ name: 'UserCenter' })

  const { t } = useI18n()

  const userStore = useUserStore()
  const userInfo = computed(() => userStore.getUserInfo)

  const isEdit = ref(false)
  const isEditPwd = ref(false)
  const date = ref('')
  const ruleFormRef = ref<FormInstance>()

  /**
   * 用户信息表单
   */
  const form = reactive({
    realName: 'John Snow',
    nikeName: '皮卡丘',
    email: '59301283@mall.com',
    mobile: '18888888888',
    address: '广东省深圳市宝安区西乡街道101栋201',
    sex: '2',
    des: 'Art Design Pro 是一款兼具设计美学与高效开发的后台系统.'
  })

  /**
   * 密码修改表单
   */
  const pwdForm = reactive({
    password: '123456',
    newPassword: '123456',
    confirmPassword: '123456'
  })

  /**
   * 表单验证规则
   */
  const rules = reactive<FormRules>({
    realName: [
      { required: true, message: t('userCenter.rules.realNameRequired'), trigger: 'blur' },
      { min: 2, max: 50, message: t('userCenter.rules.realNameLength'), trigger: 'blur' }
    ],
    nikeName: [
      { required: true, message: t('userCenter.rules.nickNameRequired'), trigger: 'blur' },
      { min: 2, max: 50, message: t('userCenter.rules.nickNameLength'), trigger: 'blur' }
    ],
    email: [{ required: true, message: t('userCenter.rules.emailRequired'), trigger: 'blur' }],
    mobile: [{ required: true, message: t('userCenter.rules.mobileRequired'), trigger: 'blur' }],
    address: [{ required: true, message: t('userCenter.rules.addressRequired'), trigger: 'blur' }],
    sex: [{ required: true, message: t('userCenter.rules.sexRequired'), trigger: 'blur' }]
  })

  /**
   * 性别选项
   */
  const options = [
    { value: '1', label: t('userCenter.form.sexMale') },
    { value: '2', label: t('userCenter.form.sexFemale') }
  ]

  /**
   * 用户标签列表
   */
  const lableList: Array<string> = [
    t('userCenter.tags.focusDesign'),
    t('userCenter.tags.creative'),
    t('userCenter.tags.spicy'),
    t('userCenter.tags.longLegs'),
    t('userCenter.tags.sichuanGirl'),
    t('userCenter.tags.inclusive')
  ]

  onMounted(() => {
    getDate()
  })

  /**
   * 根据当前时间获取问候语
   */
  const getDate = () => {
    const h = new Date().getHours()

    if (h >= 6 && h < 9) date.value = t('userCenter.greeting.morning')
    else if (h >= 9 && h < 11) date.value = t('userCenter.greeting.lateMorning')
    else if (h >= 11 && h < 13) date.value = t('userCenter.greeting.noon')
    else if (h >= 13 && h < 18) date.value = t('userCenter.greeting.afternoon')
    else if (h >= 18 && h < 24) date.value = t('userCenter.greeting.evening')
    else date.value = t('userCenter.greeting.lateNight')
  }

  /**
   * 切换用户信息编辑状态
   */
  const edit = () => {
    isEdit.value = !isEdit.value
  }

  /**
   * 切换密码编辑状态
   */
  const editPwd = () => {
    isEditPwd.value = !isEditPwd.value
  }
</script>
