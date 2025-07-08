
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, serverTimestamp, writeBatch, doc, getDocs } from 'firebase/firestore';

export interface RecipientList {
    id: string;
    name: string;
    description: string;
    count: number;
}

export const addRecipientList = async (userId: string, listData: { name: string, description: string, emails: string[] }) => {
    if (!userId) throw new Error('User not logged in');

    const { name, description, emails } = listData;
    const batch = writeBatch(db);

    try {
        const listCollectionRef = collection(db, 'users', userId, 'recipientLists');
        const newListRef = doc(listCollectionRef); // Create a reference with a new ID

        const listDoc = {
            name,
            description,
            count: emails.length,
            createdAt: serverTimestamp(),
        };
        batch.set(newListRef, listDoc);
        
        const recipientsCollectionRef = collection(db, 'users', userId, 'recipientLists', newListRef.id, 'recipients');
        emails.forEach(email => {
            if(email && email.trim() !== '') {
                const emailDocRef = doc(recipientsCollectionRef);
                batch.set(emailDocRef, { email: email.trim(), addedAt: serverTimestamp() });
            }
        });

        await batch.commit();
        return newListRef.id;

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

export const getRecipientsForList = async (userId: string, listId: string): Promise<string[]> => {
    if (!userId || !listId) return [];
    try {
        const recipientsColRef = collection(db, 'users', userId, 'recipientLists', listId, 'recipients');
        const snapshot = await getDocs(recipientsColRef);
        return snapshot.docs.map(doc => doc.data().email as string);
    } catch (error) {
        console.error("Error fetching recipients: ", error);
        throw new Error("Failed to fetch recipients.");
    }
}
