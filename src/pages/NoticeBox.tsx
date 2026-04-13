import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI';
import { Bell, ArrowLeft, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { collection, query, getDocs, doc, setDoc, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Notice, NoticeStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const NoticeBox = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [readStatus, setReadStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;

    // Fetch notices
    const fetchNotices = async () => {
      try {
        // We need to fetch both 'all' and 'single' notices
        // Firestore doesn't support OR queries across different fields easily in a single query with orderBy
        // So we'll fetch 'all' and 'single' separately or fetch all recent and filter client-side
        // Given the volume, client-side filtering of recent notices is fine
        const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(50));
        
        const unsubscribeNotices = onSnapshot(q, (snap) => {
          const allNotices = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
          const filtered = allNotices.filter(n => n.targetType === 'all' || n.targetUserId === profile.eeId);
          setNotices(filtered);
          setLoading(false);
        });

        // Fetch read status
        const statusQ = query(collection(db, `users/${user.uid}/noticeStatus`));
        const unsubscribeStatus = onSnapshot(statusQ, (snap) => {
          const statusMap: Record<string, boolean> = {};
          snap.docs.forEach(doc => {
            statusMap[doc.id] = doc.data().isRead;
          });
          setReadStatus(statusMap);
        });

        return () => {
          unsubscribeNotices();
          unsubscribeStatus();
        };
      } catch (error) {
        console.error("Error fetching notices:", error);
        setLoading(false);
      }
    };

    fetchNotices();
  }, [user, profile]);

  const markAsRead = async (noticeId: string) => {
    if (!user || readStatus[noticeId]) return;

    try {
      await setDoc(doc(db, `users/${user.uid}/noticeStatus`, noticeId), {
        isRead: true,
        readAt: Date.now()
      });
    } catch (error) {
      console.error("Error marking notice as read:", error);
    }
  };

  return (
    <div className="pb-24 pt-6 px-6 bg-gray-50 min-h-screen">
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-xl border border-gray-100 text-gray-600 shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notice Box</h1>
          <p className="text-gray-500 text-sm">Stay updated with latest news</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : notices.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Notices</h3>
          <p className="text-gray-500">You don't have any notices at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => {
            const isRead = readStatus[notice.id];
            return (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => markAsRead(notice.id)}
              >
                <Card className={`p-5 transition-all cursor-pointer border-l-4 ${isRead ? 'border-l-gray-200' : 'border-l-emerald-500 bg-emerald-50/30'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      {isRead ? (
                        <CheckCircle2 size={16} className="text-gray-400" />
                      ) : (
                        <Circle size={16} className="text-emerald-500 fill-emerald-500" />
                      )}
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isRead ? 'text-gray-400' : 'text-emerald-600'}`}>
                        {isRead ? 'Read' : 'New Notice'}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed ${isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                    {notice.message}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NoticeBox;
