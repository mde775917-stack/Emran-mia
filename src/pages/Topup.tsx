import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { CreditCard, CheckCircle2, Loader2, AlertCircle, History, X, Clock, CheckCircle } from 'lucide-react';
import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { TopupRequest } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const Topup = () => {
  const { profile } = useAuth();
  const [amount, setAmount] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [method, setMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<TopupRequest[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'topups'),
      where('userId', '==', profile.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TopupRequest));
      data.sort((a, b) => b.createdAt - a.createdAt);
      setHistory(data);
    });
    return unsubscribe;
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !amount || !senderNumber || !transactionId) return;

    setLoading(true);
    try {
      // 1. Create topup request
      await addDoc(collection(db, 'topups'), {
        userId: profile.uid,
        userEmail: profile.email,
        amount: Number(amount),
        method,
        senderNumber,
        transactionId,
        status: 'pending',
        createdAt: Date.now(),
        timestamp: Date.now(),
      });

      setCompleted(true);
      setAmount('');
      setSenderNumber('');
      setTransactionId('');
    } catch (error) {
      console.error(error);
      alert('Failed to submit topup request');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="pb-24 pt-6 px-6 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Topup Wallet</h1>
          <p className="text-gray-500 text-sm">Add money to your wallet balance</p>
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
          <p className="text-gray-500 mb-8 px-4">Your topup request is pending approval. It usually takes 30-60 minutes.</p>
          <div className="space-y-3">
            <Button onClick={() => setCompleted(false)} className="w-full">Submit Another</Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">Back to Dashboard</Button>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 bg-emerald-600 text-white border-none shadow-lg shadow-emerald-100">
            <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-2">Official Payment Numbers</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-emerald-100 text-sm font-medium">bKash:</span>
                <span className="text-xl font-bold tracking-tight">01320512829</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-100 text-sm font-medium">Nagad:</span>
                <span className="text-xl font-bold tracking-tight">01741678162</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase">Personal</span>
            </div>
          </Card>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">1. Select Method</h3>
            <div className="grid grid-cols-2 gap-4">
              {['bKash', 'Nagad'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m as any)}
                  className={`py-4 rounded-2xl border-2 font-bold transition-all ${
                    method === m ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-gray-100 bg-white text-gray-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">2. Enter Amount</h3>
            <div className="relative">
              <input
                type="number"
                required
                placeholder="Enter amount in BDT"
                className="w-full px-4 py-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">BDT</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">3. Sender Number</h3>
            <input
              type="text"
              required
              placeholder="Enter your sender number"
              className="w-full px-4 py-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold"
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">4. Transaction ID</h3>
            <input
              type="text"
              required
              placeholder="Enter Transaction ID"
              className="w-full px-4 py-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
            <AlertCircle className="text-amber-600 shrink-0" size={20} />
            <p className="text-xs text-amber-800 leading-relaxed">
              Send money to the number above first, then submit this form with the Transaction ID. 
              Incorrect information may lead to account suspension.
            </p>
          </div>

          <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Submit Topup Request'}
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
                <h2 className="text-2xl font-bold text-gray-900">Topup History</h2>
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
                  <p className="text-gray-500">No topup history found</p>
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
                          <p className="text-gray-400 mb-0.5">Method</p>
                          <p className="font-semibold text-gray-700">{item.method}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-0.5">Sender</p>
                          <p className="font-semibold text-gray-700">{item.senderNumber}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-400 mb-0.5">Transaction ID</p>
                          <p className="font-mono font-semibold text-gray-700 break-all">{item.transactionId}</p>
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

export default Topup;
