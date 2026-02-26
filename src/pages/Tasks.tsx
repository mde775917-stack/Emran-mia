import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { PlayCircle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

const Tasks = () => {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  const MAX_VIDEOS = 5;
  const REWARD = 5;

  useEffect(() => {
    const fetchDailyTasks = async () => {
      if (!profile) return;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', profile.uid),
        where('type', '==', 'video'),
        where('timestamp', '>=', today.getTime())
      );

      const querySnapshot = await getDocs(q);
      setDailyCount(querySnapshot.size);
    };

    fetchDailyTasks();
  }, [profile]);

  const startAd = () => {
    if (dailyCount >= MAX_VIDEOS) return;
    setShowAd(true);
    setAdProgress(0);
    
    const duration = 15; // 15 seconds ad
    const interval = setInterval(() => {
      setAdProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (100 / (duration * 10));
      });
    }, 100);
  };

  const completeTask = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // Add task record
      await addDoc(collection(db, 'tasks'), {
        userId: profile.uid,
        type: 'video',
        amount: REWARD,
        timestamp: Date.now(),
      });

      // Update user wallet
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        walletBalance: increment(REWARD),
        videoEarnings: increment(REWARD),
      });

      await refreshProfile();
      setDailyCount(prev => prev + 1);
      setCompleted(true);
      setShowAd(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="pb-24 pt-6 px-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Video Tasks</h1>
        <p className="text-gray-500 text-sm">Watch ads and earn BDT</p>
      </header>

      <Card className="py-16 px-6 text-center flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
          <PlayCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-gray-500 max-w-[240px] mx-auto">
          Video earning will be available soon. Stay tuned for updates!
        </p>
      </Card>

      {/* Existing logic hidden for future activation */}
      <div className="hidden">
        <Card className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-500 font-medium">Daily Progress</p>
            <p className="text-2xl font-bold text-gray-900">{dailyCount} / {MAX_VIDEOS}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <PlayCircle size={24} />
          </div>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-emerald-600 h-full transition-all duration-500" 
            style={{ width: `${(dailyCount / MAX_VIDEOS) * 100}%` }}
          />
        </div>
      </Card>

      {!profile.isActive ? (
        <Card className="bg-amber-50 border-amber-100">
          <div className="flex gap-3">
            <AlertCircle className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">Your account must be activated by an admin to earn from tasks.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {Array.from({ length: MAX_VIDEOS }).map((_, i) => {
            const isCompleted = i < dailyCount;
            const isNext = i === dailyCount;

            return (
              <Card 
                key={i} 
                className={`flex justify-between items-center p-4 ${isCompleted ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    {isCompleted ? <CheckCircle2 size={20} /> : <PlayCircle size={20} />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Task #{i + 1}</p>
                    <p className="text-xs text-gray-500">Reward: {REWARD} BDT</p>
                  </div>
                </div>
                {isNext && (
                  <Button size="sm" onClick={startAd} disabled={loading}>
                    Watch
                  </Button>
                )}
                {isCompleted && (
                  <span className="text-xs font-bold text-emerald-600 uppercase">Completed</span>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showAd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-sm aspect-video bg-gray-900 rounded-2xl flex items-center justify-center relative overflow-hidden">
              <div className="text-white text-center">
                <PlayCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm font-medium">Video Ad Playing...</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-100" 
                  style={{ width: `${adProgress}%` }}
                />
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-white/60 text-sm mb-4">Please wait for the ad to finish</p>
              {adProgress >= 100 && (
                <Button onClick={completeTask} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Claim Reward'}
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {completed && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm"
          >
            <Card className="max-w-xs w-full text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Reward Claimed!</h3>
              <p className="text-gray-500 mt-2 mb-6">You've earned {REWARD} BDT from this task.</p>
              <Button onClick={() => setCompleted(false)} className="w-full">
                Awesome
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default Tasks;
