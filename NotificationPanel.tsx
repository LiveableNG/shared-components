import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onMessage, getToken } from 'firebase/messaging';
import { messaging } from '@/config/firebase';
import { Bell, X, ChevronLeft, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';

// Check if we're in development or production
const isDevelopment = false

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

// Storage Service (handles both localStorage and Firestore)
class NotificationStorage {
  private userId: string | null = null;
  private isDev: boolean = isDevelopment;
  private unsubscribe: (() => void) | null = null;

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  // LocalStorage implementation for dev
  private async saveToLocalStorage(notification: Notification): Promise<void> {
    const key = 'notifications';
    const existing = this.loadFromLocalStorage();
    existing.unshift(notification);
    // Keep only last 100 notifications
    const trimmed = existing.slice(0, 100);
    localStorage.setItem(key, JSON.stringify(trimmed));
    
    // Trigger storage event for real-time updates
    window.dispatchEvent(new Event('notification-storage-updated'));
  }

  private loadFromLocalStorage(): Notification[] {
    try {
      const data = localStorage.getItem('notifications');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private async deleteFromLocalStorage(notificationIds: string[]): Promise<void> {
    const existing = this.loadFromLocalStorage();
    const filtered = existing.filter(n => !notificationIds.includes(n.id));
    localStorage.setItem('notifications', JSON.stringify(filtered));
    window.dispatchEvent(new Event('notification-storage-updated'));
  }

  private async updateInLocalStorage(notificationId: string, updates: Partial<Notification>): Promise<void> {
    const existing = this.loadFromLocalStorage();
    const index = existing.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      existing[index] = { ...existing[index], ...updates };
      localStorage.setItem('notifications', JSON.stringify(existing));
      window.dispatchEvent(new Event('notification-storage-updated'));
    }
  }

  // Firestore implementation for production
  private async saveToFirestore(notification: Notification): Promise<void> {
    if (!this.userId) return;
    
    try {
      // Dynamically import Firestore only in production
      const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { initializeApp, getApps } = await import('firebase/app');
      
      // Get Firebase app (reuse existing or create new)
      let app = getApps()[0];
      if (!app) {
        const firebaseConfig = {
          apiKey: "AIzaSyBdGMDTVi440pxEKCS1qKHb2hOxbuZTEzo",
          authDomain: "goodtenants-a685f.firebaseapp.com",
          projectId: "goodtenants-a685f",
          storageBucket: "goodtenants-a685f.firebasestorage.app",
          messagingSenderId: "140112142464",
          appId: "1:140112142464:web:3c8474046e9735535ec665",
          measurementId: "G-LK0R46B22N"
        };
        app = initializeApp(firebaseConfig);
      }
      
      const db = getFirestore(app);
      await addDoc(collection(db, `users/${this.userId}/notifications`), {
        ...notification,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      // Fallback to localStorage if Firestore fails
      await this.saveToLocalStorage(notification);
    }
  }

  private async loadFromFirestore(): Promise<Notification[]> {
    if (!this.userId) return [];
    
    try {
      const { getFirestore, collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
      const { initializeApp, getApps } = await import('firebase/app');
      
      let app = getApps()[0];
      if (!app) {
        const firebaseConfig = {
          apiKey: "AIzaSyBdGMDTVi440pxEKCS1qKHb2hOxbuZTEzo",
          authDomain: "goodtenants-a685f.firebaseapp.com",
          projectId: "goodtenants-a685f",
          storageBucket: "goodtenants-a685f.firebasestorage.app",
          messagingSenderId: "140112142464",
          appId: "1:140112142464:web:3c8474046e9735535ec665",
          measurementId: "G-LK0R46B22N"
        };
        app = initializeApp(firebaseConfig);
      }
      
      const db = getFirestore(app);
      const q = query(
        collection(db, `users/${this.userId}/notifications`),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toMillis() || Date.now()
      } as Notification));
    } catch (error) {
      console.error('Error loading from Firestore:', error);
      return [];
    }
  }

  private async setupFirestoreListener(callback: (notifications: Notification[]) => void): Promise<() => void> {
    if (!this.userId) return () => {};
    
    try {
      const { getFirestore, collection, query, orderBy, limit, onSnapshot } = await import('firebase/firestore');
      const { initializeApp, getApps } = await import('firebase/app');
      
      let app = getApps()[0];
      if (!app) {
        const firebaseConfig = {
          apiKey: "AIzaSyBdGMDTVi440pxEKCS1qKHb2hOxbuZTEzo",
          authDomain: "goodtenants-a685f.firebaseapp.com",
          projectId: "goodtenants-a685f",
          storageBucket: "goodtenants-a685f.firebasestorage.app",
          messagingSenderId: "140112142464",
          appId: "1:140112142464:web:3c8474046e9735535ec665",
          measurementId: "G-LK0R46B22N"
        };
        app = initializeApp(firebaseConfig);
      }
      
      const db = getFirestore(app);
      const q = query(
        collection(db, `users/${this.userId}/notifications`),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toMillis() || Date.now()
        } as Notification));
        callback(notifications);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up Firestore listener:', error);
      return () => {};
    }
  }

  async save(notification: Notification): Promise<void> {
    if (this.isDev) {
      await this.saveToLocalStorage(notification);
    } else {
      await this.saveToFirestore(notification);
    }
  }

  async getAll(): Promise<Notification[]> {
    if (this.isDev) {
      return this.loadFromLocalStorage();
    } else {
      return await this.loadFromFirestore();
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    if (this.isDev) {
      await this.updateInLocalStorage(notificationId, { read: true });
    } else {
      // Firestore update
      if (!this.userId) return;
      try {
        const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
        const { initializeApp, getApps } = await import('firebase/app');
        
        let app = getApps()[0];
        if (!app) {
          const firebaseConfig = {
            apiKey: "AIzaSyBdGMDTVi440pxEKCS1qKHb2hOxbuZTEzo",
            authDomain: "goodtenants-a685f.firebaseapp.com",
            projectId: "goodtenants-a685f",
            storageBucket: "goodtenants-a685f.firebasestorage.app",
            messagingSenderId: "140112142464",
            appId: "1:140112142464:web:3c8474046e9735535ec665",
            measurementId: "G-LK0R46B22N"
          };
          app = initializeApp(firebaseConfig);
        }
        
        const db = getFirestore(app);
        await updateDoc(doc(db, `users/${this.userId}/notifications/${notificationId}`), {
          read: true
        });
      } catch (error) {
        console.error('Error marking as read in Firestore:', error);
        await this.updateInLocalStorage(notificationId, { read: true });
      }
    }
  }

  async markAllAsRead(): Promise<void> {
    const notifications = await this.getAll();
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    
    if (this.isDev) {
      for (const id of unreadIds) {
        await this.updateInLocalStorage(id, { read: true });
      }
    } else {
      // Firestore batch update
      if (!this.userId || unreadIds.length === 0) return;
      try {
        const { getFirestore, writeBatch, doc } = await import('firebase/firestore');
        const { initializeApp, getApps } = await import('firebase/app');
        
        let app = getApps()[0];
        if (!app) {
          const firebaseConfig = {
            apiKey: "AIzaSyBdGMDTVi440pxEKCS1qKHb2hOxbuZTEzo",
            authDomain: "goodtenants-a685f.firebaseapp.com",
            projectId: "goodtenants-a685f",
            storageBucket: "goodtenants-a685f.firebasestorage.app",
            messagingSenderId: "140112142464",
            appId: "1:140112142464:web:3c8474046e9735535ec665",
            measurementId: "G-LK0R46B22N"
          };
          app = initializeApp(firebaseConfig);
        }
        
        const db = getFirestore(app);
        const batch = writeBatch(db);
        
        unreadIds.forEach(id => {
          const ref = doc(db, `users/${this.userId}/notifications/${id}`);
          batch.update(ref, { read: true });
        });
        
        await batch.commit();
      } catch (error) {
        console.error('Error marking all as read in Firestore:', error);
        // Fallback
        for (const id of unreadIds) {
          await this.updateInLocalStorage(id, { read: true });
        }
      }
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    if (this.isDev) {
      await this.deleteFromLocalStorage([notificationId]);
    } else {
      // Firestore delete
      if (!this.userId) return;
      try {
        const { getFirestore, doc, deleteDoc } = await import('firebase/firestore');
        const { initializeApp, getApps } = await import('firebase/app');
        
        let app = getApps()[0];
        if (!app) {
          const firebaseConfig = {
            apiKey: "AIzaSyBdGMDTVi440pxEKCS1qKHb2hOxbuZTEzo",
            authDomain: "goodtenants-a685f.firebaseapp.com",
            projectId: "goodtenants-a685f",
            storageBucket: "goodtenants-a685f.firebasestorage.app",
            messagingSenderId: "140112142464",
            appId: "1:140112142464:web:3c8474046e9735535ec665",
            measurementId: "G-LK0R46B22N"
          };
          app = initializeApp(firebaseConfig);
        }
        
        const db = getFirestore(app);
        await deleteDoc(doc(db, `users/${this.userId}/notifications/${notificationId}`));
      } catch (error) {
        console.error('Error deleting notification from Firestore:', error);
        await this.deleteFromLocalStorage([notificationId]);
      }
    }
  }

  async deleteAllRead(): Promise<void> {
    const notifications = await this.getAll();
    const readIds = notifications.filter(n => n.read).map(n => n.id);
    
    if (readIds.length === 0) return;
    
    if (this.isDev) {
      await this.deleteFromLocalStorage(readIds);
    } else {
      // Firestore batch delete
      if (!this.userId) return;
      try {
        const { getFirestore, writeBatch, doc, deleteDoc } = await import('firebase/firestore');
        const { initializeApp, getApps } = await import('firebase/app');
        
        let app = getApps()[0];
        if (!app) {
          const firebaseConfig = {
            apiKey: "AIzaSyBdGMDTVi440pxEKCS1qKHb2hOxbuZTEzo",
            authDomain: "goodtenants-a685f.firebaseapp.com",
            projectId: "goodtenants-a685f",
            storageBucket: "goodtenants-a685f.firebasestorage.app",
            messagingSenderId: "140112142464",
            appId: "1:140112142464:web:3c8474046e9735535ec665",
            measurementId: "G-LK0R46B22N"
          };
          app = initializeApp(firebaseConfig);
        }
        
        const db = getFirestore(app);
        const batch = writeBatch(db);
        
        readIds.forEach(id => {
          const ref = doc(db, `users/${this.userId}/notifications/${id}`);
          batch.delete(ref);
        });
        
        await batch.commit();
      } catch (error) {
        console.error('Error deleting from Firestore:', error);
        await this.deleteFromLocalStorage(readIds);
      }
    }
  }

  async deleteAll(): Promise<void> {
    const notifications = await this.getAll();
    const allIds = notifications.map(n => n.id);
    
    if (allIds.length === 0) return;
    
    if (this.isDev) {
      await this.deleteFromLocalStorage(allIds);
    } else {
      // Firestore batch delete
      if (!this.userId) return;
      try {
        const { getFirestore, writeBatch, doc, deleteDoc } = await import('firebase/firestore');
        const { initializeApp, getApps } = await import('firebase/app');
        
        let app = getApps()[0];
        if (!app) {
          const firebaseConfig = {
            apiKey: "AIzaSyBdGMDTVi440pxEKCS1qKHb2hOxbuZTEzo",
            authDomain: "goodtenants-a685f.firebaseapp.com",
            projectId: "goodtenants-a685f",
            storageBucket: "goodtenants-a685f.firebasestorage.app",
            messagingSenderId: "140112142464",
            appId: "1:140112142464:web:3c8474046e9735535ec665",
            measurementId: "G-LK0R46B22N"
          };
          app = initializeApp(firebaseConfig);
        }
        
        const db = getFirestore(app);
        const batch = writeBatch(db);
        
        allIds.forEach(id => {
          const ref = doc(db, `users/${this.userId}/notifications/${id}`);
          batch.delete(ref);
        });
        
        await batch.commit();
      } catch (error) {
        console.error('Error deleting all notifications from Firestore:', error);
        await this.deleteFromLocalStorage(allIds);
      }
    }
  }

  subscribe(callback: (notifications: Notification[]) => void): () => void {
    if (this.isDev) {
      // LocalStorage listener
      const handleUpdate = async () => {
        const notifications = await this.getAll();
        callback(notifications);
      };
      
      window.addEventListener('notification-storage-updated', handleUpdate);
      
      // Initial load
      handleUpdate();
      
      return () => {
        window.removeEventListener('notification-storage-updated', handleUpdate);
      };
    } else {
      // Firestore listener
      this.setupFirestoreListener(callback).then(unsub => {
        this.unsubscribe = unsub;
      });
      
      return () => {
        if (this.unsubscribe) {
          this.unsubscribe();
        }
      };
    }
  }

  getUnreadCount(notifications: Notification[]): number {
    return notifications.filter(n => !n.read).length;
  }
}

// Create singleton instance
const storage = new NotificationStorage();

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

  // Set user ID for storage
  useEffect(() => {
    storage.setUserId(userId || null);
    loadNotifications();
  }, [userId]);

  // Load notifications initially
  const loadNotifications = useCallback(async () => {
    const loaded = await storage.getAll();
    setNotifications(loaded);
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }
    
    const unsubscribe = storage.subscribe((updated) => {
      setNotifications(updated);
    });
    
    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Set up foreground message listener
  useEffect(() => {
    const unsubscribe = onMessage(messaging, async (payload: any) => {
      try {
        // Store notification immediately (before processing)
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

        // Store first
        await storage.save(notification);
        
        // Manually reload notifications to update the count immediately
        const updated = await storage.getAll();
        setNotifications(updated);
        
        // Show toast notification
        const toastId = toast(
          <div className="py-1">
            <div 
              className={notification.url ? "cursor-pointer" : ""}
              onClick={() => {
                if (notification.url) {
                  window.location.href = notification.url;
                  toast.dismiss(toastId);
                }
              }}
            >
              <div className="text-sm line-clamp-2">{notification.body || notification.title}</div>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/30">
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await storage.markAsRead(notification.id);
                  const updated = await storage.getAll();
                  setNotifications(updated);
                  toast.dismiss(toastId);
                }}
                className="text-xs text-white/90 hover:text-white font-medium px-2 py-0.5 hover:bg-white/10 rounded transition-colors"
              >
                Mark as read
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(toastId);
                }}
                className="text-xs text-white/90 hover:text-white font-medium px-2 py-0.5 hover:bg-white/10 rounded transition-colors ml-auto"
              >
                Dismiss
              </button>
            </div>
          </div>,
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
        
        // Trigger bell animation
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1000);
      } catch (error) {
        console.error('Error handling foreground notification:', error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Listen for storage events from service worker (background notifications)
  useEffect(() => {
    const handleStorageMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === 'BACKGROUND_NOTIFICATION') {
        const notification: Notification = event.data.notification;
        await storage.save(notification);
        
        // Manually reload notifications to update the count immediately
        const updated = await storage.getAll();
        setNotifications(updated);
        
        // Show toast notification
        const toastId = toast(
          <div className="py-1">
            <div 
              className={notification.url ? "cursor-pointer" : ""}
              onClick={() => {
                if (notification.url) {
                  window.location.href = notification.url;
                  toast.dismiss(toastId);
                }
              }}
            >
              <div className="text-sm line-clamp-2">{notification.body || notification.title}</div>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/30">
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await storage.markAsRead(notification.id);
                  const updated = await storage.getAll();
                  setNotifications(updated);
                  toast.dismiss(toastId);
                }}
                className="text-xs text-white/90 hover:text-white font-medium px-2 py-0.5 hover:bg-white/10 rounded transition-colors"
              >
                Mark as read
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(toastId);
                }}
                className="text-xs text-white/90 hover:text-white font-medium px-2 py-0.5 hover:bg-white/10 rounded transition-colors ml-auto"
              >
                Dismiss
              </button>
            </div>
          </div>,
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
        
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1000);
      }
    };

    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Service worker is ready
      });
      
      navigator.serviceWorker.addEventListener('message', handleStorageMessage);
    }
    
    // Also listen on window for broader compatibility
    window.addEventListener('message', handleStorageMessage);
    
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleStorageMessage);
      }
      window.removeEventListener('message', handleStorageMessage);
    };
  }, []);

  // Close panel when clicking outside
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = storage.getUnreadCount(notifications);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await storage.markAsRead(notification.id);
    }
    
    // Navigate if URL exists
    if (notification.url) {
      window.location.href = notification.url;
    }
    
    setIsOpen(false);
  };

  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await storage.markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    // Clear all notifications (both read and unread)
    await storage.deleteAll();
    // Reload notifications
    await loadNotifications();
  };

  const formatTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

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
            <div className="bg-gradient-to-r from-dkblue to-ltblue text-white p-4 flex items-center justify-between">
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
                    onClick={handleMarkAllAsRead}
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
                          onClick={async (e) => {
                            e.stopPropagation();
                            await storage.deleteNotification(notification.id);
                            const updated = await storage.getAll();
                            setNotifications(updated);
                          }}
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
