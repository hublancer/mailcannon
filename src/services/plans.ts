
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export interface Plan {
  id: string;
  name: string;
  durationDays: number;
  smtpAccountLimit: number;
  price: number;
}

export type PlanData = Omit<Plan, 'id'>;

export const addPlan = async (planData: PlanData) => {
    await addDoc(collection(db, 'plans'), {
        ...planData,
        createdAt: serverTimestamp(),
    });
};

export const updatePlan = async (planId: string, planData: Partial<PlanData>) => {
    const planRef = doc(db, 'plans', planId);
    await updateDoc(planRef, planData);
};

export const deletePlan = async (planId: string) => {
    const planRef = doc(db, 'plans', planId);
    await deleteDoc(planRef);
};

export const getPlans = (callback: (plans: Plan[]) => void) => {
    const q = query(collection(db, 'plans'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const plans: Plan[] = [];
        querySnapshot.forEach((doc) => {
            plans.push({ id: doc.id, ...doc.data() } as Plan);
        });
        callback(plans);
    });
    return unsubscribe;
};
