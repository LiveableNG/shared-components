import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onMessage, getMessaging } from 'firebase/messaging';
import { Bell, X, ChevronLeft, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';

// Configuration
const isDevelopment = false;

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBdGMDTVi440pxEKCS1qKHb2hOxbuZTEzo",
  authDomain: "goodtenants-a685f.firebaseapp.com",
  projectId: "goodtenants-a685f",
  storageBucket: "goodtenants-a685f.firebasestorage.app",
  messagingSenderId: "140112142464",
  appId: "1:140112142464:web:3c8474046e9735535ec665",
  measurementId: "G-LK0R46B22N"
};

// Notification interface
interface Notification {
  id: string;
  title: string;
  body: string;
  url?: string;
  data?: any;
  timestamp: number;
  read: boolean;
  severity?: 'success' | 'error' | 'warning' | 'info';
}

// Firebase Utilities
class FirebaseUtil {
  private static app: any = null;
  private static db: any = null;
  private static messagingInstance: any = null;

  static async getFirebaseApp() {
    if (this.app) return this.app;

    const { initializeApp, getApps } = await import('firebase/app');
    const apps = getApps();
    
    if (apps.length > 0) {
      this.app = apps[0];
    } else {
      this.app = initializeApp(FIREBASE_CONFIG);
    }
    
    return this.app;
  }

  static async getFirestore() {
    if (this.db) return this.db;

    await this.getFirebaseApp();
    const { getFirestore } = await import('firebase/firestore');
    this.db = getFirestore(this.app);
    
    return this.db;
  }

  static async getMessaging() {
    if (this.messagingInstance) return this.messagingInstance;

    await this.getFirebaseApp();
    this.messagingInstance = getMessaging(this.app);
    
    return this.messagingInstance;
  }
}

// Storage Service
class NotificationStorage {
  private userId: string | null = null;
  private isDev: boolean = isDevelopment;
  private readonly STORAGE_KEY = 'notifications';
  private readonly MAX_NOTIFICATIONS = 100;

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  // LocalStorage Methods
  private saveToLocalStorage(notification: Notification): void {
    const existing = this.loadFromLocalStorage();
    existing.unshift(notification);
    const trimmed = existing.slice(0, this.MAX_NOTIFICATIONS);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
    this.triggerStorageUpdate();
  }

  private loadFromLocalStorage(): Notification[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return [];
    }
  }

  private updateInLocalStorage(notificationId: string, updates: Partial<Notification>): void {
    const existing = this.loadFromLocalStorage();
    const index = existing.findIndex(n => n.id === notificationId);
    
    if (index !== -1) {
      existing[index] = { ...existing[index], ...updates };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
      this.triggerStorageUpdate();
    }
  }

  private deleteFromLocalStorage(notificationIds: string[]): void {
    const existing = this.loadFromLocalStorage();
    const filtered = existing.filter(n => !notificationIds.includes(n.id));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    this.triggerStorageUpdate();
  }

  private triggerStorageUpdate(): void {
    window.dispatchEvent(new Event('notification-storage-updated'));
  }

  // Firestore Methods
  private async saveToFirestore(notification: Notification): Promise<void> {
    if (!this.userId) return;
    
    try {
      const db = await FirebaseUtil.getFirestore();
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      
      // Use setDoc with the notification ID as the document ID to ensure they match
      await setDoc(doc(db, `users/${this.userId}/notifications/${notification.id}`), {
        ...notification,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      this.saveToLocalStorage(notification);
    }
  }

  private async loadFromFirestore(): Promise<Notification[]> {
    if (!this.userId) return [];
    
    try {
      const db = await FirebaseUtil.getFirestore();
      const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
      
      const q = query(
        collection(db, `users/${this.userId}/notifications`),
        orderBy('timestamp', 'desc'),
        limit(this.MAX_NOTIFICATIONS)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id, // Ensure doc.id takes precedence over any id in the document data
          timestamp: data.timestamp?.toMillis() || Date.now()
        } as Notification;
      });
    } catch (error) {
      console.error('Error loading from Firestore:', error);
      return [];
    }
  }

  private async updateInFirestore(notificationId: string, updates: Partial<Notification>): Promise<void> {
    if (!this.userId) return;
    
    try {
      const db = await FirebaseUtil.getFirestore();
      const { doc, updateDoc } = await import('firebase/firestore');
      
      await updateDoc(doc(db, `users/${this.userId}/notifications/${notificationId}`), updates);
    } catch (error) {
      console.error('Error updating in Firestore:', error);
      this.updateInLocalStorage(notificationId, updates);
    }
  }

  private async deleteFromFirestore(notificationIds: string[]): Promise<void> {
    if (!this.userId || notificationIds.length === 0) return;
    
    try {
      const db = await FirebaseUtil.getFirestore();
      const { writeBatch, doc } = await import('firebase/firestore');
      
      const batch = writeBatch(db);
      notificationIds.forEach(id => {
        const ref = doc(db, `users/${this.userId}/notifications/${id}`);
        batch.delete(ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting from Firestore:', error);
      this.deleteFromLocalStorage(notificationIds);
    }
  }

  private async batchUpdateInFirestore(notificationIds: string[], updates: Partial<Notification>): Promise<void> {
    if (!this.userId || notificationIds.length === 0) return;
    
    try {
      const db = await FirebaseUtil.getFirestore();
      const { writeBatch, doc } = await import('firebase/firestore');
      
      const batch = writeBatch(db);
      notificationIds.forEach(id => {
        const ref = doc(db, `users/${this.userId}/notifications/${id}`);
        batch.update(ref, updates);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error batch updating in Firestore:', error);
      for (const id of notificationIds) {
        this.updateInLocalStorage(id, updates);
      }
    }
  }

  private async setupFirestoreListener(callback: (notifications: Notification[]) => void): Promise<() => void> {
    if (!this.userId) return () => {};
    
    try {
      const db = await FirebaseUtil.getFirestore();
      const { collection, query, orderBy, limit, onSnapshot } = await import('firebase/firestore');
      
      const q = query(
        collection(db, `users/${this.userId}/notifications`),
        orderBy('timestamp', 'desc'),
        limit(this.MAX_NOTIFICATIONS)
      );
      
      return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id, // Ensure doc.id takes precedence over any id in the document data
            timestamp: data.timestamp?.toMillis() || Date.now()
          } as Notification;
        });
        callback(notifications);
      }, (error) => {
        console.error('Firestore listener error:', error);
      });
    } catch (error) {
      console.error('Error setting up Firestore listener:', error);
      return () => {};
    }
  }

  // Public API
  async save(notification: Notification): Promise<void> {
    if (this.isDev) {
      this.saveToLocalStorage(notification);
    } else {
      await this.saveToFirestore(notification);
    }
  }

  async getAll(): Promise<Notification[]> {
    return this.isDev ? this.loadFromLocalStorage() : await this.loadFromFirestore();
  }

  async markAsRead(notificationId: string): Promise<void> {
    if (this.isDev) {
      this.updateInLocalStorage(notificationId, { read: true });
    } else {
      await this.updateInFirestore(notificationId, { read: true });
    }
  }

  async markAllAsRead(): Promise<void> {
    const notifications = await this.getAll();
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    
    if (unreadIds.length === 0) return;
    
    if (this.isDev) {
      unreadIds.forEach(id => this.updateInLocalStorage(id, { read: true }));
    } else {
      await this.batchUpdateInFirestore(unreadIds, { read: true });
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    if (this.isDev) {
      this.deleteFromLocalStorage([notificationId]);
    } else {
      await this.deleteFromFirestore([notificationId]);
    }
  }

  async deleteAllRead(): Promise<void> {
    const notifications = await this.getAll();
    const readIds = notifications.filter(n => n.read).map(n => n.id);
    
    if (readIds.length === 0) return;
    
    if (this.isDev) {
      this.deleteFromLocalStorage(readIds);
    } else {
      await this.deleteFromFirestore(readIds);
    }
  }

  async deleteAll(): Promise<void> {
    const notifications = await this.getAll();
    const allIds = notifications.map(n => n.id);
    
    if (allIds.length === 0) return;
    
    if (this.isDev) {
      this.deleteFromLocalStorage(allIds);
    } else {
      await this.deleteFromFirestore(allIds);
    }
  }

  subscribe(callback: (notifications: Notification[]) => void): () => void {
    if (this.isDev) {
      const handleUpdate = async () => {
        const notifications = await this.getAll();
        callback(notifications);
      };
      
      window.addEventListener('notification-storage-updated', handleUpdate);
      handleUpdate();
      
      return () => {
        window.removeEventListener('notification-storage-updated', handleUpdate);
      };
    } else {
      let unsubscribe: (() => void) | null = null;
      
      this.setupFirestoreListener(callback).then(unsub => {
        unsubscribe = unsub;
      });
      
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }

  getUnreadCount(notifications: Notification[]): number {
    return notifications.filter(n => !n.read).length;
  }
}

// Singleton instance
const storage = new NotificationStorage();

// Toast Notification Component
const createNotificationToast = (
  notification: Notification,
  onMarkAsRead: () => void,
  onDismiss: () => void
) => {
  const handleClick = () => {
    if (notification.url) {
      window.location.href = notification.url;
      onDismiss();
    }
  };

  return (
    <div className="py-1">
      <div 
        className={notification.url ? "cursor-pointer" : ""}
        onClick={handleClick}
      >
        <div className="text-sm line-clamp-2">{notification.body || notification.title}</div>
      </div>
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/30">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead();
          }}
          className="text-xs text-white/90 hover:text-white font-medium px-2 py-0.5 hover:bg-white/10 rounded transition-colors"
        >
          Mark as read
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="text-xs text-white/90 hover:text-white font-medium px-2 py-0.5 hover:bg-white/10 rounded transition-colors ml-auto"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

const showNotificationToast = (notification: Notification, onMarkAsRead: () => void) => {
  const toastId = toast(
    createNotificationToast(
      notification,
      onMarkAsRead,
      () => toast.dismiss(toastId)
    ),
    {
      position: 'top-right',
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      style: { 
        cursor: notification.url ? 'pointer' : 'default',
        background: 'linear-gradient(to right, #041D75, #083BF9)',
        color: 'white',
        padding: '12px 16px'
      },
      className: 'custom-toast'
    }
  );
};

// Main Component
interface NotificationPanelProps {
  userId?: string | null;
  className?: string;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ 
  userId, 
  className = '' 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    const loaded = await storage.getAll();
    setNotifications(loaded);
  }, []);

  // Trigger bell animation
  const triggerBellAnimation = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
  }, []);

  // Handle incoming notification
  const handleIncomingNotification = useCallback(async (notification: Notification) => {
    await storage.save(notification);
    const updated = await storage.getAll();
    setNotifications(updated);
    
    showNotificationToast(notification, async () => {
      await storage.markAsRead(notification.id);
      const refreshed = await storage.getAll();
      setNotifications(refreshed);
    });
    
    triggerBellAnimation();
  }, [triggerBellAnimation]);

  // Set user ID
  useEffect(() => {
    storage.setUserId(userId || null);
    loadNotifications();
  }, [userId, loadNotifications]);

  // Subscribe to storage updates
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }
    
    const unsubscribe = storage.subscribe(setNotifications);
    return unsubscribe;
  }, [userId]);

  // Foreground message listener
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupMessageListener = async () => {
      try {
        const messaging = await FirebaseUtil.getMessaging();
        unsubscribe = onMessage(messaging, async (payload: any) => {
          try {
            const notification: Notification = {
              id: payload.messageId || `${Date.now()}-${Math.random()}`,
              title: payload.notification?.title || payload.data?.title || 'Notification',
              body: payload.notification?.body || payload.data?.body || '',
              url: payload.fcmOptions?.link || payload.notification?.click_action || payload.data?.url,
              data: payload.data,
              timestamp: Date.now(),
              read: false,
              severity: payload.data?.severity || 'info'
            };

            await handleIncomingNotification(notification);
          } catch (error) {
            console.error('Error handling foreground notification:', error);
          }
        });
      } catch (error) {
        console.error('Error setting up messaging listener:', error);
      }
    };

    setupMessageListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [handleIncomingNotification]);

  // Background notification listener
  useEffect(() => {
    const handleBackgroundNotification = async (event: MessageEvent) => {
      if (event.data?.type === 'BACKGROUND_NOTIFICATION') {
        await handleIncomingNotification(event.data.notification);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleBackgroundNotification);
    }
    window.addEventListener('message', handleBackgroundNotification);
    
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleBackgroundNotification);
      }
      window.removeEventListener('message', handleBackgroundNotification);
    };
  }, [handleIncomingNotification]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handlers
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await storage.markAsRead(notification.id);
    }
    
    if (notification.url) {
      window.location.href = notification.url;
    }
    
    setIsOpen(false);
  };

  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await storage.markAsRead(notificationId);
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await storage.deleteNotification(notificationId);
    await loadNotifications();
  };

  const handleClearAll = async () => {
    await storage.deleteAll();
    await loadNotifications();
  };

  const formatTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  const unreadCount = storage.getUnreadCount(notifications);

  return (
    <>
      {/* Notification Bell */}
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative ${className} ${isAnimating ? 'animate-pulse' : ''}`}
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 pointer-events-auto"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div
            ref={panelRef}
            className="absolute right-0 top-0 h-full w-[400px] bg-white shadow-xl pointer-events-auto transform transition-transform duration-300 ease-in-out"
          >
            {/* Header */}
            <div className="bg-[#041D76] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-white/20 px-2 py-1 rounded-full text-sm font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-sm hover:underline"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="h-[calc(100%-80px)] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Bell className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">No notifications</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`group p-4 transition-colors ${
                        notification.read
                          ? 'bg-white hover:bg-gray-50'
                          : 'bg-blue-50 hover:bg-blue-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <h4
                            className={`text-base mb-1 ${
                              notification.read ? 'font-normal' : 'font-semibold'
                            } text-gray-900`}
                          >
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {notification.body}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.timestamp)}
                            </span>
                            {!notification.read && (
                              <button
                                onClick={(e) => handleMarkAsRead(e, notification.id)}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteNotification(e, notification.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-600 rounded transition-all"
                          aria-label="Clear notification"
                          title="Clear notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Collapse Arrow */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute left-0 top-1/2 -translate-x-full bg-gray-800 text-white p-2 rounded-l-lg hover:bg-gray-700 transition-colors"
              aria-label="Collapse"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationPanel;