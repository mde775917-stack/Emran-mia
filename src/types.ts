export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  walletBalance: number;
  videoEarnings: number;
  formEarnings: number;
  isActive: boolean;
  isAdmin: boolean;
  role: 'user' | 'admin' | 'superadmin';
  createdAt: number;
  eeId: string;
  welcomeBonusGiven?: boolean;
  isInitiallyActivated?: boolean;
}

export interface ActivationLog {
  id: string;
  adminId: string;
  adminEmail: string;
  activatedUserId: string;
  activatedUserEmail: string;
  timestamp: number;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  actionType: 'withdraw_success' | 'withdraw_rejected' | 'topup_success' | 'topup_rejected' | 'activation_success' | 'recharge_success' | 'recharge_rejected' | 'gmail_sale_success' | 'gmail_sale_rejected';
  targetUserId: string;
  requestId: string;
  status: 'success' | 'unsuccess';
  timestamp: number;
}

export interface FormSubmission {
  id: string;
  uid: string;
  userEmail: string;
  gmail: string;
  userId: string;
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
  transactionId: string;
  screenshotUrl?: string;
  status: 'pending' | 'success' | 'rejected';
  createdAt: number;
  timestamp?: number;
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
  createdAt: number;
}

export interface WithdrawRequest {
  id: string;
  userId: string;
  userEmail: string;
  method: 'bKash' | 'Nagad';
  number: string;
  amount: number;
  status: 'pending' | 'success' | 'rejected';
  timestamp: number;
}

export interface AppSettings {
  videoReward: number;
  formReward: number;
  minWithdraw: number;
  maxDailyVideos: number;
  maxDailyForms: number;
}

export interface RechargeRequest {
  id: string;
  userId: string;
  userEmail: string;
  mobileNumber: string;
  amount: number;
  bonus: number;
  status: 'pending' | 'success' | 'rejected';
  createdAt: number;
}

export interface GmailSaleRequest {
  id: string;
  userId: string;
  userEmail: string;
  gmail: string;
  password: string;
  reward: number;
  status: 'pending' | 'success' | 'rejected';
  createdAt: number;
}
