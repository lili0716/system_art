import { AppRouteRecord } from '@/types/router'

export const organizationRoutes: AppRouteRecord = {
  path: '/organization',
  name: 'Organization',
  component: '/index/index',
  meta: {
    title: '组织架构',
    icon: 'ri:building-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'dept',
      name: 'Department',
      component: '/system/dept',
      meta: {
        title: '部门管理',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'position',
      name: 'Position',
      component: '/system/position',
      meta: {
        title: '职位管理',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    }
  ]
}
