import { AppRouteRecord } from '@/types/router'

export const dashboardRoutes: AppRouteRecord = {
  name: 'Console',
  path: '/dashboard',
  component: '/dashboard/console',
  meta: {
    title: 'menus.dashboard.console',
    icon: 'ri:pie-chart-line',
    roles: ['R_SUPER', 'R_ADMIN'],
    keepAlive: false,
    fixedTab: true
  }
}
