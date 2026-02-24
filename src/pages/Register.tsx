import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { Button, Card } from '../components/UI';
import { UserProfile } from '../types';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });

      const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: name,
        walletBalance: 0,
        referralCode: myReferralCode,
        referredBy: referralCode || null,
        referralCount: 0,
        referralEarnings: 0,
        referralPending: 0, // Will be updated if referralCode is valid
        videoEarnings: 0,
        formEarnings: 0,
        isActive: false, 
        isAdmin: false,
        createdAt: Date.now(),
      };

      // Handle Referral Bonus logic before saving profile
      if (referralCode) {
        try {
          const { collection, query, where, getDocs, updateDoc, doc, increment } = await import('firebase/firestore');
          const q = query(collection(db, 'users'), where('referralCode', '==', referralCode));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const referrerDoc = querySnapshot.docs[0];
            const referrerData = referrerDoc.data() as UserProfile;
            
            if (referrerData.isActive) {
              // Referrer is active, give bonuses
              profile.referralPending = 100; // New user joining bonus
              
              const referrerRef = doc(db, 'users', referrerDoc.id);
              await updateDoc(referrerRef, {
                walletBalance: increment(50), // Referrer bonus
                referralEarnings: increment(50),
                referralCount: increment(1)
              });
            }
          }
        } catch (err: any) {
          console.error("Referral bonus failed:", err);
        }
      }

      await setDoc(doc(db, 'users', user.uid), profile);
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
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code (Optional)</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
              />
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
