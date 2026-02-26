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
export function getMonthSchedule(year: number, month: number, deptId?: number, page = 1, pageSize = 20) {
    return request.get<any>({
        url: '/api/schedule/month',
        params: { year, month, deptId, page, pageSize }
    })
}

// 生成月排班
export function generateMonthSchedule(year: number, month: number) {
    return request.post<any>({
        url: `/api/schedule/generate?year=${year}&month=${month}`,
        data: {}
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

// 获取节假日数据
export function getHolidays(year: number, month: number) {
    return request.get<any>({
        url: '/api/schedule/holidays',
        params: { year, month }
    })
}
