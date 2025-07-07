import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp, doc, deleteDoc } from 'firebase/firestore';

export interface Campaign {
  id: string;
  campaignName: string;
  emailSubject: string;
  smtpAccountId: string;
  recipientListId: string;
  emailBody: string;
  scheduleSend: boolean;
  scheduledAt: Date | null;
  delay: number;
  speedLimit: number;
  status: 'Draft' | 'Scheduled' | 'Sending' | 'Sent' | 'Failed' | 'Active' | 'Recurring';
  createdAt: Date;
}

// Type for data sent to Firestore
export type CampaignData = Omit<Campaign, 'id' | 'status' | 'createdAt'>;

export const addCampaign = async (userId: string, campaignData: CampaignData) => {
    if (!userId) throw new Error('User not logged in');

    try {
        const docRef = await addDoc(collection(db, 'users', userId, 'campaigns'), {
            ...campaignData,
            status: campaignData.scheduleSend && campaignData.scheduledAt ? 'Scheduled' : 'Draft',
            createdAt: serverTimestamp(),
            // Ensure scheduledAt is a Timestamp or null
            scheduledAt: campaignData.scheduledAt ? Timestamp.fromDate(campaignData.scheduledAt) : null,
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding campaign: ", error);
        throw new Error("Failed to create campaign.");
    }
};

export const getCampaigns = (userId: string, callback: (campaigns: Campaign[]) => void) => {
    if (!userId) return () => {};

    const q = query(collection(db, 'users', userId, 'campaigns'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const campaigns: Campaign[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            campaigns.push({
                id: doc.id,
                ...data,
                // Convert Firestore Timestamps to JS Date objects
                createdAt: (data.createdAt as Timestamp)?.toDate(),
                scheduledAt: (data.scheduledAt as Timestamp)?.toDate() || null,
            } as Campaign);
        });
        callback(campaigns);
    }, (error) => {
        console.error("Error fetching campaigns: ", error);
        // It's good practice to inform the user about the error.
        // For now, we log it. A toast notification would be better.
    });

    return unsubscribe;
};

export const deleteCampaign = async (userId: string, campaignId: string) => {
    if (!userId) throw new Error('User not logged in');
    try {
        await deleteDoc(doc(db, 'users', userId, 'campaigns', campaignId));
    } catch (error) {
        console.error("Error deleting campaign: ", error);
        throw new Error("Failed to delete campaign.");
    }
}
