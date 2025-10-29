'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, Clock, MessageCircle, Calendar, X } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  doctorReminder?: {
    type: string;
    doctor: {
      user: {
        profile?: {
          firstName?: string;
          lastName?: string;
        };
      };
    };
    appointment: {
      id: string;
      scheduledDate: string; // Changed from appointmentDate to scheduledDate
      type: string;
    };
  };
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
}

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  // Fetch notifications
  const fetchNotifications = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?page=${pageNum}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data: NotificationsResponse = await response.json();
      
      if (reset || pageNum === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }
      
      setUnreadCount(data.unreadCount);
      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId]
        }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markAllAsRead: true
        }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Toggle message expansion
  const toggleMessageExpansion = (notificationId: string) => {
    setExpandedMessages(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(notificationId)) {
        newExpanded.delete(notificationId);
      } else {
        newExpanded.add(notificationId);
      }
      return newExpanded;
    });
  };

  // Load more notifications
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchNotifications(page + 1);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT_REMINDER':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'DOCTOR_MESSAGE':
        return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'APPOINTMENT_UPDATE':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Format appointment date
  const formatAppointmentDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting appointment date:', error);
      return 'Date not available';
    }
  };

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications(1, true);
          }
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <p className={expandedMessages.has(notification.id) ? '' : 'line-clamp-2'}>
                            {notification.message}
                          </p>
                          {notification.message.length > 100 && (
                            <button
                              onClick={() => toggleMessageExpansion(notification.id)}
                              className="text-blue-600 hover:text-blue-800 text-xs mt-1"
                            >
                              {expandedMessages.has(notification.id) ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                        {notification.doctorReminder && (
                          <div className="mt-2 text-xs text-gray-500">
                            <span>
                              From: Dr. {notification.doctorReminder.doctor.user.profile?.firstName || 'Doctor'}{' '}
                              {notification.doctorReminder.doctor.user.profile?.lastName || ''}
                            </span>
                            <span className="mx-2">•</span>
                            <span>
                              Appointment: {
                                notification.doctorReminder.appointment.scheduledDate 
                                  ? formatAppointmentDate(notification.doctorReminder.appointment.scheduledDate)
                                  : 'Date not available'
                              }
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}