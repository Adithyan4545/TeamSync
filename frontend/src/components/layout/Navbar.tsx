import React from 'react';
import { Search, Bell, Menu, Sun, Moon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/Button';
import { useUI } from '@/context/UIContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { user } = useAuth();
  const { notifications } = useNotifications(true);
  const { theme, setTheme } = useUI();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 lg:hidden">
        <Button variant="ghost" size="icon" className="-ml-2">
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/dashboard" className="text-lg font-bold hover:opacity-80 transition-opacity">TeamSync</Link>
      </div>

      <div className="hidden lg:flex items-center gap-4">
        {pathname !== '/dashboard' && (
          <div className="flex items-center text-sm text-muted-foreground capitalize">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">TeamSync</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">{pathname.split('/')[1]?.replace('-', ' ')}</span>
          </div>
        )}
      </div>

      <div className="hidden flex-1 items-center justify-center lg:flex px-6">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search hackathons, teams, or people..."
            className="h-10 w-full rounded-full border border-input bg-muted/50 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-full text-muted-foreground hover:text-foreground"
        >
          {mounted ? (theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />) : <span className="h-5 w-5" />}
        </Button>
        
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background border border-background animate-pulse"></span>
            )}
          </Button>
        </Link>

        <div className="flex items-center space-x-3 pl-2 sm:border-l sm:border-border">
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-sm font-medium">{user?.name || 'User'}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.role || ''}</span>
          </div>
          <Link href="/profile">
            <Avatar fallback={user?.name || 'U'} className="cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all" />
          </Link>
        </div>
      </div>
    </header>
  );
}
