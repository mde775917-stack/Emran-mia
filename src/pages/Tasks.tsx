import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { PlayCircle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { handleReferralReward } from '../lib/referral';

const Tasks = () => {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isWatching, setIsWatching] = useState(false);

  const MAX_ADS = 10;
  const AD_REWARD = 0.5; // 0.5 BDT per ad
  const WATCH_DURATION = 15; // 15 seconds
  const COOLDOWN_DURATION = 20; // 20 seconds cooldown

  useEffect(() => {
    if (!profile) return;
    
    const today = new Date().toLocaleDateString();
    if (profile.lastAdDate !== today) {
      // Reset daily count if it's a new day
      const resetDailyCount = async () => {
        try {
          await updateDoc(doc(db, 'users', profile.uid), {
            dailyAdsCount: 0,
            lastAdDate: today
          });
          await refreshProfile();
        } catch (error) {
          console.error("Error resetting daily ads:", error);
        }
      };
      resetDailyCount();
    }
  }, [profile, refreshProfile]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleWatchAd = () => {
    if (!profile?.isActive) {
      alert("Your account must be activated to earn rewards.");
      return;
    }
    if ((profile.dailyAdsCount || 0) >= MAX_ADS) return;
    if (cooldown > 0) return;

    // Dynamically load and trigger Monetag OnClick script ONLY on button click
    try {
      const s = document.createElement('script');
      s.dataset.zone = '10873029';
      s.src = 'https://al5sm.com/tag.min.js';
      document.body.appendChild(s);
      
      // Cleanup script after a short delay or when ad is finished
      setTimeout(() => {
        if (s.parentNode) s.parentNode.removeChild(s);
      }, 5000);
    } catch (e) {
      console.error("Ad trigger error:", e);
    }

    setIsWatching(true);
    setAdProgress(0);
    
    const interval = setInterval(() => {
      setAdProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (100 / (WATCH_DURATION * 10));
      });
    }, 100);
  };

  const claimReward = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        walletBalance: increment(AD_REWARD),
        videoEarnings: increment(AD_REWARD),
        dailyAdsCount: increment(1),
        lastAdDate: new Date().toLocaleDateString()
      });

      // Log transaction
      await addDoc(collection(db, 'walletTransactions'), {
        userId: profile.uid,
        amount: AD_REWARD,
        type: 'credit',
        description: 'Ad Watch Reward',
        timestamp: Date.now()
      });

      await refreshProfile();
      
      // Handle referral reward on first task
      if (!profile.hasCompletedFirstTask) {
        await updateDoc(doc(db, 'users', profile.uid), { hasCompletedFirstTask: true });
        await handleReferralReward(profile.uid);
        await refreshProfile();
      }

      setCompleted(true);
      setIsWatching(false);
      setCooldown(COOLDOWN_DURATION);
    } catch (error) {
      console.error(error);
      alert("Error claiming reward. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  const currentAds = profile.dailyAdsCount || 0;

  return (
    <div className="pb-24 pt-6 px-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Video Tasks</h1>
        <p className="text-gray-500 text-sm">Watch ads and earn BDT</p>
      </header>

      <Card className="py-12 px-6 text-center flex flex-col items-center justify-center mb-6">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <PlayCircle size={40} />
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-500 font-medium mb-1">Today's Progress</p>
          <p className="text-3xl font-bold text-gray-900">{currentAds} / {MAX_ADS}</p>
          <p className="text-xs text-gray-400 mt-1">Ads Completed</p>
        </div>

        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-8 max-w-[200px]">
          <div 
            className="bg-emerald-600 h-full transition-all duration-500" 
            style={{ width: `${(currentAds / MAX_ADS) * 100}%` }}
          />
        </div>

        <p className="text-gray-600 text-sm mb-8">
          Watch ads and earn rewards. Each ad gives {AD_REWARD} BDT.
        </p>

        {currentAds >= MAX_ADS ? (
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl w-full">
            <p className="text-amber-700 text-sm font-medium">Daily limit reached. Come back tomorrow.</p>
          </div>
        ) : (
          <Button 
            onClick={handleWatchAd} 
            disabled={isWatching || cooldown > 0 || !profile.isActive}
            className="w-full py-4 text-lg"
          >
            {cooldown > 0 ? `Wait ${cooldown}s` : 'Watch Ads'}
          </Button>
        )}

        {!profile.isActive && (
          <p className="text-red-500 text-[10px] mt-4 font-bold uppercase tracking-wider">
            Account Activation Required
          </p>
        )}
      </Card>

      <AnimatePresence>
        {isWatching && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-sm aspect-video bg-gray-900 rounded-2xl flex items-center justify-center relative overflow-hidden">
              <div className="text-white text-center">
                <PlayCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm font-medium">Watching Ad...</p>
                <p className="text-xs text-white/40 mt-2">Do not close this screen</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-100" 
                  style={{ width: `${adProgress}%` }}
                />
              </div>
            </div>
            
            <div className="mt-8 text-center w-full max-w-xs">
              <p className="text-white/60 text-sm mb-6">Please wait for the ad to finish</p>
              {adProgress >= 100 && (
                <Button onClick={claimReward} disabled={loading} className="w-full py-4">
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
              <p className="text-gray-500 mt-2 mb-6">You've earned {AD_REWARD} BDT from this ad.</p>
              <Button onClick={() => setCompleted(false)} className="w-full">
                Awesome
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tasks;
