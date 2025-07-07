import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, serverTimestamp, writeBatch } from 'firebase/firestore';

export interface RecipientList {
    id: string;
    name: string;
    description: string;
    count: number;
}

export const addRecipientList = async (userId: string, listData: { name: string, description: string, emails: string[] }) => {
    if (!userId) throw new Error('User not logged in');

    try {
        const { name, description, emails } = listData;
        
        // In a real production app, you would not store large email lists this way.
        // You'd use a subcollection and batch writes. For this app, we'll
        // just create the list document and assume email handling is done elsewhere.
        const listDoc = {
            name,
            description,
            count: emails.length,
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'users', userId, 'recipientLists'), listDoc);
        
        // Example of how you would handle subcollections with batching:
        /*
        const batch = writeBatch(db);
        const emailsCollection = collection(db, 'users', userId, 'recipientLists', docRef.id, 'emails');
        emails.forEach(email => {
            const emailDocRef = doc(emailsCollection);
            batch.set(emailDocRef, { email });
        });
        await batch.commit();
        */

        return docRef.id;
    } catch (error) {
        console.error("Error adding recipient list: ", error);
        throw new Error("Failed to create recipient list.");
    }
};

export const getRecipientLists = (userId: string, callback: (lists: RecipientList[]) => void) => {
    if (!userId) return () => {};

    const q = query(collection(db, 'users', userId, 'recipientLists'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const lists: RecipientList[] = [];
        querySnapshot.forEach((doc) => {
            lists.push({ id: doc.id, ...doc.data() } as RecipientList);
        });
        callback(lists);
    }, (error) => {
        console.error("Error fetching recipient lists: ", error);
    });

    return unsubscribe;
};
