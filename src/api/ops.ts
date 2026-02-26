import request from '@/utils/http'

/**
 * 备份与恢复模块接口 API
 */
const BASE_URL = '/api/ops/backup'

/**
 * 导出备份 (下载压缩包)
 */
export function exportBackup() {
    return request.get<Blob>({
        url: `${BASE_URL}/export`,
        responseType: 'blob', // 指定响应类型为 blob 以便处理文件流下载
        timeout: 120000 // 备份可能很久
    })
}

/**
 * 导入备份还原数据
 * @param file 备份的ZIP文件
 */
export function importBackup(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return request.post<any>({
        url: `${BASE_URL}/import`,
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        timeout: 120000 // 还原可能很久
    })
}
