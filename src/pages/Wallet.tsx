import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle2, XCircle, Loader2, ReceiptText } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, increment, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { WithdrawRequest, WalletTransaction } from '../types';
import { motion } from 'motion/react';

const WalletPage = () => {
  const { profile, refreshProfile } = useAuth();
  const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  
  const [withdrawForm, setWithdrawForm] = useState({
    method: 'bKash' as 'bKash' | 'Nagad',
    number: '',
    amount: 500
  });
  const [submitting, setSubmitting] = useState(false);

  const MIN_WITHDRAW = 500;

  useEffect(() => {
    const fetchWithdraws = async () => {
      if (!profile) return;
      try {
        const q = query(
          collection(db, 'withdraws'),
          where('userId', '==', profile.uid)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawRequest));
        data.sort((a, b) => b.timestamp - a.timestamp);
        setWithdraws(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchWithdraws();

    const qTx = query(
      collection(db, 'walletTransactions'),
      where('userId', '==', profile.uid)
    );
    const unsubscribeTx = onSnapshot(qTx, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletTransaction));
      data.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(data);
    });

    return () => unsubscribeTx();
  }, [profile]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (withdrawForm.amount < MIN_WITHDRAW) {
      alert(`Minimum withdraw amount is ${MIN_WITHDRAW} BDT`);
      return;
    }
    if (withdrawForm.amount > profile.walletBalance) {
      alert('Insufficient balance');
      return;
    }

    setSubmitting(true);
    try {
      // Create request
      await addDoc(collection(db, 'withdraws'), {
        userId: profile.uid,
        userEmail: profile.email,
        method: withdrawForm.method,
        number: withdrawForm.number,
        amount: withdrawForm.amount,
        status: 'pending',
        timestamp: Date.now()
      });

      // Wallet balance must decrease only when status becomes "success" (handled by admin)
      // So we don't deduct here anymore.

      await refreshProfile();
      setShowWithdraw(false);
      alert('Withdraw request submitted successfully! Your balance will be deducted once approved.');
      
      // Refresh list
      const q = query(
        collection(db, 'withdraws'),
        where('userId', '==', profile.uid)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawRequest));
      data.sort((a, b) => b.timestamp - a.timestamp);
      setWithdraws(data);
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="pb-24 pt-6 px-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
        <p className="text-gray-500 text-sm">Manage your earnings and withdraws</p>
      </header>

      <Card className="bg-emerald-600 text-white mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider mb-2">Available Balance</p>
          <p className="text-4xl font-bold mb-6">{profile.walletBalance} BDT</p>
          <div className="space-y-3">
            <Button 
              variant="secondary" 
              className="w-full bg-white text-emerald-600 hover:bg-emerald-50"
              onClick={() => setShowWithdraw(true)}
            >
              Withdraw Funds
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-white/30 text-white hover:bg-white/10"
              onClick={() => setShowHistory(true)}
            >
              Withdraw History
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-white/30 text-white hover:bg-white/10"
              onClick={() => setShowTransactions(true)}
            >
              Transaction History
            </Button>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full" />
      </Card>

      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-white w-full max-w-md h-[80vh] rounded-t-[32px] sm:rounded-[32px] flex flex-col"
          >
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Withdraw History</h2>
              <button onClick={() => setShowHistory(false)} className="text-gray-400">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-emerald-600" />
                </div>
              ) : withdraws.length === 0 ? (
                <div className="text-center py-12">
                  <Clock size={48} className="text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500">No withdraw history yet</p>
                </div>
              ) : (
                withdraws.map((req) => (
                  <Card key={req.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          req.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 
                          req.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {req.status === 'success' ? <CheckCircle2 size={20} /> : 
                           req.status === 'rejected' ? <XCircle size={20} /> : <Clock size={20} />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{req.method} Withdraw</p>
                          <p className="text-xs text-gray-400">Acc: {req.number}</p>
                          <p className="text-xs text-gray-500">{new Date(req.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{req.amount} BDT</p>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${
                          req.status === 'success' ? 'text-emerald-600' : 
                          req.status === 'rejected' ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {req.status}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {showTransactions && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-white w-full max-w-md h-[80vh] rounded-t-[32px] sm:rounded-[32px] flex flex-col"
          >
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Transaction History</h2>
              <button onClick={() => setShowTransactions(false)} className="text-gray-400">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <ReceiptText size={48} className="text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500">No transactions yet</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <Card key={tx.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {tx.type === 'credit' ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{tx.description}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.type === 'credit' ? '+' : '-'}{tx.amount} BDT
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {showWithdraw && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Withdraw Funds</h2>
              <button onClick={() => setShowWithdraw(false)} className="text-gray-400">✕</button>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Method</label>
                <div className="grid grid-cols-2 gap-4">
                  {['bKash', 'Nagad'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setWithdrawForm({...withdrawForm, method: m as any})}
                      className={`py-3 rounded-xl border font-bold transition-colors ${withdrawForm.method === m ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-200 text-gray-500'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{withdrawForm.method} Number</label>
                <input
                  type="tel"
                  required
                  placeholder="01XXXXXXXXX"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  value={withdrawForm.number}
                  onChange={e => setWithdrawForm({...withdrawForm, number: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (Min {MIN_WITHDRAW} BDT)</label>
                <input
                  type="number"
                  required
                  min={MIN_WITHDRAW}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  value={withdrawForm.amount}
                  onChange={e => setWithdrawForm({...withdrawForm, amount: parseInt(e.target.value)})}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Current Balance</span>
                  <span className="font-bold">{profile.walletBalance} BDT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Remaining Balance</span>
                  <span className="font-bold text-emerald-600">{profile.walletBalance - withdrawForm.amount} BDT</span>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin mx-auto" /> : 'Submit Request'}
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
