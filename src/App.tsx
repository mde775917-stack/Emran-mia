import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import BottomNav from './components/BottomNav';
import WhatsAppButton from './components/WhatsAppButton';
import { MAINTENANCE_MODE } from './constants';
import { Lock } from 'lucide-react';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import FormFill from './pages/FormFill';
import Shop from './pages/Shop';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Topup from './pages/Topup';
import Recharge from './pages/Recharge';
import SellGmail from './pages/SellGmail';
import CEOPanel from './pages/CEOPanel';
import NoticeBox from './pages/NoticeBox';
import DailyTasks from './pages/DailyTasks';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AppContent = () => {
  const { user, profile } = useAuth();

  useEffect(() => {
    // Detect Referral
    const params = new URLSearchParams(window.location.search);
    const refId = params.get("ref");
    if (refId) {
      localStorage.setItem("referrerId", refId);
    }
  }, []);

  const isCeo = profile?.role === 'ceo' || profile?.eeId === 'ES-863355';

  const handleGlobalClick = (e: React.MouseEvent) => {
    if (MAINTENANCE_MODE && !isCeo) {
      // Allow navigation to home, login, and register
      const path = window.location.pathname;
      if (path === '/' || path === '/login' || path === '/register') {
        return;
      }

      // Find out if the clicked element or its parent is a button or link
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a')) {
        e.preventDefault();
        e.stopPropagation();
        alert("সাময়িক সমস্যার কারণে সাইটটি বন্ধ রয়েছে");
      }
    }
  };

  return (
    <div 
      className={`min-h-screen bg-gray-50 max-w-md mx-auto shadow-xl relative overflow-x-hidden ${MAINTENANCE_MODE && !isCeo ? 'select-none' : ''}`}
      onClickCapture={handleGlobalClick}
    >
      {MAINTENANCE_MODE && (
        <div className="bg-red-600 text-white py-2 px-4 text-center text-xs font-bold sticky top-0 z-[100] flex items-center justify-center gap-2 shadow-lg">
          <Lock size={14} />
          ⚠️ সাময়িক সমস্যার কারণে আমাদের সাইটটি কিছু দিনের জন্য বন্ধ থাকবে
        </div>
      )}
      
      <div className={MAINTENANCE_MODE && !isCeo ? 'grayscale-[0.5] pointer-events-auto' : ''}>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
        <Route path="/form-fill" element={<PrivateRoute><FormFill /></PrivateRoute>} />
        <Route path="/shop" element={<PrivateRoute><Shop /></PrivateRoute>} />
        <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
        <Route path="/topup" element={<PrivateRoute><Topup /></PrivateRoute>} />
        <Route path="/recharge" element={<PrivateRoute><Recharge /></PrivateRoute>} />
        <Route path="/sell-gmail" element={<PrivateRoute><SellGmail /></PrivateRoute>} />
        <Route path="/ceo-panel" element={<PrivateRoute><CEOPanel /></PrivateRoute>} />
        <Route path="/notices" element={<PrivateRoute><NoticeBox /></PrivateRoute>} />
        <Route path="/daily-tasks" element={<PrivateRoute><DailyTasks /></PrivateRoute>} />
      </Routes>
      
      {user && <BottomNav />}
      {/* <WhatsAppButton /> */}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
