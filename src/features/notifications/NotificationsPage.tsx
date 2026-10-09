import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Notification } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Bell, CheckCircle2, ArrowRight, Award, Vote, FileCheck2, ShieldCheck } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

export const NotificationsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const list = await demoRepository.getNotifications(currentUser.id);
        setNotifications(list);
      } catch (err) {
        console.error('Failed to load notifications', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentUser, refreshKey]);

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await demoRepository.markAllNotificationsRead(currentUser.id);
    triggerRefresh();
  };

  const handleMarkOneRead = async (notifId: string) => {
    await demoRepository.markNotificationRead(notifId);
    triggerRefresh();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-civic-indigo-600" />
            <span>Activity & Review Notifications</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time local triggers for submissions, feedback, credits, and assembly updates.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>Mark All as Read</span>
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card className="p-8 text-center text-slate-500 text-xs">
            No notifications at this time.
          </Card>
        ) : (
          notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`p-4 sm:p-5 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                !notif.isRead ? 'bg-civic-indigo-50/30 border-civic-indigo-200 ring-1 ring-civic-indigo-200' : 'bg-white'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    !notif.isRead
                      ? 'bg-civic-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {notif.type === 'review' && <CheckCircle2 className="w-4 h-4" />}
                  {notif.type === 'assembly' && <Vote className="w-4 h-4" />}
                  {notif.type === 'credit' && <Award className="w-4 h-4" />}
                  {notif.type === 'assignment' && <FileCheck2 className="w-4 h-4" />}
                  {notif.type === 'system' && <ShieldCheck className="w-4 h-4" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 font-heading">
                      {notif.title}
                    </h3>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-civic-saffron-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {formatRelativeTime(notif.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Link
                  to={notif.targetRoute}
                  onClick={() => handleMarkOneRead(notif.id)}
                >
                  <Button size="sm" variant="outline">
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
