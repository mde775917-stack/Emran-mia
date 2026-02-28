import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { Shield, Users, FileText, Loader2, UserPlus, UserMinus, Clock, Search, CreditCard, Wallet, Smartphone, Mail, ShoppingBag, BarChart3, ChevronRight, ArrowLeft, Filter, Calendar } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, ActivationLog, AdminLog, WithdrawRequest, TopupRequest, RechargeRequest, GmailSaleRequest, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';

type CEOTab = 'admins' | 'users' | 'withdraws' | 'topups' | 'recharges' | 'gmailSales' | 'products' | 'adminActivity';

const CEOPanel = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<CEOTab>('admins');
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([]);
  const [topups, setTopups] = useState<TopupRequest[]>([]);
  const [recharges, setRecharges] = useState<RechargeRequest[]>([]);
  const [gmailSales, setGmailSales] = useState<GmailSaleRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Admin Activity Stats
  const [adminStats, setAdminStats] = useState<any[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<UserProfile | null>(null);
  const [selectedAdminLogs, setSelectedAdminLogs] = useState<AdminLog[]>([]);

  // Filtering
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string, end: string }>({ start: '', end: '' });

  useEffect(() => {
    if (profile?.eeId !== 'ES-556378') return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'admins') {
          const q = query(collection(db, 'users'), where('role', '==', 'admin'));
          const snap = await getDocs(q);
          setAdmins(snap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile)));

          const uq = query(collection(db, 'users'), where('role', '==', 'user'), limit(50));
          const usnap = await getDocs(uq);
          setAllUsers(usnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile)));
        } else if (activeTab === 'users') {
          const q = query(collection(db, 'users'), limit(100));
          const snap = await getDocs(q);
          setAllUsers(snap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile)));
        } else if (activeTab === 'withdraws') {
          const q = query(collection(db, 'withdraws'), orderBy('timestamp', 'desc'), limit(100));
          const snap = await getDocs(q);
          setWithdraws(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawRequest)));
        } else if (activeTab === 'topups') {
          const q = query(collection(db, 'topups'), orderBy('createdAt', 'desc'), limit(100));
          const snap = await getDocs(q);
          setTopups(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TopupRequest)));
        } else if (activeTab === 'recharges') {
          const q = query(collection(db, 'recharges'), orderBy('createdAt', 'desc'), limit(100));
          const snap = await getDocs(q);
          setRecharges(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RechargeRequest)));
        } else if (activeTab === 'gmailSales') {
          const q = query(collection(db, 'gmailSales'), orderBy('createdAt', 'desc'), limit(100));
          const snap = await getDocs(q);
          setGmailSales(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as GmailSaleRequest)));
        } else if (activeTab === 'products') {
          const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        } else if (activeTab === 'adminActivity') {
          // Fetch all admins first
          const adminQ = query(collection(db, 'users'), where('role', '==', 'admin'));
          const adminSnap = await getDocs(adminQ);
          const adminList = adminSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
          setAdmins(adminList);

          // Fetch all logs to calculate stats
          const logsQ = query(collection(db, 'adminLogs'), orderBy('timestamp', 'desc'));
          const logsSnap = await getDocs(logsQ);
          const allLogs = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminLog));
          setAdminLogs(allLogs);

          // Calculate stats for each admin
          const stats = adminList.map(admin => {
            const logs = allLogs.filter(l => l.adminId === admin.uid);
            return {
              adminId: admin.uid,
              adminName: admin.displayName || "",
              adminEmail: admin.email || "",
              successCount: logs.filter(l => (l.status || "").toLowerCase() === 'success').length,
              unsuccessCount: logs.filter(l => (l.status || "").toLowerCase() === 'unsuccess').length,
              lastActivity: logs.length > 0 ? logs[0].timestamp : null,
              adminProfile: admin
            };
          });
          setAdminStats(stats);
        }
      } catch (error) {
        console.error("CEO Panel fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, profile]);

  const fetchAdminHistory = async (admin: UserProfile) => {
    setLoading(true);
    setSelectedAdmin(admin);
    try {
      const q = query(collection(db, 'adminLogs'), where('adminId', '==', admin.uid), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminLog));
      setSelectedAdminLogs(logs);
    } catch (error) {
      console.error("Error fetching admin history:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (uid: string, newRole: 'user' | 'admin') => {
    if (profile?.eeId !== 'ES-556378') return;
    setProcessing(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { 
        role: newRole,
        isAdmin: newRole === 'admin'
      });
      
      alert(`User role updated to ${newRole}`);
      // Refresh admins list if on admins tab
      if (activeTab === 'admins') {
        const q = query(collection(db, 'users'), where('role', '==', 'admin'));
        const snap = await getDocs(q);
        setAdmins(snap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile)));
      }
    } catch (error) {
      alert('Error updating role');
    } finally {
      setProcessing(null);
    }
  };

  const filteredLogs = selectedAdminLogs.filter(log => {
    const matchesAction = filterAction === 'all' || (log.actionType || "").toLowerCase().includes((filterAction || "").toLowerCase());
    const matchesStatus = filterStatus === 'all' || (log.status || "").toLowerCase() === (filterStatus || "").toLowerCase();
    
    let matchesDate = true;
    if (dateRange.start) {
      matchesDate = matchesDate && log.timestamp >= new Date(dateRange.start).getTime();
    }
    if (dateRange.end) {
      matchesDate = matchesDate && log.timestamp <= new Date(dateRange.end).getTime() + 86400000;
    }

    return matchesAction && matchesStatus && matchesDate;
  });

  if (profile?.eeId !== 'ES-556378') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <Shield size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">CEO Access Only</h1>
          <p className="text-gray-500 mt-2">This panel is restricted to the Superadmin.</p>
        </div>
      </div>
    );
  }

  if (selectedAdmin) {
    const stats = {
      success: selectedAdminLogs.filter(l => (l.status || "").toLowerCase() === 'success').length,
      unsuccess: selectedAdminLogs.filter(l => (l.status || "").toLowerCase() === 'unsuccess').length,
      activations: selectedAdminLogs.filter(l => (l.actionType || "").toLowerCase() === 'activation_success').length,
      withdraws: selectedAdminLogs.filter(l => (l.actionType || "").toLowerCase() === 'withdraw_success').length,
      topups: selectedAdminLogs.filter(l => (l.actionType || "").toLowerCase() === 'topup_success').length,
      recharges: selectedAdminLogs.filter(l => (l.actionType || "").toLowerCase() === 'recharge_success').length,
    };

    return (
      <div className="pb-24 pt-6 px-6 bg-gray-50 min-h-screen">
        <button 
          onClick={() => setSelectedAdmin(null)}
          className="flex items-center gap-2 text-gray-500 mb-6 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} /> Back to CEO Panel
        </button>

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{(selectedAdmin.displayName || "")}'s Activity</h1>
          <p className="text-gray-500 text-sm">{selectedAdmin.email || ""}</p>
        </header>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="p-4 bg-emerald-50 border-emerald-100">
            <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider mb-1">Total Success</p>
            <p className="text-2xl font-bold text-emerald-700">{stats.success}</p>
          </Card>
          <Card className="p-4 bg-red-50 border-red-100">
            <p className="text-[10px] text-red-600 uppercase font-bold tracking-wider mb-1">Total Unsuccess</p>
            <p className="text-2xl font-bold text-red-700">{stats.unsuccess}</p>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { label: 'Activations', value: stats.activations, color: 'text-blue-600' },
            { label: 'Withdraws', value: stats.withdraws, color: 'text-purple-600' },
            { label: 'Topups', value: stats.topups, color: 'text-amber-600' },
            { label: 'Recharges', value: stats.recharges, color: 'text-pink-600' },
          ].map(stat => (
            <Card key={stat.label} className="p-3">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-2 mb-4 text-gray-900 font-bold">
            <Filter size={18} /> Filters
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Action Type</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none"
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                >
                  <option value="all">All Actions</option>
                  <option value="activation">Activation</option>
                  <option value="withdraw">Withdraw</option>
                  <option value="topup">Topup</option>
                  <option value="recharge">Recharge</option>
                  <option value="gmail_sale">Gmail Sale</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Status</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="unsuccess">Unsuccess</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Start Date</label>
                <input 
                  type="date" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">End Date</label>
                <input 
                  type="date" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-emerald-600" size={32} />
            </div>
          ) : filteredLogs.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No logs found for this filter</p>
          ) : (
            filteredLogs.map(log => (
              <Card key={log.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">
                      {(log.actionType || "").replace('_', ' ')}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">Target UID: {log.targetUserId || ""}</p>
                    <p className="text-[10px] text-gray-400">Request ID: {log.requestId || ""}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${(log.status || "").toLowerCase() === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {log.status || ""}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-2">{new Date(log.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  const tabs: { id: CEOTab, label: string, icon: any }[] = [
    { id: 'admins', label: 'Admins', icon: Shield },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'withdraws', label: 'Withdraws', icon: CreditCard },
    { id: 'topups', label: 'Topups', icon: Wallet },
    { id: 'recharges', label: 'Recharges', icon: Smartphone },
    { id: 'gmailSales', label: 'Gmail Sales', icon: Mail },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'adminActivity', label: 'Activity', icon: BarChart3 },
  ];

  return (
    <div className="pb-24 pt-6 px-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">CEO Panel</h1>
        <p className="text-gray-500 text-sm">System-wide administrative controls</p>
      </header>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-gray-600 border border-gray-100'
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
          {activeTab === 'admins' && (
            <div className="space-y-6">
              <section>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield size={18} className="text-emerald-600" />
                  Current Admins
                </h3>
                <div className="space-y-3">
                  {admins.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No admins found</p>
                  ) : (
                    admins.map(admin => (
                      <Card key={admin.uid} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-900">{admin.displayName}</p>
                            <p className="text-xs text-gray-500">{admin.email}</p>
                            <p className="text-[10px] text-emerald-600 font-bold mt-1">ID: {admin.eeId}</p>
                          </div>
                          <Button 
                            variant="outline" 
                            className="py-2 px-4 text-xs border-red-100 text-red-600 hover:bg-red-50"
                            onClick={() => updateRole(admin.uid, 'user')}
                            disabled={processing === admin.uid}
                          >
                            {processing === admin.uid ? <Loader2 className="animate-spin" size={16} /> : <UserMinus size={16} />}
                            <span className="ml-1">Remove</span>
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </section>

              <section>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UserPlus size={18} className="text-blue-600" />
                  Promote User to Admin
                </h3>
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Search users by ID or Name..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
                <div className="space-y-3">
                  {allUsers
                    .filter(u => 
                      (u.displayName || "").toLowerCase().includes((searchQuery || "").toLowerCase()) || 
                      (u.eeId || "").toLowerCase().includes((searchQuery || "").toLowerCase())
                    )
                    .map(user => (
                      <Card key={user.uid} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-900">{user.displayName}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                            <p className="text-[10px] text-blue-600 font-bold mt-1">ID: {user.eeId}</p>
                          </div>
                          <Button 
                            className="py-2 px-4 text-xs"
                            onClick={() => updateRole(user.uid, 'admin')}
                            disabled={processing === user.uid}
                          >
                            {processing === user.uid ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
                            <span className="ml-1">Promote</span>
                          </Button>
                        </div>
                      </Card>
                    ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search by User ID or Name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {allUsers.filter(u => 
                (u.displayName || "").toLowerCase().includes((searchQuery || "").toLowerCase()) || 
                (u.eeId || "").toLowerCase().includes((searchQuery || "").toLowerCase())
              ).map(u => (
                <Card key={u.uid} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-900">{u.displayName}</h4>
                      <p className="text-xs text-gray-500">{u.email}</p>
                      <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-wider">ID: {u.eeId}</p>
                      <p className="text-[10px] font-bold text-gray-400">Wallet: {u.walletBalance} BDT</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${u.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      {u.isActive ? 'Active' : 'Pending'}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'withdraws' && (
            withdraws.map(w => (
              <Card key={w.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900">{w.method} - {w.amount} BDT</h4>
                    <p className="text-xs text-gray-500">Number: {w.number}</p>
                    <p className="text-xs text-gray-500">User: {w.userEmail}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${w.status === 'success' ? 'bg-emerald-100 text-emerald-600' : w.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    {w.status}
                  </span>
                </div>
              </Card>
            ))
          )}

          {activeTab === 'topups' && (
            topups.map(t => (
              <Card key={t.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900">{t.method} - {t.amount} BDT</h4>
                    <p className="text-xs text-gray-500">Sender: {t.senderNumber}</p>
                    <p className="text-xs text-gray-500">TxID: {t.transactionId}</p>
                    <p className="text-xs text-gray-500">User: {t.userEmail}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${t.status === 'success' ? 'bg-emerald-100 text-emerald-600' : t.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    {t.status}
                  </span>
                </div>
              </Card>
            ))
          )}

          {activeTab === 'recharges' && (
            recharges.map(r => (
              <Card key={r.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900">{r.mobileNumber}</h4>
                    <p className="text-xs text-gray-500">Amount: {r.amount} BDT</p>
                    <p className="text-xs text-gray-500">User: {r.userEmail}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${r.status === 'success' ? 'bg-emerald-100 text-emerald-600' : r.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    {r.status}
                  </span>
                </div>
              </Card>
            ))
          )}

          {activeTab === 'gmailSales' && (
            gmailSales.map(g => (
              <Card key={g.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900 truncate max-w-[200px]">{g.gmail}</h4>
                    <p className="text-xs text-gray-500">Reward: {g.reward} BDT</p>
                    <p className="text-xs text-gray-500">User: {g.userEmail}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${g.status === 'success' ? 'bg-emerald-100 text-emerald-600' : g.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    {g.status}
                  </span>
                </div>
              </Card>
            ))
          )}

          {activeTab === 'products' && (
            products.map(p => (
              <Card key={p.id} className="p-4">
                <div className="flex gap-4">
                  <img src={p.imageUrl} alt={p.name} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="font-bold text-gray-900">{p.name}</h4>
                    <p className="text-xs text-gray-500">{p.price} BDT</p>
                    <p className="text-[10px] text-gray-400">{p.category}</p>
                  </div>
                </div>
              </Card>
            ))
          )}

          {activeTab === 'adminActivity' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-emerald-600" />
                Admin Performance
              </h3>
              {adminStats.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No admin activity found</p>
              ) : (
                adminStats.map(stat => (
                  <Card 
                    key={stat.adminId} 
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => fetchAdminHistory(stat.adminProfile)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{stat.adminName}</h4>
                        <p className="text-xs text-gray-500">{stat.adminEmail}</p>
                        <div className="flex gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] font-bold text-emerald-600">{stat.successCount} Success</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-[10px] font-bold text-red-600">{stat.unsuccessCount} Unsuccess</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Last Activity</p>
                          <p className="text-[10px] text-gray-900 font-bold">
                            {stat.lastActivity ? new Date(stat.lastActivity).toLocaleDateString() : 'Never'}
                          </p>
                        </div>
                        <ChevronRight size={20} className="text-gray-300" />
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CEOPanel;
