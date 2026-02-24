import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { Users, Copy, Share2, CheckCircle2, AlertCircle } from 'lucide-react';

const Referral = () => {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!profile) return null;

  const copyToClipboard = () => {
    if (!profile.isActive) return;
    navigator.clipboard.writeText(profile.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = () => {
    if (!profile.isActive) return;
    if (navigator.share) {
      navigator.share({
        title: 'Join EarnEase',
        text: `Use my referral code ${profile.referralCode} to join EarnEase and start earning!`,
        url: window.location.origin
      });
    }
  };

  return (
    <div className="pb-24 pt-6 px-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Refer & Earn</h1>
        <p className="text-gray-500 text-sm">Invite friends and get 50 BDT bonus</p>
      </header>

      {!profile.isActive && (
        <Card className="bg-amber-50 border-amber-100 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">Your account must be activated by an admin to start referring friends and earning bonuses.</p>
          </div>
        </Card>
      )}

      <Card className={`bg-emerald-600 text-white mb-8 ${!profile.isActive ? 'opacity-50' : ''}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Total Referral Earnings</p>
            <p className="text-2xl font-bold">{profile.referralEarnings} BDT</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-emerald-100 text-[10px] uppercase tracking-wider">Total Referrals</p>
            <p className="text-lg font-bold">{profile.referralCount}</p>
          </div>
          <div>
            <p className="text-emerald-100 text-[10px] uppercase tracking-wider">Bonus Per User</p>
            <p className="text-lg font-bold">50 BDT</p>
          </div>
        </div>
      </Card>

      <Card title="Your Referral Code" subtitle="Share this code with your friends" className={!profile.isActive ? 'opacity-50 pointer-events-none' : ''}>
        <div className="flex gap-2 mt-4">
          <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-mono font-bold text-lg text-center tracking-widest text-emerald-600">
            {profile.referralCode}
          </div>
          <button 
            onClick={copyToClipboard}
            className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 active:scale-90 transition-transform"
          >
            {copied ? <CheckCircle2 size={20} className="text-emerald-600" /> : <Copy size={20} />}
          </button>
        </div>
        <Button onClick={shareReferral} className="w-full mt-4 flex items-center justify-center gap-2">
          <Share2 size={20} /> Share Now
        </Button>
      </Card>

      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">How it works</h3>
        <div className="space-y-4">
          {[
            { step: '1', title: 'Share your code', desc: 'Send your unique referral code to your friends.' },
            { step: '2', title: 'Friend joins', desc: 'Your friend registers using your referral code.' },
            { step: '3', title: 'Get Bonus', desc: 'You receive 50 BDT in your wallet once your friend is activated.' }
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                {item.step}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{item.title}</h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Referral;
