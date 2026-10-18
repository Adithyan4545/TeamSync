import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Sparkles, 
  Bookmark, 
  CheckSquare, 
  Bell, 
  User, 
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/context/UIContext';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Hackathons', href: '/hackathons', icon: Trophy },
  { name: 'Teams', href: '/teams', icon: Users },
  { name: 'AI Match', href: '/ai-match', icon: Sparkles },
  { name: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  { name: 'Task Board', href: '/assignments', icon: CheckSquare },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Profile', href: '/profile', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { theme, setTheme } = useUI();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 flex-col border-r border-border/40 bg-background/80 backdrop-blur-3xl transition-all hidden lg:flex shadow-2xl">
      <div className="flex h-16 items-center px-4 border-b border-border/40">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="h-10 w-10 shrink-0 relative rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,240,255,0.3)] border border-cyan-500/30">
            <img src="/logo.png" alt="TeamSync Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-extrabold text-gradient-brand tracking-widest uppercase drop-shadow-md">TeamSync</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.name} href={item.href} className="block">
                <div className={cn(
                  "relative flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-bold tracking-wide transition-all duration-300",
                  isActive 
                    ? "text-red-500" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}>
                  {isActive && (
                    <motion.div
                      layoutId="active-sidebar-bg"
                      className="absolute inset-0 rounded-xl bg-accent/80 border border-border shadow-sm"
                      initial={false}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-red-500 z-20" />
                  )}
                  <item.icon className={cn("relative z-10 h-4.5 w-4.5 shrink-0", isActive ? "text-red-500" : "text-muted-foreground")} />
                  <span className="relative z-10 truncate">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="p-3 border-t border-border/40 space-y-1.5">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex w-full items-center space-x-3 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
        >
          <div className="flex items-center space-x-3">
            {mounted ? (
              <>
                {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-400 shrink-0" /> : <Moon className="h-4.5 w-4.5 text-purple-600 shrink-0" />}
                <span className="capitalize">{theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
              </>
            ) : (
              <>
                <div className="h-4.5 w-4.5" />
                <span className="capitalize text-transparent">Loading</span>
              </>
            )}
          </div>
        </button>

        <button
          onClick={logout}
          className="flex w-full items-center space-x-3 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
