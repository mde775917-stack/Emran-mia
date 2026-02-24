import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { CreditCard, Upload, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useNavigate } from 'react-router-dom';

const Topup = () => {
  const { profile } = useAuth();
  const [amount, setAmount] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [method, setMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !file || !amount || !senderNumber) return;

    setLoading(true);
    try {
      // 1. Upload screenshot
      const storageRef = ref(storage, `topups/${profile.uid}_${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 2. Create topup request
      await addDoc(collection(db, 'topups'), {
        userId: profile.uid,
        userEmail: profile.email,
        amount: Number(amount),
        method,
        senderNumber,
        screenshotUrl: downloadURL,
        status: 'pending',
        timestamp: Date.now(),
      });

      setCompleted(true);
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
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Topup Wallet</h1>
        <p className="text-gray-500 text-sm">Add money to your wallet balance</p>
      </header>

      {completed ? (
        <Card className="text-center py-12">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted</h2>
          <p className="text-gray-500 mb-8 px-4">Your topup request is pending approval. It usually takes 30-60 minutes.</p>
          <Button onClick={() => navigate('/dashboard')} className="w-full">Back to Dashboard</Button>
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
            <h3 className="font-bold text-gray-900">4. Upload Screenshot</h3>
            <label className="block">
              <div className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-colors ${
                file ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 bg-white'
              }`}>
                {file ? (
                  <>
                    <CheckCircle2 className="text-emerald-600 mb-2" size={32} />
                    <p className="text-emerald-600 font-semibold text-sm">{file.name}</p>
                    <p className="text-emerald-500 text-xs mt-1">Click to change</p>
                  </>
                ) : (
                  <>
                    <Upload className="text-gray-400 mb-2" size={32} />
                    <p className="text-gray-500 font-semibold text-sm">Upload Payment Screenshot</p>
                    <p className="text-gray-400 text-xs mt-1">PNG, JPG up to 5MB</p>
                  </>
                )}
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} required />
            </label>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
            <AlertCircle className="text-amber-600 shrink-0" size={20} />
            <p className="text-xs text-amber-800 leading-relaxed">
              Send money to the number above first, then submit this form with the screenshot. 
              Incorrect information may lead to account suspension.
            </p>
          </div>

          <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Submit Topup Request'}
          </Button>
        </form>
      )}
    </div>
  );
};

export default Topup;
