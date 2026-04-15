import { doc, getDoc, updateDoc, increment, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, ReferralSettings, WalletTransaction } from '../types';

export const handleReferralReward = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const profile = userSnap.data() as UserProfile;
    // Check if reward already given
    if (profile.referralRewardGiven) return;

    // Condition: first task completed OR account activated
    const isEligible = profile.hasCompletedFirstTask || profile.isActive;
    if (!isEligible) return;

    // If referred by someone, give rewards
    if (profile.referredBy) {
      // Prevent self referral
      if (profile.referredBy === profile.eeId) {
        await updateDoc(userRef, { referralRewardGiven: true });
        return;
      }

      // Fetch referral settings
      const settingsDoc = await getDoc(doc(db, 'referralSettings', 'global'));
      const settings: ReferralSettings = settingsDoc.exists() 
        ? settingsDoc.data() as ReferralSettings 
        : { inviterBonus: 5, newUserBonus: 5, requireFirstTask: true, referralLimit: 1000 };

      // Give reward to new user
      await updateDoc(userRef, {
        walletBalance: increment(settings.newUserBonus),
        referralRewardGiven: true
      });

      await addDoc(collection(db, 'walletTransactions'), {
        userId: profile.uid,
        amount: settings.newUserBonus,
        type: 'credit',
        description: 'Referral Join Bonus',
        timestamp: Date.now()
      } as Omit<WalletTransaction, 'id'>);

      // Give reward to inviter
      const inviterQ = query(collection(db, 'users'), where('eeId', '==', profile.referredBy));
      const inviterSnap = await getDocs(inviterQ);
      if (!inviterSnap.empty) {
        const inviterDoc = inviterSnap.docs[0];
        const inviterProfile = inviterDoc.data() as UserProfile;

        // Check referral limit
        if ((inviterProfile.referralCount || 0) <= settings.referralLimit) {
          await updateDoc(doc(db, 'users', inviterDoc.id), {
            walletBalance: increment(settings.inviterBonus),
            activeReferralCount: increment(1),
            referralEarnings: increment(settings.inviterBonus)
          });

          await addDoc(collection(db, 'walletTransactions'), {
            userId: inviterDoc.id,
            amount: settings.inviterBonus,
            type: 'credit',
            description: `Referral Bonus (${profile.displayName})`,
            timestamp: Date.now()
          } as Omit<WalletTransaction, 'id'>);

          // Level System Bonuses
          const newActiveCount = (inviterProfile.activeReferralCount || 0) + 1;
          let levelBonus = 0;
          if (newActiveCount === 5) levelBonus = 10;
          if (newActiveCount === 10) levelBonus = 25;
          if (newActiveCount === 20) levelBonus = 60;

          if (levelBonus > 0) {
            await updateDoc(doc(db, 'users', inviterDoc.id), {
              walletBalance: increment(levelBonus),
              referralEarnings: increment(levelBonus)
            });

            await addDoc(collection(db, 'walletTransactions'), {
              userId: inviterDoc.id,
              amount: levelBonus,
              type: 'credit',
              description: `Referral Level Bonus (${newActiveCount} Referrals)`,
              timestamp: Date.now()
            } as Omit<WalletTransaction, 'id'>);
          }
        }
      }
    } else {
      // No referrer, just mark as given to stop checking
      await updateDoc(userRef, { referralRewardGiven: true });
    }
  } catch (error) {
    console.error("Error handling referral reward:", error);
  }
};
