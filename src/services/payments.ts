
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, doc, updateDoc, serverTimestamp, Timestamp, orderBy } from 'firebase/firestore';
import { getUserProfile, updateUserSubscription } from './users';
import { getDoc } from 'firebase/firestore';
import type { Plan } from './plans';

export interface Payment {
  id: string;
  userId: string;
  userEmail: string;
  planId: string;
  planName: string;
  price: number;
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
}

// User submits a payment
export const submitPayment = async (userId: string, plan: Plan, transactionId: string) => {
    const user = await getUserProfile(userId);
    if (!user) throw new Error("User not found");

    await addDoc(collection(db, 'payments'), {
        userId,
        userEmail: user.email,
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        transactionId,
        status: 'pending',
        submittedAt: serverTimestamp(),
    });
    
    // Also update user's subscription status to pending
    const subscription = user.subscription;
    if(subscription) {
      await updateUserSubscription(userId, {...subscription, status: 'pending'});
    }
};

// Admin gets all payments
export const getPayments = (callback: (payments: Payment[]) => void) => {
    const q = query(collection(db, 'payments'), orderBy('submittedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const payments: Payment[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            payments.push({
                id: doc.id,
                ...data,
                submittedAt: (data.submittedAt as Timestamp)?.toDate()
            } as Payment)
        });
        callback(payments);
    });
    return unsubscribe;
};

// Admin approves a payment
export const approvePayment = async (paymentId: string) => {
    const paymentRef = doc(db, 'payments', paymentId);
    const paymentSnap = await getDoc(paymentRef);
    if (!paymentSnap.exists()) throw new Error("Payment not found");
    const paymentData = paymentSnap.data();

    // Fetch plan details
    const planRef = doc(db, 'plans', paymentData.planId);
    const planSnap = await getDoc(planRef);
    if (!planSnap.exists()) throw new Error("Plan not found");
    const planData = planSnap.data();

    // Update payment status
    await updateDoc(paymentRef, { status: 'approved' });

    // Update user's subscription
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + planData.durationDays);

    const newSubscription = {
        planId: paymentData.planId,
        planName: planData.name,
        status: 'active',
        startDate: Timestamp.fromDate(now),
        endDate: Timestamp.fromDate(endDate),
    };
    
    await updateUserSubscription(paymentData.userId, newSubscription as any);
};

// Admin rejects a payment
export const rejectPayment = async (paymentId: string) => {
    const paymentRef = doc(db, 'payments', paymentId);
    const paymentSnap = await getDoc(paymentRef);
    if (!paymentSnap.exists()) throw new Error("Payment not found");
    const paymentData = paymentSnap.data();

    await updateDoc(paymentRef, { status: 'rejected' });
    
    const user = await getUserProfile(paymentData.userId);
    if(user && user.subscription && user.subscription.status === 'pending') {
         const newSubscription = {
            ...user.subscription,
            status: 'rejected',
        };
        await updateUserSubscription(paymentData.userId, newSubscription as any);
    }
};
