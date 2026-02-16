import { AppRouteRecord } from '@/types/router'

export const opsRoutes: AppRouteRecord = {
  path: '/ops',
  name: 'Ops',
  component: '/index/index',
  meta: {
    title: 'menus.ops.title',
    icon: 'ri:server-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'server',
      name: 'ServerOps',
      component: '/ops/server-monitor',
      meta: {
        title: 'menus.ops.serverMonitor',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'logs',
      name: 'SystemLogs',
      component: '/ops/system-log',
      meta: {
        title: 'menus.ops.systemLog',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    }
  ]
}
