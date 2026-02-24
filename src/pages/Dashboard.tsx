import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { Wallet, TrendingUp, Users, PlayCircle, FileText, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const Dashboard = () => {
  const { profile } = useAuth();

  if (!profile) return null;

  const stats = [
    { label: 'Wallet Balance', value: `${profile.walletBalance} BDT`, icon: Wallet, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Video Earnings', value: `${profile.videoEarnings} BDT`, icon: PlayCircle, color: 'bg-blue-50 text-blue-600' },
    { label: 'Form Earnings', value: `${profile.formEarnings} BDT`, icon: FileText, color: 'bg-orange-50 text-orange-600' },
    { label: 'Referral Bonus', value: `${profile.referralEarnings} BDT`, icon: Users, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="pb-24 pt-6 px-6 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hello, {profile.displayName}</h1>
          <p className="text-gray-500 text-sm">Welcome back to your dashboard</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
          {profile.displayName?.[0] || '?'}
        </div>
      </header>

      {!profile.isActive && (
        <Card className="bg-amber-50 border-amber-100 mb-6">
          <div className="flex gap-3">
            <div className="text-amber-600">⚠️</div>
            <div>
              <h4 className="font-semibold text-amber-900">Account Inactive</h4>
              <p className="text-sm text-amber-700 mb-4">Please wait for admin to activate your account to access all features.</p>
              <Link to="/topup">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 border-none">
                  Topup to Speed Up
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-4">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon size={20} />
              </div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{stat.label}</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{stat.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
          <Link to="/topup">
            <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-600">
              <ArrowUpRight size={16} className="mr-1" /> Topup
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Link to={profile.isActive ? "/tasks" : "#"} className={!profile.isActive ? "opacity-50 cursor-not-allowed" : ""}>
            <Card className="flex flex-col items-center text-center p-4 hover:bg-emerald-50 transition-colors">
              <PlayCircle className="text-emerald-600 mb-2" size={32} />
              <span className="font-semibold text-sm">Watch Ads</span>
              {!profile.isActive && <span className="text-[10px] text-amber-600 font-bold mt-1">LOCKED</span>}
            </Card>
          </Link>
          <Link to={profile.isActive ? "/form-fill" : "#"} className={!profile.isActive ? "opacity-50 cursor-not-allowed" : ""}>
            <Card className="flex flex-col items-center text-center p-4 hover:bg-emerald-50 transition-colors">
              <FileText className="text-emerald-600 mb-2" size={32} />
              <span className="font-semibold text-sm">Fill Forms</span>
              {!profile.isActive && <span className="text-[10px] text-amber-600 font-bold mt-1">LOCKED</span>}
            </Card>
          </Link>
          <Link to={profile.isActive ? "/shop" : "#"} className={!profile.isActive ? "opacity-50 cursor-not-allowed" : ""}>
            <Card className="flex flex-col items-center text-center p-4 hover:bg-emerald-50 transition-colors">
              <ShoppingBag className="text-emerald-600 mb-2" size={32} />
              <span className="font-semibold text-sm">Shop Now</span>
              {!profile.isActive && <span className="text-[10px] text-amber-600 font-bold mt-1">LOCKED</span>}
            </Card>
          </Link>
          <Link to={profile.isActive ? "/referral" : "#"} className={!profile.isActive ? "opacity-50 cursor-not-allowed" : ""}>
            <Card className="flex flex-col items-center text-center p-4 hover:bg-emerald-50 transition-colors">
              <Users className="text-emerald-600 mb-2" size={32} />
              <span className="font-semibold text-sm">Refer Friends</span>
              {!profile.isActive && <span className="text-[10px] text-amber-600 font-bold mt-1">LOCKED</span>}
            </Card>
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
          <Link to="/wallet" className="text-emerald-600 text-sm font-semibold flex items-center gap-1">
            View All <ArrowUpRight size={16} />
          </Link>
        </div>
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {/* Placeholder for activity list */}
            <div className="p-4 flex justify-between items-center">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <PlayCircle size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm">Video Ad Reward</p>
                  <p className="text-xs text-gray-500">Today, 10:30 AM</p>
                </div>
              </div>
              <span className="text-emerald-600 font-bold">+5 BDT</span>
            </div>
            <div className="p-4 flex justify-between items-center">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm">Form Fill Reward</p>
                  <p className="text-xs text-gray-500">Yesterday, 4:15 PM</p>
                </div>
              </div>
              <span className="text-emerald-600 font-bold">+2 BDT</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
