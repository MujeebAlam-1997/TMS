'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppLogo } from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import {
  Car,
  FilePlus2,
  History,
  LayoutDashboard,
  LogOut,
  Route,
  Send,
  UserCircle,
  Users,
  Download,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useState } from 'react';
import ChangePasswordDialog from './ChangePasswordDialog';

const commonLinks = [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }];

const navLinks = {
  User: [
    ...commonLinks,
    { href: '/requests/new', label: 'Generate Request', icon: FilePlus2 },
    { href: '/requests/history', label: 'History', icon: History },
  ],
  Supervisor: [
    ...commonLinks,
    { href: '/admin/requests', label: 'Requests', icon: Send },
    { href: '/requests/history', label: 'History', icon: History },
  ],
  Manager: [
    ...commonLinks,
    { href: '/admin/requests', label: 'Requests', icon: Send },
    { href: '/requests/history', label: 'History', icon: History },
    { href: '/reports', label: 'Reports', icon: FilePlus2 },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/manager/fleet', label: 'Fleet', icon: Car },
    { href: '/manager/backup', label: 'Backup', icon: Download },
    // { href: '/manager/restore', label: 'Restore', icon: History }
  ],
  PD: [
    ...commonLinks,
    { href: '/admin/requests', label: 'Requests', icon: Send },
    { href: '/requests/history', label: 'History', icon: History },
  ]
};

export default function AppSidebar() {
  const { user, userRole, logout } = useAuth();
  const pathname = usePathname();
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);

  const links = userRole ? navLinks[userRole] : [];
  const userInitials = user?.name.split(' ').map(n => n[0]).join('') || '?';

  return (
    <>
      <aside className="w-64 flex-col bg-sidebar text-sidebar-foreground border-r hidden md:flex">
        <div className="p-4 border-b border-sidebar-border">
          <AppLogo />
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Button
                key={link.href}
                asChild
                variant={isActive ? 'default' : 'ghost'}
                className="w-full justify-start"
              >
                <Link href={link.href}>
                  <link.icon className="mr-2 h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            );
          })}
        </nav>
        <div className="p-4 mt-auto border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{user?.name}</span>
                  <span className="text-xs text-muted-foreground">{userRole}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
                Change Password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
      <ChangePasswordDialog isOpen={isChangePasswordOpen} setIsOpen={setChangePasswordOpen} />
    </>
  );
}
