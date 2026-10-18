import { LucideIcon, Home, User, Trophy, Search, Users, Inbox, ClipboardList, Bell, Settings, PlusCircle, UserCheck, UserCog, BarChart, TrendingUp, LogOut } from 'lucide-react';

export type Role = 'student' | 'leader' | 'admin';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  // Student & common
  { label: 'Dashboard', href: '/dashboard', icon: Home, roles: ['student', 'leader', 'admin'] },
  { label: 'Profile', href: '/profile', icon: User, roles: ['student'] },
  { label: 'Hackathons', href: '/hackathons', icon: Trophy, roles: ['student'] },
  { label: 'Browse Teams', href: '/browse-teams', icon: Search, roles: ['student'] },
  { label: 'My Teams', href: '/my-teams', icon: Users, roles: ['student', 'leader'] },
  { label: 'Applications', href: '/applications', icon: Inbox, roles: ['student'] },
  { label: 'Task Board', href: '/assignments', icon: ClipboardList, roles: ['student', 'leader'] },
  { label: 'Notifications', href: '/notifications', icon: Bell, roles: ['student', 'leader', 'admin'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['student', 'leader', 'admin'] },
  // Leader specific
  { label: 'Create Team', href: '/create-team', icon: PlusCircle, roles: ['leader'] },
  { label: 'Applicants', href: '/applicants', icon: UserCheck, roles: ['leader'] },
  // Admin specific
  { label: 'Users', href: '/admin/users', icon: UserCog, roles: ['admin'] },
  { label: 'Reports', href: '/admin/reports', icon: BarChart, roles: ['admin'] },
  { label: 'Analytics', href: '/admin/analytics', icon: TrendingUp, roles: ['admin'] },
  // Logout (available to all)
  { label: 'Logout', href: '#logout', icon: LogOut, roles: ['student', 'leader', 'admin'] },
];
