import { AppRouteRecord } from '@/types/router'

export const personnelRoutes: AppRouteRecord = {
  path: '/personnel',
  name: 'Personnel',
  component: '/index/index',
  meta: {
    title: '人事管理',
    icon: 'ri:team-line', // Choosing a suitable icon for Personnel
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'employee',
      name: 'Employee',
      component: '/personnel/employee',
      meta: {
        title: '员工管理',
        icon: 'ri:user-star-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    }
    // The existing SalaryStatistics route in system.ts should technically be moved here too
    // based on "Personnel Management" logic, but user only asked for "Employee Management" creation.
    // However, I will stick to what was explicitly asked: "generate a new Employee Management".
    // I can move SalaryStatistics later if requested or if I feel proactive.
    // The plan didn't explicitly say move SalaryStatistics, so I will leave it for now to avoid side effects.
  ]
}
