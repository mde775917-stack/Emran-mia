import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { User, Mail, Shield, LogOut, ChevronRight, Settings, HelpCircle, Bell, Share2, Copy, Check, X, ShieldAlert, Info, Download } from 'lucide-react';
import { collection, query, where, getDocs, onSnapshot, orderBy, limit, updateDoc, doc, increment, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Notice, WalletTransaction } from '../types';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const Profile = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [showReferModal, setShowReferModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasUnreadNotices, setHasUnreadNotices] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !profile) return;

    // Listen for notices
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribeNotices = onSnapshot(q, (snap) => {
      const allNotices = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
      const userNotices = allNotices.filter(n => n.targetType === 'all' || n.targetUserId === profile.eeId);
      
      // Check read status
      const statusQ = query(collection(db, `users/${user.uid}/noticeStatus`));
      getDocs(statusQ).then(statusSnap => {
        const readIds = new Set(statusSnap.docs.map(doc => doc.id));
        const unread = userNotices.some(n => !readIds.has(n.id));
        setHasUnreadNotices(unread);
      });
    });

    return () => unsubscribeNotices();
  }, [user, profile]);

  if (!profile) return null;

  const referralLink = `https://earnease-bice.vercel.app/?ref=${profile.eeId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EarnEase',
          text: 'Join EarnEase and start earning daily!',
          url: referralLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopy();
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleAppDownload = async () => {
    if (profile.appDownloadRewardClaimed) {
      window.open('https://gdisbbd9w7-byte.github.io/-earnhvube_bot/', '_blank');
      return;
    }

    setClaiming(true);
    try {
      window.open('https://gdisbbd9w7-byte.github.io/-earnhvube_bot/', '_blank');

      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        walletBalance: increment(15),
        appDownloadRewardClaimed: true
      });

      await addDoc(collection(db, 'walletTransactions'), {
        userId: profile.uid,
        amount: 15,
        type: 'credit',
        description: 'App Download Reward',
        timestamp: Date.now()
      } as Omit<WalletTransaction, 'id'>);

      await refreshProfile();
      alert('Congratulations! 15 BDT added to your wallet.');
    } catch (error) {
      console.error('Error claiming app download reward:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const handleWhatsAppSupport = (phone: string) => {
    const userId = profile?.eeId;
    const message = `Hello Admin, I need support regarding my EarnEase account. My User ID is ${userId}. Please assist me.`;
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = phone.replace(/\+/g, '').replace(/\s+/g, '').replace(/-/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
  };

  const menuItems = [
    { icon: Settings, label: 'Account Settings', path: '/settings' },
    { 
      icon: HelpCircle, 
      label: 'Admin Support', 
      subtitle: 'Message admins on WhatsApp',
      onClick: () => setShowSupportModal(true) 
    },
  ];

  return (
    <div className="pb-24 pt-6 px-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
      </header>

      <Card className="flex flex-col items-center text-center mb-8">
        <div className="w-24 h-24 rounded-3xl bg-emerald-600 flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-lg shadow-emerald-200 overflow-hidden">
          {!imageError ? (
            <img 
              src={profile.isAdmin 
                ? "https://i.ibb.co/vC09VyH4/1000005618.jpg" 
                : "https://i.ibb.co/Lzy0RKJx/1000005617.jpg"
              } 
              alt="Profile"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            profile.displayName?.[0] || '?'
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{profile.displayName}</h2>
        <p className="text-gray-500 text-sm">{profile.email}</p>
        <p className="text-emerald-600 text-xs font-bold mt-1 mb-4">User ID: {profile.eeId || 'N/A'}</p>
        <div className="flex gap-2">
          {profile.isAdmin && (
            <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Admin</span>
          )}
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${profile.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            {profile.isActive ? 'Active' : 'Pending Activation'}
          </span>
        </div>
        <button 
          onClick={() => setShowTermsModal(true)}
          className="mt-4 text-[10px] text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
        >
          Terms & Conditions
        </button>
      </Card>

      <Card 
        className="p-4 mb-3 bg-emerald-600 text-white border-none shadow-lg shadow-emerald-100 cursor-pointer" 
        onClick={() => setShowReferModal(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Share2 size={20} />
            </div>
            <div>
              <p className="font-bold text-sm">Refer & Earn</p>
              <p className="text-[10px] text-emerald-100 opacity-80">Invite friends and grow together</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-emerald-200" />
        </div>
      </Card>

      <Link to="/notices">
        <Card className="p-4 mb-6 flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer relative">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Bell size={20} />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">Notice Box</p>
              <p className="text-[10px] text-gray-500">Check important updates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasUnreadNotices && (
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
            )}
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        </Card>
      </Link>

      <Card 
        className={`p-4 mb-6 flex justify-between items-center transition-colors cursor-pointer relative ${profile.appDownloadRewardClaimed ? 'bg-gray-50 opacity-80' : 'hover:bg-gray-50'}`}
        onClick={handleAppDownload}
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${profile.appDownloadRewardClaimed ? 'bg-gray-200 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>
            <Download size={20} />
          </div>
          <div>
            <p className="font-bold text-sm text-gray-900">App Download</p>
            <p className="text-[10px] text-gray-500">
              {profile.appDownloadRewardClaimed ? 'Already Claimed' : 'Install app and earn 15 BDT'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profile.appDownloadRewardClaimed ? (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Claimed</span>
          ) : (
            <ChevronRight size={18} className="text-gray-400" />
          )}
        </div>
      </Card>

      <div className="space-y-3 mb-8">
        {menuItems.map((item) => (
          <Card 
            key={item.label} 
            className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => item.onClick ? item.onClick() : item.path && navigate(item.path)}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                <item.icon size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{item.label}</p>
                {item.subtitle && <p className="text-[10px] text-gray-500">{item.subtitle}</p>}
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </Card>
        ))}
        
        {profile.isAdmin && (
          <Link to="/admin">
            <Card className="p-4 flex justify-between items-center hover:bg-red-50 transition-colors cursor-pointer border-red-100 mt-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                  <Shield size={20} />
                </div>
                <span className="font-semibold text-sm text-red-600">Admin Dashboard</span>
              </div>
              <ChevronRight size={18} className="text-red-400" />
            </Card>
          </Link>
        )}

        {profile.role === 'ceo' && (
          <Link to="/ceo-panel">
            <Card className="p-4 flex justify-between items-center hover:bg-blue-50 transition-colors cursor-pointer border-blue-100 mt-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <ShieldAlert size={20} />
                </div>
                <span className="font-semibold text-sm text-blue-600">CEO Panel</span>
              </div>
              <ChevronRight size={18} className="text-blue-400" />
            </Card>
          </Link>
        )}
      </div>

      <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50" onClick={handleLogout}>
        <LogOut size={20} className="mr-2 inline" /> Logout
      </Button>

      <AnimatePresence>
        {showReferModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-end justify-center">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-[32px] p-8 pb-12"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Refer Friends</h2>
                <button onClick={() => setShowReferModal(false)} className="text-gray-400">
                  <X size={24} />
                </button>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-6">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-4">Your Referral Stats</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">{profile.referralCount || 0}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-emerald-600">{profile.activeReferralCount || 0}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-blue-600">{profile.referralEarnings || 0}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Earnings</p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 mb-6">
                <p className="text-xs text-emerald-600 uppercase font-bold tracking-wider mb-4">Referral Levels</p>
                <div className="space-y-3">
                  {[
                    { count: 5, bonus: 10 },
                    { count: 10, bonus: 25 },
                    { count: 20, bonus: 60 }
                  ].map((level) => {
                    const isActive = (profile.activeReferralCount || 0) >= level.count;
                    return (
                      <div key={level.count} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-400'}`}>
                            {isActive ? <Check size={12} /> : <span className="text-[10px]">{level.count}</span>}
                          </div>
                          <p className={`text-xs font-bold ${isActive ? 'text-emerald-700' : 'text-emerald-400'}`}>
                            {level.count} Referrals
                          </p>
                        </div>
                        <p className={`text-xs font-bold ${isActive ? 'text-emerald-700' : 'text-emerald-400'}`}>
                          +{level.bonus} BDT Bonus
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Your Referral Link</p>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-gray-600 truncate">{referralLink}</p>
                  <button 
                    onClick={handleCopy}
                    className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-600 text-white shadow-sm shadow-emerald-100'}`}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                {copied && (
                  <motion.p 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-emerald-600 font-bold mt-2"
                  >
                    Link copied successfully
                  </motion.p>
                )}
              </div>

              <div className="space-y-3">
                <Button onClick={handleShare} className="w-full py-4 flex items-center justify-center gap-2">
                  <Share2 size={20} /> Share Link
                </Button>
                <Button variant="outline" onClick={() => setShowReferModal(false)} className="w-full py-4">
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSupportModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-end justify-center">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-[32px] p-8 pb-12"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Admin Support</h2>
                <button onClick={() => setShowSupportModal(false)} className="text-gray-400">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'ADMIN SANUAR', phone: '8801767525065' },
                  { name: 'ADMIN FARHANA', phone: '8801568830976' },
                  { name: 'ADMIN JARIN', phone: '8801754726838' }
                ].map((admin) => (
                  <Card 
                    key={admin.name} 
                    className="p-4 flex justify-between items-center hover:bg-emerald-50 transition-colors cursor-pointer border-emerald-50"
                    onClick={() => handleWhatsAppSupport(admin.phone)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <User size={20} />
                      </div>
                      <span className="font-bold text-sm text-gray-900">{admin.name}</span>
                    </div>
                    <ChevronRight size={18} className="text-emerald-400" />
                  </Card>
                ))}
              </div>

              <Button variant="outline" onClick={() => setShowSupportModal(false)} className="w-full py-4 mt-6">
                Close
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[32px] flex flex-col max-h-[80vh] shadow-2xl"
            >
              <div className="p-6 border-b border-gray-50 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold text-gray-900">Terms & Conditions</h2>
                <button 
                  onClick={() => setShowTermsModal(false)}
                  className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">EarnEase – Terms & Conditions</h3>
                    <p>EarnEase is an online platform where users can earn by completing tasks, use mobile services, and access various digital features. By using this platform, users agree to the following terms and conditions.</p>
                  </div>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-1">Account Registration</h4>
                    <p>Users must provide accurate information. False information may result in account suspension.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-1">Account Activation</h4>
                    <p>Some features require activation. After activation, users can access full features.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-1">Earnings & Rewards</h4>
                    <p>Rewards are added after admin verification.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-1">Top-up, Recharge & Payments</h4>
                    <p>All payment requests remain pending until admin approval.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-1">Withdrawal Policy</h4>
                    <p>Users can withdraw after reaching minimum balance. Incorrect info may cancel payment.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-1">Account Security</h4>
                    <p>Users must keep passwords safe. The platform is not responsible for shared accounts.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-1">Violations</h4>
                    <p>Fraud, spam, fake data or misuse may lead to suspension.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-1">Support</h4>
                    <p>If users face issues, they can contact support for resolution.</p>
                  </section>

                  <div className="pt-4 border-t border-gray-50">
                    <h4 className="font-bold text-gray-900 mb-2">Disclaimer Section</h4>
                    <p className="mb-2 italic">EarnEase is an independent online earning platform. It is not an official service of any government, bank, or major technology company.</p>
                    <p>All rewards and payments depend on platform rules, verification, and admin approval.</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-50 shrink-0">
                <Button onClick={() => setShowTermsModal(false)} className="w-full">
                  I Understand
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
