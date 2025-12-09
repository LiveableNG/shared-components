import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, ChevronLeft, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';

// ✅ ENV
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBdGMDTVi440pxEKCS1qKHb2hOxbuZTEzo",
  authDomain: "goodtenants-a685f.firebaseapp.com",
  projectId: "goodtenants-a685f",
  storageBucket: "goodtenants-a685f.firebasestorage.app",
  messagingSenderId: "140112142464",
  appId: "1:140112142464:web:3c8474046e9735535ec665",
};

// ✅ ENV DETECTOR
const getEnvironment = () => {
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('staging')) return 'staging';
  if (hostname.includes('uat')) return 'uat';
  if (hostname.includes('dev') || hostname.includes('localhost')) return 'dev';
  return 'production';
};

// ✅ TYPES
interface Notification {
  id: string;
  title: string;
  body: string;
  url?: string;
  timestamp: number;
  read: boolean;
  severity?: 'success' | 'error' | 'warning' | 'info';
}

// ✅ FIREBASE
class FirebaseUtil {
  static app: any;
  static db: any;

  static async getFirestore() {
    if (this.db) return this.db;

    const { initializeApp, getApps } = await import('firebase/app');
    if (!getApps().length) initializeApp(FIREBASE_CONFIG);

    const { getFirestore } = await import('firebase/firestore');
    this.db = getFirestore();
    return this.db;
  }
}

// ✅ BEEP SOUND
const playBeep = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playSingleBeep = (startTime: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Beep frequency in Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    };

    // Play first beep
    playSingleBeep(audioContext.currentTime);
    
    // Play second beep after a short delay
    playSingleBeep(audioContext.currentTime + 0.2);
  } catch (error) {
    // Fallback: try using a simple audio element if Web Audio API fails
    console.debug('Web Audio API not available, skipping beep');
  }
};

// ✅ MODERN TOAST
const showModernToast = (notification: Notification, onMarkAsRead: () => void) => {
  let toastId: ReturnType<typeof toast>;

  toastId = toast(
    <div className="flex items-start gap-3">
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-snug">
          {notification.title}
        </p>

        {notification.body && (
          <p className="mt-0.5 text-sm text-gray-600 line-clamp-2">
            {notification.body}
          </p>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-4">
          {!notification.read && (
            <button
              onClick={async () => {
                await onMarkAsRead();
                toast.dismiss(toastId);
              }}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Mark as read
            </button>
          )}

          {notification.url && (
            <button
              onClick={() => {
                window.location.href = notification.url!;
                toast.dismiss(toastId);
              }}
              className="text-xs font-medium text-gray-600 hover:underline"
            >
              Open
            </button>
          )}

          <button
            onClick={() => toast.dismiss(toastId)}
            className="ml-auto text-xs text-gray-400 hover:text-gray-600"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>,
    {
      position: 'top-right',
      autoClose: 4500,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      hideProgressBar: true,
      style: {
        background: '#ffffff',
        color: '#111827',
        borderRadius: '14px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
        padding: '14px 16px'
      }
    }
  );
};

// ✅ MAIN PANEL
const NotificationPanel: React.FC<{ userId?: string | null; className?: string }> = ({
  userId,
  className = ''
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // ✅ FIRESTORE LISTENER + TOAST DRIVER
  useEffect(() => {
    if (!userId) return;

    let isInitial = true;
    let previousIds = new Set<string>();
    let unsubscribe: (() => void) | null = null;

    const setup = async () => {
      const db = await FirebaseUtil.getFirestore();
      const { collection, query, orderBy, limit, onSnapshot } = await import('firebase/firestore');

      const env = getEnvironment();
      const q = query(
        collection(db, `users/${userId}_${env}/notifications`),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      unsubscribe = onSnapshot(q, async (snapshot) => {
        const next = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            timestamp: data.timestamp?.toMillis() || Date.now()
          } as Notification;
        });

        if (!isInitial) {
          for (const n of next) {
            if (!previousIds.has(n.id) && !n.read) {
              // Play beep sound for new notification
              playBeep();

              showModernToast(n, async () => {
                try {
                  const { doc, updateDoc, getDoc } = await import('firebase/firestore');
                  const docRef = doc(db, `users/${userId}_${env}/notifications/${n.id}`);
                  
                  // Check if document exists before updating
                  const docSnap = await getDoc(docRef);
                  if (docSnap.exists()) {
                    await updateDoc(docRef, { read: true });
                  }
                } catch (error: any) {
                  // Silently handle errors (document might have been deleted)
                  console.debug('Failed to mark notification as read:', error.message);
                }
              });

              setIsAnimating(true);
              setTimeout(() => setIsAnimating(false), 800);
            }
          }
        }

        previousIds = new Set(next.map(n => n.id));
        isInitial = false;
        setNotifications(next);
      });
    };

    setup();
    return () => unsubscribe?.();
  }, [userId]);

  // ✅ CLICK OUTSIDE CLOSE
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // ✅ ACTIONS
  const markAsRead = async (id: string) => {
    try {
      const db = await FirebaseUtil.getFirestore();
      const env = getEnvironment();
      const { doc, updateDoc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, `users/${userId}_${env}/notifications/${id}`);
      
      // Check if document exists before updating
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, { read: true });
      }
    } catch (error: any) {
      // Silently handle errors (document might have been deleted)
      console.debug('Failed to mark notification as read:', error.message);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const db = await FirebaseUtil.getFirestore();
      const env = getEnvironment();
      const { doc, deleteDoc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, `users/${userId}_${env}/notifications/${id}`);
      
      // Check if document exists before deleting
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await deleteDoc(docRef);
      }
    } catch (error: any) {
      // Silently handle errors (document might have been deleted)
      console.debug('Failed to delete notification:', error.message);
    }
  };

  const deleteAll = async () => {
    const db = await FirebaseUtil.getFirestore();
    const env = getEnvironment();
    const { writeBatch, collection, getDocs } = await import('firebase/firestore');

    const snapshot = await getDocs(collection(db, `users/${userId}_${env}/notifications`));
    const batch = writeBatch(db);
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (ts: number) =>
    formatDistanceToNow(new Date(ts), { addSuffix: true });

  return (
    <>
      {/* 🔔 BELL */}
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative ${className} ${isAnimating ? 'animate-pulse' : ''}`}
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 📦 PANEL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-black/20 pointer-events-auto" onClick={() => setIsOpen(false)} />

          <div
            ref={panelRef}
            className="absolute right-0 top-0 h-full w-[400px] bg-white shadow-xl pointer-events-auto"
          >
            {/* HEADER */}
            <div className="bg-[#041D76] text-white p-4 flex justify-between">
              <div className="flex gap-2 items-center">
                <Bell className="w-5 h-5" />
                <span className="font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex gap-3 items-center">
                {notifications.length > 0 && (
                  <button onClick={deleteAll} className="text-sm underline">Clear all</button>
                )}
                <button onClick={() => setIsOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* LIST */}
            <div className="h-[calc(100%-80px)] overflow-y-auto divide-y divide-gray-200">
              {notifications.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No notifications
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`group relative flex gap-3 p-4 hover:bg-gray-50 transition-colors ${n.read ? 'bg-white' : 'bg-blue-50/50'
                      }`}
                  >
                    {/* Content */}
                    <div
                      onClick={() => !n.read && markAsRead(n.id)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-sm leading-tight truncate flex-1 min-w-0 ${n.read ? 'font-normal text-gray-700' : 'font-semibold text-gray-900'}`}>
                          {n.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(n.id);
                          }}
                          className="flex-shrink-0 self-start mt-0.5 p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete notification"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1.5 leading-relaxed line-clamp-2">
                        {n.body}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-400">
                          {formatTime(n.timestamp)}
                        </span>
                        {!n.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(n.id);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationPanel;
