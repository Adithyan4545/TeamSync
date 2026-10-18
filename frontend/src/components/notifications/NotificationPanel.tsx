import React from 'react';
import { Bell, Check, Info } from 'lucide-react';

interface NotificationPanelProps {
  notifications: any[];
  onMarkRead: (id: string) => Promise<void>;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onMarkRead,
}) => {
  if (!notifications || notifications.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No new notifications
      </div>
    );
  }

  return (
    <div className="divide-y max-h-96 overflow-y-auto">
      {notifications.map((n) => (
        <div
          key={n._id}
          className={`p-3 text-xs flex items-start justify-between gap-3 ${
            !n.read ? 'bg-primary/5 font-medium' : ''
          }`}
        >
          <div className="flex items-start space-x-2">
            <Bell className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-foreground">{n.type}</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          {!n.read && (
            <button
              onClick={() => onMarkRead(n._id)}
              className="text-primary hover:underline flex items-center space-x-1 shrink-0"
            >
              <Check className="w-3 h-3" />
              <span>Mark Read</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
