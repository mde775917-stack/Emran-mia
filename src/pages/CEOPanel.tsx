import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { Shield, Users, FileText, Loader2, UserPlus, UserMinus, Clock, Search } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, ActivationLog } from '../types';

const CEOPanel = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'admins' | 'activationReport'>('admins');
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [activationLogs, setActivationLogs] = useState<ActivationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.eeId !== 'ES-556378') return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'admins') {
          // Fetch all admins
          const q = query(collection(db, 'users'), where('role', '==', 'admin'));
          const snap = await getDocs(q);
          setAdmins(snap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile)));

          // Fetch users for potential promotion (limited for performance)
          const uq = query(collection(db, 'users'), where('role', '==', 'user'), limit(50));
          const usnap = await getDocs(uq);
          setAllUsers(usnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile)));
        } else if (activeTab === 'activationReport') {
          const q = query(collection(db, 'activationLogs'), orderBy('timestamp', 'desc'), limit(100));
          const snap = await getDocs(q);
          setActivationLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivationLog)));
        }
      } catch (error) {
        console.error("CEO Panel fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, profile]);

  const updateRole = async (uid: string, newRole: 'user' | 'admin') => {
    if (profile?.eeId !== 'ES-556378') return;
    setProcessing(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { 
        role: newRole,
        isAdmin: newRole === 'admin'
      });
      
      // Refresh local state
      if (newRole === 'admin') {
        const user = allUsers.find(u => u.uid === uid);
        if (user) {
          setAdmins([...admins, { ...user, role: 'admin', isAdmin: true }]);
          setAllUsers(allUsers.filter(u => u.uid !== uid));
        }
      } else {
        const admin = admins.find(a => a.uid === uid);
        if (admin) {
          setAllUsers([...allUsers, { ...admin, role: 'user', isAdmin: false }]);
          setAdmins(admins.filter(a => a.uid !== uid));
        }
      }
      alert(`User role updated to ${newRole}`);
    } catch (error) {
      alert('Error updating role');
    } finally {
      setProcessing(null);
    }
  };

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

  return (
    <div className="pb-24 pt-6 px-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">CEO Panel</h1>
        <p className="text-gray-500 text-sm">System-wide administrative controls</p>
      </header>

      <div className="flex gap-2 mb-8">
        {[
          { id: 'admins', label: 'Manage Admins', icon: Users },
          { id: 'activationReport', label: 'Activation Logs', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold transition-all ${
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
        <div className="space-y-6">
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
                    .filter(u => u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || u.eeId.includes(searchQuery))
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

          {activeTab === 'activationReport' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={18} className="text-emerald-600" />
                Recent Activations
              </h3>
              {activationLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No activation logs found</p>
              ) : (
                activationLogs.map(log => (
                  <Card key={log.id} className="p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Admin</p>
                          <p className="text-sm font-bold text-gray-900">{log.adminEmail}</p>
                        </div>
                        <p className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                        <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider mb-1">Activated User</p>
                        <p className="text-sm font-bold text-gray-900">{log.activatedUserEmail}</p>
                        <p className="text-[10px] text-gray-500">UID: {log.activatedUserId}</p>
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
