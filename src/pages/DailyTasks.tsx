import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { Globe, CheckCircle2, ArrowLeft, Loader2, ExternalLink } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DailyTaskSettings, UserDailyTask } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { handleReferralReward } from '../lib/referral';
import { MAINTENANCE_MODE } from '../constants';
import { Lock } from 'lucide-react';

const DailyTasks = () => {
  const { profile, user, refreshProfile } = useAuth();
  const isCeo = profile?.role === 'ceo' || profile?.eeId === 'ES-863355';
  const isRestricted = MAINTENANCE_MODE && !isCeo;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<DailyTaskSettings>({
    websiteLink: 'https://emran4839.blogspot.com/2026/04/alhamdulillah.html',
    rewardAmount: 1.4
  });
  const [userProgress, setUserProgress] = useState<UserDailyTask | null>(null);
  const [claiming, setClaiming] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch Settings
        const settingsDoc = await getDoc(doc(db, 'dailyTaskSettings', 'global'));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as DailyTaskSettings);
        }

        // Fetch User Progress
        const progressDoc = await getDoc(doc(db, 'dailyTasks', user.uid));
        const today = new Date().toISOString().split('T')[0];

        if (progressDoc.exists()) {
          const data = progressDoc.data() as UserDailyTask;
          if (data.lastCompletedDate !== today) {
            // Reset for new day
            const resetData = {
              ...data,
              completedTasks: [],
              lastCompletedDate: today
            };
            await setDoc(doc(db, 'dailyTasks', user.uid), resetData);
            setUserProgress(resetData);
          } else {
            setUserProgress(data);
          }
        } else {
          // Initialize progress
          const newData: UserDailyTask = {
            userId: user.uid,
            completedTasks: [],
            lastCompletedDate: today,
            totalEarned: 0
          };
          await setDoc(doc(db, 'dailyTasks', user.uid), newData);
          setUserProgress(newData);
        }
      } catch (error) {
        console.error("Error fetching daily tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleTaskClick = async (taskId: number) => {
    if (!user || !profile || !userProgress || userProgress.completedTasks.includes(taskId)) return;

    if (isRestricted) {
      alert("সাময়িক সমস্যার কারণে সাইটটি বন্ধ রয়েছে");
      return;
    }
    
    setClaiming(taskId);
    try {
      // Open link in new tab
      window.open(settings.websiteLink, '_blank');

      // Update progress in Firestore
      const updatedTasks = [...userProgress.completedTasks, taskId];
      const userRef = doc(db, 'users', user.uid);
      const progressRef = doc(db, 'dailyTasks', user.uid);

      await updateDoc(progressRef, {
        completedTasks: updatedTasks,
        totalEarned: increment(settings.rewardAmount)
      });

      await updateDoc(userRef, {
        walletBalance: increment(settings.rewardAmount)
      });

      // Log transaction
      await addDoc(collection(db, 'walletTransactions'), {
        userId: user.uid,
        amount: settings.rewardAmount,
        type: 'credit',
        description: `Daily Task: Website Visit ${taskId}`,
        timestamp: Date.now()
      });

      // Handle referral reward on first task
      if (!profile.hasCompletedFirstTask) {
        await updateDoc(doc(db, 'users', user.uid), { hasCompletedFirstTask: true });
        await handleReferralReward(user.uid);
        await refreshProfile();
      }

      setUserProgress({
        ...userProgress,
        completedTasks: updatedTasks,
        totalEarned: userProgress.totalEarned + settings.rewardAmount
      });

      await refreshProfile();
    } catch (error) {
      console.error("Error completing task:", error);
      alert("Failed to complete task. Please try again.");
    } finally {
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Daily Tasks</h1>
          <p className="text-gray-500 text-sm">Visit websites and earn rewards</p>
        </div>
      </header>

      <Card className="mb-6 bg-emerald-600 text-white border-none shadow-lg shadow-emerald-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider mb-1">Today's Earnings</p>
            <p className="text-3xl font-bold">{(userProgress?.completedTasks.length || 0) * settings.rewardAmount} BDT</p>
          </div>
          <div className="text-right">
            <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider mb-1">Progress</p>
            <p className="text-xl font-bold">{userProgress?.completedTasks.length || 0} / 5</p>
          </div>
        </div>
        <div className="mt-4 w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-white h-full transition-all duration-500" 
            style={{ width: `${((userProgress?.completedTasks.length || 0) / 5) * 100}%` }}
          />
        </div>
      </Card>

      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((taskId) => {
          const isCompleted = userProgress?.completedTasks.includes(taskId);
          const isClaiming = claiming === taskId;

          return (
            <motion.div
              key={taskId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: taskId * 0.1 }}
            >
              <Card className={`p-4 flex justify-between items-center ${isCompleted ? 'bg-gray-50 border-gray-100' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                    {isCompleted ? <CheckCircle2 size={24} /> : <Globe size={24} />}
                  </div>
                  <div>
                    <h3 className={`font-bold ${isCompleted ? 'text-gray-400' : 'text-gray-900'}`}>Website Visit {taskId}</h3>
                    <p className="text-xs text-gray-500">Reward: {settings.rewardAmount} BDT</p>
                  </div>
                </div>
                
                {isCompleted ? (
                  <span className="px-4 py-2 bg-gray-100 text-gray-400 rounded-xl text-xs font-bold uppercase tracking-wider">
                    Completed
                  </span>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => {
                      if (isRestricted) {
                        alert("সাময়িক সমস্যার কারণে সাইটটি বন্ধ রয়েছে");
                        return;
                      }
                      handleTaskClick(taskId);
                    }}
                    disabled={isClaiming || isRestricted}
                    className="flex items-center gap-2"
                  >
                    {isClaiming ? <Loader2 size={16} className="animate-spin" /> : isRestricted ? <Lock size={16} /> : <ExternalLink size={16} />}
                    {isRestricted ? 'Locked' : 'Visit'}
                  </Button>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Globe size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900">How it works?</p>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              Click on "Visit" button, it will open a website. Once you visit the site, your task will be marked as completed and reward will be added to your wallet instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyTasks;
