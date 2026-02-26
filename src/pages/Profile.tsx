import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { User, Mail, Shield, LogOut, ChevronRight, Settings, HelpCircle, Bell } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

const Profile = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const menuItems = [
    { icon: Settings, label: 'Account Settings', path: '/settings' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    // { icon: HelpCircle, label: 'Help & Support', path: '/support' },
  ];

  return (
    <div className="pb-24 pt-6 px-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
      </header>

      <Card className="flex flex-col items-center text-center mb-8">
        <div className="w-24 h-24 rounded-3xl bg-emerald-600 flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-lg shadow-emerald-200">
          {profile.displayName?.[0] || '?'}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{profile.displayName}</h2>
        <p className="text-gray-500 text-sm mb-4">{profile.email}</p>
        <div className="flex gap-2">
          {profile.isAdmin && (
            <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Admin</span>
          )}
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${profile.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            {profile.isActive ? 'Active' : 'Pending Activation'}
          </span>
        </div>
      </Card>

      <div className="space-y-3 mb-8">
        {menuItems.map((item) => (
          <Card key={item.label} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                <item.icon size={20} />
              </div>
              <span className="font-semibold text-sm text-gray-900">{item.label}</span>
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
      </div>

      <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50" onClick={handleLogout}>
        <LogOut size={20} className="mr-2 inline" /> Logout
      </Button>
    </div>
  );
};

export default Profile;
