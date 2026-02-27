import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { Smartphone, CheckCircle2, Loader2, AlertCircle, History, X, Clock } from 'lucide-react';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { RechargeRequest } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const Recharge = () => {
  const { profile } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<RechargeRequest[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'recharges'),
      where('userId', '==', profile.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RechargeRequest));
      data.sort((a, b) => b.createdAt - a.createdAt);
      setHistory(data);
    });
    return unsubscribe;
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !mobileNumber || !amount) return;

    const rechargeAmount = Number(amount);
    if (rechargeAmount < 50) {
      alert('Minimum recharge amount is 50 BDT');
      return;
    }

    if (rechargeAmount > profile.walletBalance) {
      alert('Insufficient wallet balance');
      return;
    }

    setLoading(true);
    try {
      const bonus = rechargeAmount === 100 ? 10 : 0;

      await addDoc(collection(db, 'recharges'), {
        userId: profile.uid,
        userEmail: profile.email,
        mobileNumber,
        amount: rechargeAmount,
        bonus,
        status: 'pending',
        createdAt: Date.now(),
      });

      setCompleted(true);
      setMobileNumber('');
      setAmount('');
    } catch (error) {
      console.error(error);
      alert('Failed to submit recharge request');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="pb-24 pt-6 px-6 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mobile Recharge</h1>
          <p className="text-gray-500 text-sm">Recharge your mobile balance</p>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted</h2>
          <p className="text-gray-500 mb-8 px-4">Your recharge request is pending approval. It usually takes 5-15 minutes.</p>
          <div className="space-y-3">
            <Button onClick={() => setCompleted(false)} className="w-full">Submit Another</Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">Back to Dashboard</Button>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 bg-indigo-600 text-white border-none shadow-lg shadow-indigo-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Smartphone size={24} />
              </div>
              <div>
                <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider">Available Balance</p>
                <p className="text-2xl font-bold">{profile.walletBalance} BDT</p>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Mobile Number</h3>
            <input
              type="tel"
              required
              placeholder="01XXXXXXXXX"
              className="w-full px-4 py-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Amount (Min 50 BDT)</h3>
            <div className="relative">
              <input
                type="number"
                required
                min="50"
                placeholder="Enter amount"
                className="w-full px-4 py-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">BDT</span>
            </div>
            {Number(amount) === 100 && (
              <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> You will get 10 BDT bonus!
              </p>
            )}
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
            <AlertCircle className="text-amber-600 shrink-0" size={20} />
            <p className="text-xs text-amber-800 leading-relaxed">
              Recharge amount will be deducted from your wallet after admin approval. 
              Bonus will be added to your wallet if applicable.
            </p>
          </div>

          <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Request Recharge'}
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
                <h2 className="text-2xl font-bold text-gray-900">Recharge History</h2>
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
                  <p className="text-gray-500">No recharge history found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{item.amount} BDT</p>
                          <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                          item.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-y-2 text-xs border-t border-gray-50 pt-3">
                        <div>
                          <p className="text-gray-400 mb-0.5">Mobile Number</p>
                          <p className="font-semibold text-gray-700">{item.mobileNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-0.5">Bonus</p>
                          <p className="font-semibold text-emerald-600">+{item.bonus} BDT</p>
                        </div>
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

export default Recharge;
