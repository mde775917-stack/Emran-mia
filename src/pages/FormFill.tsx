import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

const FormFill = () => {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    feedback: '',
    rating: '5'
  });

  const MAX_FORMS = 7;
  const REWARD = 2;

  useEffect(() => {
    const fetchDailyForms = async () => {
      if (!profile) return;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', profile.uid),
        where('type', '==', 'form'),
        where('timestamp', '>=', today.getTime())
      );

      const querySnapshot = await getDocs(q);
      setDailyCount(querySnapshot.size);
    };

    fetchDailyForms();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || dailyCount >= MAX_FORMS) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        userId: profile.uid,
        type: 'form',
        amount: REWARD,
        timestamp: Date.now(),
        data: formData
      });

      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        walletBalance: increment(REWARD),
        formEarnings: increment(REWARD),
      });

      await refreshProfile();
      setDailyCount(prev => prev + 1);
      setCompleted(true);
      setShowForm(false);
      setFormData({ name: '', feedback: '', rating: '5' });
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
        <h1 className="text-2xl font-bold text-gray-900">Daily Forms</h1>
        <p className="text-gray-500 text-sm">Fill simple forms and earn BDT</p>
      </header>

      <Card className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-500 font-medium">Daily Progress</p>
            <p className="text-2xl font-bold text-gray-900">{dailyCount} / {MAX_FORMS}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <FileText size={24} />
          </div>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-500" 
            style={{ width: `${(dailyCount / MAX_FORMS) * 100}%` }}
          />
        </div>
      </Card>

      {!profile.isActive ? (
        <Card className="bg-amber-50 border-amber-100">
          <div className="flex gap-3">
            <AlertCircle className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">Your account must be activated by an admin to earn from forms.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {dailyCount < MAX_FORMS ? (
            <Button onClick={() => setShowForm(true)} className="w-full py-4 flex items-center justify-center gap-2">
              <FileText size={20} /> Start Next Form
            </Button>
          ) : (
            <Card className="text-center py-8">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900">All Done!</h3>
              <p className="text-gray-500 text-sm">You've completed all forms for today.</p>
            </Card>
          )}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 bg-white z-[100] p-6 overflow-y-auto"
          >
            <div className="max-w-md mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Daily Feedback Form</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">How was your experience today?</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.feedback}
                    onChange={e => setFormData({...formData, feedback: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5)</label>
                  <div className="flex gap-4">
                    {[1,2,3,4,5].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormData({...formData, rating: num.toString()})}
                        className={`flex-1 py-3 rounded-xl border font-bold transition-colors ${formData.rating === num.toString() ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 text-gray-500'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Submit & Earn 2 BDT'}
                </Button>
              </form>
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
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Form Submitted!</h3>
              <p className="text-gray-500 mt-2 mb-6">You've earned {REWARD} BDT.</p>
              <Button onClick={() => setCompleted(false)} className="w-full">
                Continue
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FormFill;
