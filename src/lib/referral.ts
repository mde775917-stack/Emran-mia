import { doc, getDoc, updateDoc, increment, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, ReferralSettings, WalletTransaction } from '../types';

export const handleReferralReward = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const profile = userSnap.data() as UserProfile;
    
    // 1. Prevent duplicate: Do NOT give reward again if already given
    if (profile.referralRewardGiven) return;

    // 2. Logic: When user completes first task or becomes active
    const isEligible = profile.hasCompletedFirstTask || profile.isActive;
    if (!isEligible) return;

    // 3. Check: if referredBy exists
    if (profile.referredBy) {
      // Prevent self referral
      if (profile.referredBy === profile.eeId) {
        await updateDoc(userRef, { referralRewardGiven: true });
        return;
      }

      // Fetch referral settings (default 5 BDT if not set)
      const settingsDoc = await getDoc(doc(db, 'referralSettings', 'global'));
      const rewardAmount = settingsDoc.exists() 
        ? (settingsDoc.data() as ReferralSettings).inviterBonus 
        : 5;

      // 4. Then: Add reward to referrer wallet
      const inviterQ = query(collection(db, 'users'), where('eeId', '==', profile.referredBy));
      const inviterSnap = await getDocs(inviterQ);
      
      if (!inviterSnap.empty) {
        const inviterDoc = inviterSnap.docs[0];
        const inviterId = inviterDoc.id;
        const inviterProfile = inviterDoc.data() as UserProfile;

        // Check referral limit (if set)
        const referralLimit = settingsDoc.exists() ? (settingsDoc.data() as ReferralSettings).referralLimit : 1000;
        if ((inviterProfile.referralCount || 0) <= referralLimit) {
          await updateDoc(doc(db, 'users', inviterId), {
            walletBalance: increment(rewardAmount),
            activeReferralCount: increment(1),
            referralEarnings: increment(rewardAmount)
          });

          await addDoc(collection(db, 'walletTransactions'), {
            userId: inviterId,
            amount: rewardAmount,
            type: 'credit',
            description: `Referral Reward (${profile.displayName})`,
            timestamp: Date.now()
          } as Omit<WalletTransaction, 'id'>);

          // Level System Bonuses (Keep logic for milestones)
          const newActiveCount = (inviterProfile.activeReferralCount || 0) + 1;
          let levelBonus = 0;
          if (newActiveCount === 5) levelBonus = 10;
          if (newActiveCount === 10) levelBonus = 25;
          if (newActiveCount === 20) levelBonus = 60;

          if (levelBonus > 0) {
            await updateDoc(doc(db, 'users', inviterId), {
              walletBalance: increment(levelBonus),
              referralEarnings: increment(levelBonus)
            });

            await addDoc(collection(db, 'walletTransactions'), {
              userId: inviterId,
              amount: levelBonus,
              type: 'credit',
              description: `Referral Level Bonus (${newActiveCount} Referrals)`,
              timestamp: Date.now()
            } as Omit<WalletTransaction, 'id'>);
          }
        }
      }
    }

    // 5. Update: referralRewardGiven = true (for the new user)
    await updateDoc(userRef, { referralRewardGiven: true });
  } catch (error) {
    console.error("Error handling referral reward:", error);
  }
};
