import request from '@/utils/http'

// 获取班次类型列表
export function getShiftTypes() {
  return request.get<any>({
    url: '/api/schedule/types'
  })
}

// 新增班次类型
export function createShiftType(data: any) {
  return request.post({
    url: '/api/schedule/types',
    data
  })
}

// 更新班次类型
export function updateShiftType(id: number, data: any) {
  return request.put({
    url: `/api/schedule/types/${id}`,
    data
  })
}

// 删除班次类型
export function deleteShiftType(id: number) {
  return request.del({
    url: `/api/schedule/types/${id}`
  })
}

// 获取某月排班数据
export function getMonthSchedule(
  year: number,
  month: number,
  deptId?: number,
  page = 1,
  pageSize = 20,
  employeeIds?: string
) {
  return request.get<any>({
    url: '/api/schedule/month',
    params: { year, month, deptId, page, pageSize, employeeIds }
  })
}

// 生成月排班（发起任务并返回 taskId）
export function generateMonthSchedule(year: number, month: number) {
  return request.get<any>({
    url: '/api/schedule/generate',
    params: { year, month }
  })
}

// 获取排班生成进度
export function getGenerateProgress(taskId: string) {
  return request.get<any>({
    url: '/api/schedule/progress',
    params: { taskId }
  })
}

// 调班（修改某员工某天班次）
export function updateScheduleCell(data: {
  year: number
  month: number
  day: number
  employeeId: string
  shiftTypeId: number
  remark?: string
}) {
  return request.put({
    url: '/api/schedule/cell',
    data
  })
}

export function getHolidays(year: number, month: number) {
  return request.get<any>({
    url: '/api/schedule/holidays',
    params: { year, month }
  })
}

// 导入月排班
export function importSchedule(file: File, year: number, month: number) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('year', year.toString())
  formData.append('month', month.toString())
  return request.post<any>({
    url: '/api/schedule/import',
    data: formData,
    timeout: 30000
  })
}

// 下载导入模板
export function downloadScheduleTemplate(year: number, month: number) {
  return request.get<Blob>({
    url: '/api/schedule/template',
    params: { year, month },
    responseType: 'blob'
  })
}
