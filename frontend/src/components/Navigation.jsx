import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import IconButton from '@mui/material/IconButton'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import MenuIcon from '@mui/icons-material/Menu'
import { useAuth } from '../context/AuthContext.jsx'
import { menuItems, logoutMenuItem } from '../config/menuItems.jsx'
import { hasAnyRole } from '../utils/roles.js'

const DRAWER_WIDTH = 280

/**
 * Слот Navigation: иконка → temporary Drawer.
 * Цвета из theme.palette.sidebar; сверху «Бурение», снизу отдельно «Выход».
 */
export default function Navigation() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const visibleItems = menuItems.filter((item) =>
    hasAnyRole(user?.roles, item.roles),
  )
  const showLogout = hasAnyRole(user?.roles, logoutMenuItem.roles)

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const handleNavClick = (path) => {
    handleClose()
    navigate(path)
  }

  const handleLogout = async () => {
    handleClose()
    try {
      await logout()
    } finally {
      window.location.replace('/login')
    }
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const itemSx = (active) => ({
    mx: 1,
    mb: 0.5,
    borderRadius: 1.5,
    color: active ? 'sidebar.textActive' : 'sidebar.text',
    bgcolor: active ? 'sidebar.activeBg' : 'transparent',
    '&:hover': {
      bgcolor: active ? 'sidebar.activeBg' : 'rgba(255,255,255,0.08)',
    },
    '& .MuiListItemIcon-root': {
      color: 'inherit',
      minWidth: 40,
    },
  })

  return (
    <>
      <IconButton
        edge="start"
        color="inherit"
        aria-label="navigation"
        onClick={handleOpen}
        size="small"
      >
        <MenuIcon />
      </IconButton>

      <Drawer
        anchor="left"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: DRAWER_WIDTH,
            bgcolor: 'sidebar.bg',
            color: 'sidebar.text',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ px: 2.5, py: 2.5 }}>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'sidebar.textActive',
              fontWeight: 700,
              letterSpacing: 0.2,
            }}
          >
            Бурение
          </Typography>
        </Box>

        <List sx={{ flex: 1, py: 0, overflow: 'auto' }}>
          {visibleItems.map((item) => {
            const active = isActive(item.path)
            return (
              <ListItemButton
                key={item.text}
                onClick={() => handleNavClick(item.path)}
                selected={active}
                sx={itemSx(active)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontSize: '0.95rem' }}
                />
              </ListItemButton>
            )
          })}
        </List>

        {showLogout && (
          <Box sx={{ mt: 'auto' }}>
            <Divider sx={{ borderColor: 'sidebar.divider' }} />
            <List sx={{ py: 1 }}>
              <ListItemButton onClick={handleLogout} sx={itemSx(false)}>
                <ListItemIcon>{logoutMenuItem.icon}</ListItemIcon>
                <ListItemText
                  primary={logoutMenuItem.text}
                  primaryTypographyProps={{ fontSize: '0.95rem' }}
                />
              </ListItemButton>
            </List>
          </Box>
        )}
      </Drawer>
    </>
  )
}
