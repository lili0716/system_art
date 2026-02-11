import { AppRouteRecord } from '@/types/router'

export const opsRoutes: AppRouteRecord = {
  path: '/ops',
  name: 'Ops',
  component: '/index/index',
  meta: {
    title: '运维管理',
    icon: 'ri:server-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'server',
      name: 'ServerOps',
      component: '/ops/server-monitor',
      meta: {
        title: '服务器运维',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'logs',
      name: 'SystemLogs',
      component: '/ops/system-log',
      meta: {
        title: '系统日志',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    }
  ]
}
