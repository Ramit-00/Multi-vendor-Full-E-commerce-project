import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationItem,
} from '../../../Redux Toolkit/Customer/NotificationSlice';
import {
  ReceiptLongOutlined,
  ShoppingBagOutlined,
  NotificationsActiveOutlined,
  DoneAll,
  CheckCircleOutline,
  DeleteOutline,
  AccessTime,
} from '@mui/icons-material';
import { Button, IconButton, Tab, Tabs, Chip, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function formatTimeAgo(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 30) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  } catch (e) {
    return 'Recently';
  }
}

const SellerNotificationsPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading } = useAppSelector((store) => store.notifications);
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'UNREAD' | 'ORDERS' | 'TRANSACTIONS'>('ALL');

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleTabChange = (_: any, val: 'ALL' | 'UNREAD' | 'ORDERS' | 'TRANSACTIONS') => {
    setSelectedTab(val);
  };

  const filtered = notifications.filter((n: any) => {
    if (selectedTab === 'UNREAD') return !n.read;
    if (selectedTab === 'ORDERS') return n.type === 'ORDER';
    if (selectedTab === 'TRANSACTIONS') return n.type === 'TRANSACTION' || n.type === 'PAYOUT';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Seller Notifications
            </h1>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} New`}
                size="small"
                sx={{
                  backgroundColor: '#1E40AF',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '12px',
                }}
              />
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <AccessTime sx={{ fontSize: 16 }} />
            Merchant notifications, order alerts, and transaction records (retained for 30 days).
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<DoneAll sx={{ fontSize: 16 }} />}
            onClick={() => dispatch(markAllNotificationsAsRead())}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              borderColor: '#CBD5E1',
              color: '#0F172A',
              borderRadius: '8px',
              '&:hover': { borderColor: '#0F172A', backgroundColor: '#F8FAFC' },
            }}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-4 shadow-sm">
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13px',
              minHeight: '48px',
              color: '#64748B',
              '&.Mui-selected': { color: '#1E40AF' },
            },
            '& .MuiTabs-indicator': { backgroundColor: '#1E40AF', height: '3px' },
          }}
        >
          <Tab label="All Notifications" value="ALL" />
          <Tab label={`Unread (${unreadCount})`} value="UNREAD" />
          <Tab label="Order Alerts" value="ORDERS" />
          <Tab label="Transactions & Payouts" value="TRANSACTIONS" />
        </Tabs>
      </div>

      {/* Feed */}
      {loading && notifications.length === 0 ? (
        <div className="flex justify-center py-16">
          <CircularProgress size={32} sx={{ color: '#1E40AF' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center mx-auto">
            <NotificationsActiveOutlined sx={{ fontSize: 28 }} />
          </div>
          <h3 className="text-base font-bold text-slate-900">No notifications found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You are all caught up. New orders and transactions will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notif: any) => (
            <div
              key={notif._id}
              className={`bg-white border rounded-xl p-4 sm:p-5 transition-all duration-200 shadow-sm flex items-start justify-between gap-4 ${
                notif.read ? 'border-slate-200/80' : 'border-blue-300 bg-blue-50/20'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  {notif.type === 'ORDER' ? (
                    <ShoppingBagOutlined sx={{ fontSize: 22, color: '#1E40AF' }} />
                  ) : notif.type === 'TRANSACTION' ? (
                    <ReceiptLongOutlined sx={{ fontSize: 22, color: '#0D9488' }} />
                  ) : (
                    <NotificationsActiveOutlined sx={{ fontSize: 22, color: '#2563EB' }} />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-slate-900">{notif.title}</h4>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />}
                    <span className="text-[11px] font-medium text-slate-400">
                      • {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.link && (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          if (!notif.read) dispatch(markNotificationAsRead(notif._id));
                          navigate(notif.link || '/seller/orders');
                        }}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        View in Dashboard &rarr;
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!notif.read && (
                  <IconButton
                    size="small"
                    title="Mark as read"
                    onClick={() => dispatch(markNotificationAsRead(notif._id))}
                    sx={{ color: '#64748B', '&:hover': { color: '#1E40AF' } }}
                  >
                    <CheckCircleOutline sx={{ fontSize: 18 }} />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  title="Delete notification"
                  onClick={() => dispatch(deleteNotificationItem(notif._id))}
                  sx={{ color: '#94A3B8', '&:hover': { color: '#E11D48' } }}
                >
                  <DeleteOutline sx={{ fontSize: 18 }} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerNotificationsPage;
