export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  walletBalance: number;
  videoEarnings: number;
  formEarnings: number;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: number;
}

export interface FormSubmission {
  id: string;
  userId: string;
  userEmail: string;
  gmail: string;
  password: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  timestamp: number;
}

export interface TopupRequest {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  method: 'bKash' | 'Nagad';
  senderNumber: string;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
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
  minWithdraw: number;
  maxDailyVideos: number;
  maxDailyForms: number;
}
