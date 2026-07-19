import Assignment from '@mui/icons-material/Assignment'
import MenuBook from '@mui/icons-material/MenuBook'
import Assessment from '@mui/icons-material/Assessment'
import Settings from '@mui/icons-material/Settings'
import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings'
import Logout from '@mui/icons-material/Logout'

/**
 * Пункты основного списка Drawer (без «Выход» — он снизу панели отдельно).
 * Роли Spring: ROLE_USER / ROLE_ADMIN.
 */
export const menuItems = [
  {
    text: 'Наряды',
    icon: <Assignment />,
    path: '/',
    roles: ['ROLE_USER', 'ROLE_ADMIN'],
  },
  {
    text: 'Справочники',
    icon: <MenuBook />,
    path: '/catalog',
    roles: ['ROLE_USER', 'ROLE_ADMIN'],
  },
  {
    text: 'Отчеты',
    icon: <Assessment />,
    path: '/reports',
    roles: ['ROLE_USER', 'ROLE_ADMIN'],
  },
  {
    text: 'Настройки',
    icon: <Settings />,
    path: '/settings',
    roles: ['ROLE_USER', 'ROLE_ADMIN'],
  },
  {
    text: 'Админ-панель',
    icon: <AdminPanelSettings />,
    path: '/admin',
    roles: ['ROLE_ADMIN'],
  },
]

/** Пункт «Выход» — в нижней части Drawer, отдельно от списка. */
export const logoutMenuItem = {
  text: 'Выход',
  icon: <Logout />,
  roles: ['ROLE_USER', 'ROLE_ADMIN'],
}
