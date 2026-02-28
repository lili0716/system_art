import request from '@/utils/http'

// 获取考勤日报
export function getDailyReport(params: {
    date: string
    deptId?: number
    employeeIds?: string
    page: number
    pageSize: number
}) {
    return request.get({
        url: '/api/attendance/report/daily',
        params
    })
}

// 导出考勤日报
export function exportDailyReport(params: {
    date: string
    deptId?: number
    employeeIds?: string
}) {
    return request.get({
        url: '/api/attendance/report/daily/export',
        params,
        responseType: 'blob'
    })
}

// 获取考勤月报
export function getMonthlyReport(params: {
    year: number
    month: number
    deptId?: number
    employeeIds?: string
    page: number
    pageSize: number
}) {
    return request.get({
        url: '/api/attendance/report/monthly',
        params
    })
}

// 导出考勤月报
export function exportMonthlyReport(params: {
    year: number
    month: number
    deptId?: number
    employeeIds?: string
}) {
    return request.get({
        url: '/api/attendance/report/monthly/export',
        params,
        responseType: 'blob'
    })
}
