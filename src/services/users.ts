
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, Timestamp, updateDoc, getDocs } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
  subscription?: {
    planId: string;
    planName: string;
    status: 'trial' | 'active' | 'pending' | 'rejected' | 'expired';
    startDate: Date;
    endDate: Date;
  }
}

// Function to create a user profile document in Firestore
export const createUserProfile = async (uid: string, email: string, role: 'admin' | 'user') => {
    const userRef = doc(db, 'users', uid);
    const now = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(now.getDate() + 1); // 1-day trial

    await setDoc(userRef, {
        email,
        role,
        createdAt: serverTimestamp(),
        subscription: {
            planId: 'trial',
            planName: '1-Day Trial',
            status: 'trial',
            startDate: Timestamp.fromDate(now),
            endDate: Timestamp.fromDate(trialEndDate),
        }
    });
};

// Function for admin to get all users
export const getAllUsers = async (): Promise<UserProfile[]> => {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection);
    const querySnapshot = await getDocs(q);

    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
            uid: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
            subscription: data.subscription ? {
                ...data.subscription,
                startDate: (data.subscription.startDate as Timestamp)?.toDate(),
                endDate: (data.subscription.endDate as Timestamp)?.toDate(),
            } : undefined,
        } as UserProfile);
    });
    return users;
};


// Function to get a single user's profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    if (!uid) return null;
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            uid: docSnap.id,
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toDate(),
            subscription: data.subscription ? {
                ...data.subscription,
                startDate: (data.subscription.startDate as Timestamp)?.toDate(),
                endDate: (data.subscription.endDate as Timestamp)?.toDate(),
            } : undefined
        } as UserProfile;
    }
    return null;
}

export const updateUserSubscription = async (userId: string, subscriptionData: UserProfile['subscription']) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { subscription: subscriptionData });
}
