'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';


type Theme = 'light' | 'dark' | 'system';

type NotificationType = 'success' | 'info' | 'warning' | 'error';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: Date;
  actionUrl?: string;
  sender?: string;
  priority?: number;
};

interface UIContextProps {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  // Sidebar
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  // Loading overlay
  loading: boolean;
  setLoading: (value: boolean) => void;
  // Notification panel visibility
  isNotificationPanelOpen: boolean;
  toggleNotificationPanel: () => void;
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  // Global search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const UIContext = createContext<UIContextProps | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [theme, setThemeState] = useState<Theme>(() => {
    const persisted = typeof window !== 'undefined' ? (localStorage.getItem('theme') as Theme | null) : null;
    return persisted ?? 'system';
  });
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    const persisted = typeof window !== 'undefined' ? localStorage.getItem('sidebarCollapsed') === 'true' : false;
    return !persisted;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [isNotificationPanelOpen, setNotificationPanelOpen] = useState<boolean>(false);
  // notifications state initialized later
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Persisted state is now initialized lazily; keep effects for side‑effects only

  // Apply theme class to html element
  useEffect(() => {
    const root = window.document.documentElement;
    const isAuth = pathname?.startsWith('/auth');

    const apply = (mode: Theme) => {
      root.classList.remove('light', 'dark');
      
      // Force dark mode on all authentication pages
      if (isAuth) {
        root.classList.add('dark');
        return;
      }

      if (mode === 'system') {
        const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemPreference);
      } else {
        root.classList.add(mode);
      }
    };
    
    apply(theme);
    
    // Only persist theme if we are not on an auth page, so we don't accidentally save forced dark mode
    if (!isAuth) {
      localStorage.setItem('theme', theme);
    }
  }, [theme, pathname]);

  // Persist sidebar collapsed state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', (!isSidebarOpen).toString());
    }
  }, [isSidebarOpen]);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Remove previous useEffect that set notifications


  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const toggleNotificationPanel = () => setNotificationPanelOpen(prev => !prev);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: UIContextProps = {
    theme,
    setTheme,
    isSidebarOpen,
    toggleSidebar,
    loading,
    setLoading,
    isNotificationPanelOpen,
    toggleNotificationPanel,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    searchQuery,
    setSearchQuery,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = (): UIContextProps => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
