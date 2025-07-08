
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, serverTimestamp, writeBatch, doc, getDocs, Timestamp, orderBy, updateDoc, deleteDoc, increment } from 'firebase/firestore';

export interface RecipientList {
    id: string;
    name: string;
    description: string;
    count: number;
}

export interface Recipient {
    id: string;
    email: string;
    addedAt: Date;
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

export const getRecipientList = (userId: string, listId: string, callback: (list: RecipientList | null) => void) => {
    if (!userId || !listId) return () => {};
    const listDocRef = doc(db, 'users', userId, 'recipientLists', listId);
    
    const unsubscribe = onSnapshot(listDocRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() } as RecipientList);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error fetching recipient list details: ", error);
        callback(null);
    });
    
    return unsubscribe;
}

export const getRecipients = (userId: string, listId: string, callback: (recipients: Recipient[]) => void) => {
    if (!userId || !listId) return () => {};
    const recipientsColRef = collection(db, 'users', userId, 'recipientLists', listId, 'recipients');
    const q = query(recipientsColRef, orderBy('addedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const recipients: Recipient[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            recipients.push({
                id: doc.id,
                email: data.email,
                addedAt: (data.addedAt as Timestamp)?.toDate()
            } as Recipient)
        });
        callback(recipients);
    }, (error) => {
        console.error("Error fetching recipients: ", error);
    });

    return unsubscribe;
}

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

export const updateRecipientList = async (userId: string, listId: string, data: { name: string; description: string }) => {
    if (!userId) throw new Error('User not logged in');
    const listRef = doc(db, 'users', userId, 'recipientLists', listId);
    await updateDoc(listRef, data);
};

export const deleteRecipientList = async (userId: string, listId: string) => {
    if (!userId) throw new Error('User not logged in');

    const batch = writeBatch(db);
    const listRef = doc(db, 'users', userId, 'recipientLists', listId);
    const recipientsColRef = collection(db, 'users', userId, 'recipientLists', listId, 'recipients');
    
    try {
        // Delete all recipient documents in the subcollection
        const recipientsSnapshot = await getDocs(recipientsColRef);
        recipientsSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Delete the main list document
        batch.delete(listRef);

        await batch.commit();
    } catch (error) {
        console.error("Error deleting recipient list: ", error);
        throw new Error("Failed to delete recipient list and its recipients.");
    }
};

export const addRecipientsToList = async (userId: string, listId: string, emails: string[]) => {
    if (!userId) throw new Error('User not logged in');
    if (emails.length === 0) return;

    const batch = writeBatch(db);
    const listRef = doc(db, 'users', userId, 'recipientLists', listId);
    const recipientsColRef = collection(db, 'users', userId, 'recipientLists', listId, 'recipients');

    try {
        emails.forEach(email => {
            if (email && email.trim() !== '') {
                const emailDocRef = doc(recipientsColRef);
                batch.set(emailDocRef, { email: email.trim(), addedAt: serverTimestamp() });
            }
        });
        batch.update(listRef, { count: increment(emails.length) });
        await batch.commit();
    } catch (error) {
        console.error("Error adding recipients to list: ", error);
        throw new Error("Failed to add new recipients.");
    }
};

export const deleteRecipient = async (userId: string, listId: string, recipientId: string) => {
    if (!userId) throw new Error('User not logged in');

    const batch = writeBatch(db);
    const listRef = doc(db, 'users', userId, 'recipientLists', listId);
    const recipientRef = doc(db, 'users', userId, 'recipientLists', listId, 'recipients', recipientId);

    try {
        batch.delete(recipientRef);
        batch.update(listRef, { count: increment(-1) });
        await batch.commit();
    } catch (error) {
        console.error("Error deleting recipient: ", error);
        throw new Error("Failed to delete recipient.");
    }
};
