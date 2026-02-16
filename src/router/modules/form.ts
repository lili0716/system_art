import { AppRouteRecord } from '@/types/router'

export const formRoutes: AppRouteRecord = {
  path: '/form',
  name: 'Form',
  component: '/index/index',
  meta: {
    title: 'menus.form.title',
    icon: 'ri:file-list-3-line',
    roles: ['R_SUPER', 'R_ADMIN', 'R_USER']
  },
  children: [
    {
      path: 'application',
      name: 'FormApplication',
      component: '/form/application',
      meta: {
        title: 'menus.form.application',
        keepAlive: true
      }
    },
    {
      path: 'approval',
      name: 'FormApproval',
      component: '/form/approval',
      meta: {
        title: 'menus.form.approval',
        keepAlive: true
      }
    }
  ]
}
