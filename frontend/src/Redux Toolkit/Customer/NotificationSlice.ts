import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../Config/Api';
import { type NotificationItem, type NotificationState } from '../../types/notificationTypes';

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const getAuthHeader = () => {
  const token = localStorage.getItem('customer_jwt') || localStorage.getItem('seller_jwt') || localStorage.getItem('jwt') || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchNotifications = createAsyncThunk<NotificationItem[]>(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/notifications', { headers: getAuthHeader() });
      return response.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchUnreadCount = createAsyncThunk<number>(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/notifications/unread-count', { headers: getAuthHeader() });
      return response.data?.unreadCount || 0;
    } catch (err: any) {
      return rejectWithValue(0);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk<string, string>(
  'notifications/markAsRead',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.patch(`/api/notifications/${id}/read`, {}, { headers: getAuthHeader() });
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await api.patch('/api/notifications/read-all', {}, { headers: getAuthHeader() });
      return true;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteNotificationItem = createAsyncThunk<string, string>(
  'notifications/deleteNotification',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/api/notifications/${id}`, { headers: getAuthHeader() });
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<NotificationItem[]>) => {
        state.loading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action: PayloadAction<number>) => {
        state.unreadCount = action.payload;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action: PayloadAction<string>) => {
        const item = state.notifications.find((n) => n._id === action.payload);
        if (item && !item.read) {
          item.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.read = true;
        });
        state.unreadCount = 0;
      })
      .addCase(deleteNotificationItem.fulfilled, (state, action: PayloadAction<string>) => {
        const wasUnread = state.notifications.find((n) => n._id === action.payload && !n.read);
        state.notifications = state.notifications.filter((n) => n._id !== action.payload);
        if (wasUnread) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
  },
});

export default notificationSlice.reducer;
