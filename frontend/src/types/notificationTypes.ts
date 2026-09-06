export interface NotificationItem {
  _id: string;
  recipientId: string;
  recipientEmail: string;
  recipientRole: 'ROLE_CUSTOMER' | 'ROLE_SELLER' | 'ROLE_ADMIN';
  title: string;
  message: string;
  type: 'ORDER' | 'DELIVERY' | 'TRANSACTION' | 'PAYOUT' | 'ACCOUNT' | 'SYSTEM';
  read: boolean;
  link?: string;
  metadata?: any;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}
