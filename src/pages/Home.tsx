import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Card } from '../components/UI';
import { TrendingUp, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const Home = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-12 pb-24 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-emerald-200">
            <Zap size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">EarnEase</h1>
          <p className="text-gray-500 mt-3 text-lg">Earn money daily by completing simple tasks and shopping.</p>
        </motion.div>

        <div className="space-y-6 mb-12">
          {[
            { icon: TrendingUp, title: 'Daily Tasks', desc: 'Watch ads and fill forms to earn BDT every day.' },
            { icon: Zap, title: 'Instant Rewards', desc: 'Get paid instantly to your wallet for every task.' },
            { icon: ShieldCheck, title: 'Secure Withdraw', desc: 'Withdraw your earnings to bKash or Nagad safely.' },
          ].map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <feature.icon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{feature.desc}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="space-y-4">
          <Link to="/register">
            <Button className="w-full py-4 text-lg flex items-center justify-center gap-2">
              Get Started <ArrowRight size={20} />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" className="w-full py-4 text-lg">
              Login to Account
            </Button>
          </Link>
        </div>

        <p className="text-center mt-12 text-gray-400 text-sm">
          © 2024 EarnEase. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Home;
