import { Menu, LayoutDashboard, Truck, Users, Send, Wrench, Wallet, ChevronDown, TrendingUp } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { appNavItems } from '@/config/app'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'

const iconMap = {
  LayoutDashboard,
  Truck,
  Users,
  Send,
  Wrench,
  Wallet,
  TrendingUp,
}

export function AppShell() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuth()

  const pageTitle = useMemo(() => {
    return appNavItems.find((item) => item.path === location.pathname)?.label ?? 'Dashboard'
  }, [location.pathname])

  const navigation = appNavItems.map((item) => {
    const Icon = iconMap[item.icon as keyof typeof iconMap] ?? LayoutDashboard

    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`
        }
        onClick={() => setOpen(false)}
      >
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
      </NavLink>
    )
  })

  const userInitials = user?.name
    ?.split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'TO'

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-72 shrink-0 border-r border-border bg-card md:block">
        <div className="flex h-16 items-center border-b border-border px-4">
          <div>
            <p className="text-heading">TransitOps</p>
            <p className="text-caption text-muted-foreground">Operations Platform</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">{navigation}</nav>
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-72 p-0">
          <div className="flex h-16 items-center border-b border-border px-4">
            <p className="text-heading">TransitOps</p>
          </div>
          <nav className="space-y-1 p-3">{navigation}</nav>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-heading">{pageTitle}</h1>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 rounded-md px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-foreground md:block">{user?.name ?? 'TransitOps User'}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => logout()}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
