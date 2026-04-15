import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { Button, Card } from '../components/UI';
import { UserProfile } from '../types';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Device ID check for abuse prevention
      let deviceId = localStorage.getItem('ee_device_id');
      if (!deviceId) {
        deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('ee_device_id', deviceId);
      }

      // Check if device already has an account
      const deviceQ = query(collection(db, 'users'), where('deviceId', '==', deviceId));
      const deviceSnap = await getDocs(deviceQ);
      if (!deviceSnap.empty) {
        setError('Only one account is allowed per device');
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });

      // Generate unique User ID: ES-XXXXXX
      const randomId = Math.floor(100000 + Math.random() * 900000);
      const eeId = `ES-${randomId}`;

      // Get referrer from localStorage
      const referrerId = localStorage.getItem("referrerId");
      
      // Prevent self referral
      const finalReferrerId = (referrerId && referrerId !== eeId) ? referrerId : null;

      const profile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: name,
        eeId,
        walletBalance: 200, // Welcome bonus
        videoEarnings: 0,
        formEarnings: 0,
        isActive: false, 
        isAdmin: false,
        role: 'user',
        createdAt: Date.now(),
        welcomeBonusGiven: true,
        isInitiallyActivated: false,
        referredBy: finalReferrerId || undefined,
        referralCount: 0,
        activeReferralCount: 0,
        referralEarnings: 0,
        referralRewardGiven: false,
        deviceId,
        hasCompletedFirstTask: false
      };

      await setDoc(doc(db, 'users', user.uid), profile);

      // Clear referrer from localStorage
      if (referrerId) {
        localStorage.removeItem("referrerId");
      }

      // Increment referral count for inviter if exists
      if (finalReferrerId) {
        const inviterQ = query(collection(db, 'users'), where('eeId', '==', finalReferrerId));
        const inviterSnap = await getDocs(inviterQ);
        if (!inviterSnap.empty) {
          const inviterDoc = inviterSnap.docs[0];
          await updateDoc(doc(db, 'users', inviterDoc.id), {
            referralCount: increment(1)
          });
        }
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-2">Join EarnEase and start earning</p>
        </div>

        <Card>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </Button>
          </form>
        </Card>

        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-600 font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
