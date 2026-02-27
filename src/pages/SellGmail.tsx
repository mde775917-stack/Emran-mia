import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { Mail, CheckCircle2, Loader2, AlertCircle, History, X, Clock, Key } from 'lucide-react';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { GmailSaleRequest } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const SellGmail = () => {
  const { profile } = useAuth();
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<GmailSaleRequest[]>([]);
  const navigate = useNavigate();

  const REWARD = 9;

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'gmailSales'),
      where('userId', '==', profile.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GmailSaleRequest));
      data.sort((a, b) => b.createdAt - a.createdAt);
      setHistory(data);
    });
    return unsubscribe;
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !gmail || !password) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'gmailSales'), {
        userId: profile.uid,
        userEmail: profile.email,
        gmail,
        password,
        reward: REWARD,
        status: 'pending',
        createdAt: Date.now(),
      });

      setCompleted(true);
      setGmail('');
      setPassword('');
    } catch (error) {
      console.error(error);
      alert('Failed to submit Gmail sale request');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="pb-24 pt-6 px-6 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sell Gmail</h1>
          <p className="text-gray-500 text-sm">Earn by selling your Gmail accounts</p>
        </div>
        <button 
          onClick={() => setShowHistory(true)}
          className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-emerald-600 shadow-sm hover:bg-emerald-50 transition-colors"
        >
          <History size={24} />
        </button>
      </header>

      {completed ? (
        <Card className="text-center py-12">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Submitted Successfully</h2>
          <p className="text-gray-500 mb-8 px-4">Your Gmail account has been submitted for review. Reward will be added after approval.</p>
          <div className="space-y-3">
            <Button onClick={() => setCompleted(false)} className="w-full">Submit Another</Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">Back to Dashboard</Button>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 bg-emerald-600 text-white border-none shadow-lg shadow-emerald-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Reward per Gmail</p>
                <p className="text-2xl font-bold">{REWARD} BDT</p>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Gmail Address</h3>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="example@gmail.com"
                className="w-full px-4 py-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-medium"
                value={gmail}
                onChange={(e) => setGmail(e.target.value)}
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Password</h3>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Enter Gmail password"
                className="w-full px-4 py-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
            <AlertCircle className="text-blue-600 shrink-0" size={20} />
            <p className="text-xs text-blue-800 leading-relaxed font-medium">
              Earn {REWARD} BDT for each Gmail submitted. Ensure the details are correct. Admin will verify before approving the reward.
            </p>
          </div>

          <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mx-auto" /> : `Submit & Earn ${REWARD} BDT`}
          </Button>
        </form>
      )}

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 bg-white z-[100] overflow-y-auto"
          >
            <div className="p-6 max-w-md mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Gmail Sales History</h2>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <Clock size={32} />
                  </div>
                  <p className="text-gray-500">No submissions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-gray-900 text-sm truncate max-w-[180px]">{item.gmail}</p>
                          <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                          item.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                        <p className="text-xs text-gray-400">Reward</p>
                        <p className="font-bold text-emerald-600 text-sm">+{item.reward} BDT</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SellGmail;
