
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, serverTimestamp, doc, updateDoc, deleteDoc, Timestamp, orderBy } from 'firebase/firestore';

export const leadStatuses = ['New', 'Active', 'Deal', 'Done'] as const;
export type LeadStatus = typeof leadStatuses[number];

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  note?: string;
  status: LeadStatus;
  createdAt: Date;
}

export type LeadData = Omit<Lead, 'id' | 'createdAt'>;

export const addLead = async (userId: string, leadData: LeadData) => {
    if (!userId) throw new Error('User not logged in');

    try {
        const docRef = await addDoc(collection(db, 'users', userId, 'leads'), {
            ...leadData,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding lead: ", error);
        throw new Error("Failed to create lead.");
    }
}

export const getLeads = (userId: string, callback: (leads: Lead[]) => void) => {
    if (!userId) return () => {};

    const q = query(collection(db, 'users', userId, 'leads'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const leads: Lead[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            leads.push({
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
            } as Lead);
        });
        callback(leads);
    }, (error) => {
        console.error("Error fetching leads: ", error);
    });

    return unsubscribe;
};

export const updateLead = async (userId: string, leadId: string, data: Partial<LeadData>) => {
    if (!userId) throw new Error('User not logged in');
    try {
        const leadRef = doc(db, 'users', userId, 'leads', leadId);
        await updateDoc(leadRef, data);
    } catch (error) {
        console.error("Error updating lead: ", error);
        throw new Error("Failed to update lead.");
    }
};

export const deleteLead = async (userId: string, leadId: string) => {
    if (!userId) throw new Error('User not logged in');
    try {
        await deleteDoc(doc(db, 'users', userId, 'leads', leadId));
    } catch (error) {
        console.error("Error deleting lead: ", error);
        throw new Error("Failed to delete lead.");
    }
}
