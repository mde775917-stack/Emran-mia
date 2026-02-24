export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  walletBalance: number;
  referralCode: string;
  referredBy?: string | null;
  referralCount: number;
  referralEarnings: number;
  referralPending: number;
  videoEarnings: number;
  formEarnings: number;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: number;
}

export interface Task {
  id: string;
  userId: string;
  type: 'video' | 'form';
  amount: number;
  timestamp: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
}

export interface WithdrawRequest {
  id: string;
  userId: string;
  userEmail: string;
  method: 'bKash' | 'Nagad';
  number: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export interface AppSettings {
  videoReward: number;
  formReward: number;
  referralBonus: number;
  minWithdraw: number;
  maxDailyVideos: number;
  maxDailyForms: number;
}

export interface TopupRequest {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  method: 'bKash' | 'Nagad';
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}
