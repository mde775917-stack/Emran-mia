import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { Users, ShoppingBag, CreditCard, Check, X, Loader2, ShieldCheck, UserMinus, UserPlus, Wallet, ExternalLink } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, increment, where } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, WithdrawRequest, Product, TopupRequest } from '../types';

const Admin = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'withdraws' | 'products' | 'topups'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([]);
  const [topups, setTopups] = useState<TopupRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.isAdmin) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'users') {
          const q = query(collection(db, 'users'));
          const snap = await getDocs(q);
          setUsers(snap.docs.map(doc => doc.data() as UserProfile));
        } else if (activeTab === 'withdraws') {
          const q = query(collection(db, 'withdraws'), where('status', '==', 'pending'));
          const snap = await getDocs(q);
          setWithdraws(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawRequest)));
        } else if (activeTab === 'topups') {
          const q = query(collection(db, 'topups'), where('status', '==', 'pending'));
          const snap = await getDocs(q);
          setTopups(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TopupRequest)));
        }
      } catch (error: any) {
        console.error("Admin fetch error:", error);
        if (error.code === 'permission-denied') {
          alert('Permission Denied: Make sure your account has isAdmin: true in Firestore and rules are updated.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, profile]);

  const toggleUserStatus = async (uid: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userToUpdate = users.find(u => u.uid === uid);
      
      if (!currentStatus && userToUpdate && userToUpdate.referralPending > 0) {
        // Activating user: move pending to wallet
        await updateDoc(userRef, { 
          isActive: true,
          walletBalance: increment(userToUpdate.referralPending),
          referralPending: 0
        });
        setUsers(users.map(u => u.uid === uid ? { 
          ...u, 
          isActive: true, 
          walletBalance: u.walletBalance + u.referralPending,
          referralPending: 0 
        } : u));
      } else {
        await updateDoc(userRef, { isActive: !currentStatus });
        setUsers(users.map(u => u.uid === uid ? { ...u, isActive: !currentStatus } : u));
      }
    } catch (error) {
      alert('Error updating user');
    }
  };

  const handleWithdraw = async (id: string, userId: string, amount: number, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'withdraws', id), { status });
      if (status === 'rejected') {
        // Refund wallet
        await updateDoc(doc(db, 'users', userId), { walletBalance: increment(amount) });
      }
      setWithdraws(withdraws.filter(w => w.id !== id));
      alert(`Withdraw ${status}`);
    } catch (error) {
      alert('Error processing withdraw');
    }
  };

  const handleTopup = async (id: string, userId: string, amount: number, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'topups', id), { status });
      if (status === 'approved') {
        await updateDoc(doc(db, 'users', userId), { walletBalance: increment(amount) });
      }
      setTopups(topups.filter(t => t.id !== id));
      alert(`Topup ${status}`);
    } catch (error) {
      alert('Error processing topup');
    }
  };

  if (!profile?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <ShieldCheck size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-gray-500 mt-2">You do not have administrator privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-6 px-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 text-sm">Manage users, products and requests</p>
      </header>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'users', label: 'Users', icon: Users },
          { id: 'withdraws', label: 'Withdraws', icon: CreditCard },
          { id: 'topups', label: 'Topups', icon: Wallet },
          { id: 'products', label: 'Products', icon: ShoppingBag },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border border-gray-100'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'users' && users.map((u) => (
            <Card key={u.uid} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-900">{u.displayName}</h4>
                  <p className="text-xs text-gray-500">{u.email}</p>
                  <p className="text-xs font-bold text-emerald-600 mt-1">Wallet: {u.walletBalance} BDT</p>
                </div>
                <Button 
                  variant={u.isActive ? 'outline' : 'primary'} 
                  className="py-2 px-4 text-xs"
                  onClick={() => toggleUserStatus(u.uid, u.isActive)}
                >
                  {u.isActive ? <UserMinus size={16} className="mr-1 inline" /> : <UserPlus size={16} className="mr-1 inline" />}
                  {u.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))}

          {activeTab === 'withdraws' && withdraws.length === 0 && (
            <p className="text-center text-gray-500 py-12">No pending withdraw requests</p>
          )}

          {activeTab === 'withdraws' && withdraws.map((w) => (
            <Card key={w.id} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-gray-900">{w.method} - {w.amount} BDT</h4>
                  <p className="text-xs text-gray-500">Number: {w.number}</p>
                  <p className="text-xs text-gray-500">User: {w.userEmail}</p>
                </div>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-1 rounded-full uppercase">Pending</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="py-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => handleWithdraw(w.id, w.userId, w.amount, 'rejected')}
                >
                  <X size={16} className="mr-1 inline" /> Reject
                </Button>
                <Button 
                  className="py-2 text-xs"
                  onClick={() => handleWithdraw(w.id, w.userId, w.amount, 'approved')}
                >
                  <Check size={16} className="mr-1 inline" /> Approve
                </Button>
              </div>
            </Card>
          ))}

          {activeTab === 'topups' && topups.length === 0 && (
            <p className="text-center text-gray-500 py-12">No pending topup requests</p>
          )}

          {activeTab === 'topups' && topups.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-gray-900">{t.method} - {t.amount} BDT</h4>
                  <p className="text-xs text-gray-500">User: {t.userEmail}</p>
                  <a 
                    href={t.screenshotUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-emerald-600 text-xs font-bold flex items-center gap-1 mt-2"
                  >
                    View Screenshot <ExternalLink size={12} />
                  </a>
                </div>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-1 rounded-full uppercase">Pending</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="py-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => handleTopup(t.id, t.userId, t.amount, 'rejected')}
                >
                  <X size={16} className="mr-1 inline" /> Reject
                </Button>
                <Button 
                  className="py-2 text-xs"
                  onClick={() => handleTopup(t.id, t.userId, t.amount, 'approved')}
                >
                  <Check size={16} className="mr-1 inline" /> Approve
                </Button>
              </div>
            </Card>
          ))}

          {activeTab === 'products' && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Product management coming soon</p>
              <Button>Add New Product</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
