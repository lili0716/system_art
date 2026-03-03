import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'

// 获取用户列表
export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  return request.get<Api.SystemManage.UserList>({
    url: '/api/user/list',
    params
  })
}

// 个人中心-更新自身基础信息或密码
export function updateUserProfile(data: any) {
  return request.put({
    url: '/api/user/profile',
    data
  })
}

// 创建用户
export function createUser(data: any) {
  return request.post({
    url: '/api/users',
    data
  })
}

// 更新用户
export function updateUser(data: any) {
  return request.put({
    url: '/api/users',
    data
  })
}

// 更新用户薪资
export function updateUserSalary(data: { id: number; salary: string }) {
  return request.put({
    url: '/api/users/salary',
    data
  })
}

// 删除用户
export function deleteUserById(id: number) {
  return request.del({
    url: `/api/users/${id}`
  })
}

export function searchUsers(params: any) {
  return request.get({
    url: '/api/users/search',
    params
  })
}

// 获取角色列表
export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  return request.get<Api.SystemManage.RoleList>({
    url: '/api/role/list',
    params
  })
}

// 获取菜单列表
export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/api/routes'
  })
}

export function createMenu(data: any) {
  return request.post({
    url: '/api/routes',
    data
  })
}

export function updateMenu(id: number, data: any) {
  return request.put({
    url: `/api/routes/${id}`,
    data
  })
}

export function deleteMenu(id: number) {
  return request.del({
    url: `/api/routes/${id}`
  })
}

// 考勤规则管理
export function getAttendanceRules() {
  return request.get({
    url: '/api/attendance/rules'
  })
}

export function getAttendanceRuleById(id: number) {
  return request.get({
    url: `/api/attendance/rules/${id}`
  })
}

export function createAttendanceRule(data: any) {
  return request.post({
    url: '/api/attendance/rules',
    data
  })
}

export function updateAttendanceRule(id: number, data: any) {
  return request.put({
    url: `/api/attendance/rules/${id}`,
    data
  })
}

export function deleteAttendanceRule(id: number) {
  return request.del({
    url: `/api/attendance/rules/${id}`
  })
}

export function queryAttendanceRules(params: any) {
  return request.post({
    url: '/api/attendance/rules/query',
    data: params
  })
}

// 表单管理
export function getFormList(params: any) {
  return request.post({
    url: '/api/forms/list',
    data: params
  })
}

export function createPunchCardForm(data: any) {
  return request.post({
    url: '/api/forms/punch-card',
    data
  })
}

export function createBusinessTripForm(data: any) {
  return request.post({
    url: '/api/forms/business-trip',
    data
  })
}

export function createFieldWorkForm(data: any) {
  return request.post({
    url: '/api/forms/field-work',
    data
  })
}

export function createLeaveForm(data: any) {
  return request.post({
    url: '/api/forms/leave',
    data
  })
}

export function approveForm(id: number, data: any) {
  return request.post({
    url: `/api/forms/${id}/approve`,
    data
  })
}
export function revokeForm(id: number) {
  return request.post({
    url: `/api/forms/${id}/revoke`
  })
}

// 部门管理
export function getDepartmentTree() {
  return request.get({
    url: '/api/departments/tree'
  })
}

export function createDepartment(data: any) {
  return request.post({
    url: '/api/departments',
    data
  })
}

export function updateDepartment(id: number, data: any) {
  return request.put({
    url: `/api/departments/${id}`,
    data
  })
}

export function deleteDepartment(id: number) {
  return request.del({
    url: `/api/departments/${id}`
  })
}

export function getDepartmentRoutes(id: number) {
  return request.get<number[]>({
    url: `/api/departments/${id}/routes`
  })
}

export function updateDepartmentRoutes(id: number, routeIds: number[]) {
  return request.put({
    url: `/api/departments/${id}/routes`,
    data: routeIds
  })
}

// 考勤文件上传和异常记录管理
export function uploadAttendanceFile(file: File, uploaderId: number) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('uploaderId', uploaderId.toString())
  // 不要手动设置 Content-Type，axios 会自动为 FormData 生成含 boundary 的正确请求头
  return request.post({
    url: '/api/attendance/files/upload',
    data: formData
  })
}

export function getUncorrectedAbnormalRecords(userId: number) {
  return request.get({
    url: `/api/attendance/abnormal-records/uncorrected/${userId}`
  })
}

export function getAbnormalRecordsByUserId(userId: number) {
  return request.get({
    url: `/api/attendance/abnormal-records/user/${userId}`
  })
}

export function exportFailedRecords(failedRecords: any[]) {
  return request.post({
    url: '/api/attendance/files/failed-export',
    data: failedRecords,
    responseType: 'blob'
  })
}

// 考勤查询相关API
export function queryAttendanceRecords(params: any) {
  return request.post({
    url: '/api/attendance/records/query',
    data: params
  })
}

export function getAttendanceRecordDetail(id: number) {
  return request.get({
    url: `/api/attendance/records/detail/${id}`
  })
}

export function exportAttendanceRecords(params: any) {
  return request.post({
    url: '/api/attendance/records/export',
    data: params,
    responseType: 'blob'
  })
}

export function searchEmployees(keyword: string) {
  return request.get({
    url: '/api/users/search',
    params: { keyword }
  })
}

// 获取角色选项列表
export function getRoleOptions() {
  return request.get({
    url: '/api/options/roles'
  })
}

// 获取部门选项列表
export function getDepartmentOptions() {
  return request.get({
    url: '/api/options/departments'
  })
}
// 薪酬统计
export function getSalaryStatistics(month: string, employeeId?: string, departmentId?: number, page?: number, size?: number) {
  return request.get<any>({
    url: '/api/salary/statistics',
    params: { month, employeeId, departmentId, page, size }
  })
}

// 获取角色的菜单权限
export function fetchGetRoleMenuPermissions(roleId: number | string) {
  return request.get<string[]>({
    url: `/api/roles/${roleId}/menu-permissions`
  })
}

// 分配角色的菜单权限
export function fetchAssignMenuPermissions(roleId: number | string, routeNames: string[]) {
  return request.post({
    url: `/api/roles/${roleId}/menu-permissions`,
    data: routeNames
  })
}

// ===== 运维管理 =====

// 查询系统日志
export function fetchSystemLogs(data: any) {
  return request.post<any>({
    url: '/api/ops/logs/query',
    data
  })
}

// 导出系统日志 Excel
export function exportSystemLogs(data: any) {
  return request.post<Blob>({
    url: '/api/ops/logs/export',
    data,
    responseType: 'blob'
  })
}

// 获取服务器状态
export function fetchServerInfo() {
  return request.get<any>({
    url: '/api/ops/server-info'
  })
}

// ===== 岗位管理 =====

export function fetchPositionList(params: any) {
  return request.get<any>({
    url: '/api/position/list',
    params
  })
}

export function fetchPositionAll() {
  return request.get<any[]>({
    url: '/api/position/all'
  })
}

export function createPosition(data: any) {
  return request.post({
    url: '/api/position/add',
    data
  })
}

export function updatePosition(data: any) {
  return request.put({
    url: '/api/position/update',
    data
  })
}

export function deletePosition(id: number) {
  return request.del({
    url: `/api/position/delete/${id}`
  })
}
