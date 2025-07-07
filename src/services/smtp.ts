import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, doc, updateDoc } from 'firebase/firestore';

export interface SmtpAccount {
    id: string;
    server: string;
    port: number;
    username: string;
    status: 'Connected' | 'Disconnected' | 'Error';
}

export type SmtpAccountData = Omit<SmtpAccount, 'id' | 'status'> & { password?: string };

// Note: Storing plaintext passwords in Firestore is NOT recommended for production.
// This is for demonstration purposes only. Use a secure secret management service like
// Google Secret Manager or HashiCorp Vault.
export const addSmtpAccount = async (userId: string, accountData: SmtpAccountData) => {
    if (!userId) throw new Error('User not logged in');
    try {
        await addDoc(collection(db, 'users', userId, 'smtpAccounts'), {
            ...accountData,
            status: 'Disconnected', // Default status, a real app would test the connection.
        });
    } catch (error) {
        console.error("Error adding SMTP account: ", error);
        throw new Error("Failed to add SMTP account.");
    }
};

export const getSmtpAccounts = (userId: string, callback: (accounts: SmtpAccount[]) => void) => {
    if (!userId) return () => {};

    const q = query(collection(db, 'users', userId, 'smtpAccounts'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const accounts: SmtpAccount[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Intentionally omit password from client-side data for security
            const { password, ...rest } = data;
            accounts.push({ id: doc.id, ...rest } as SmtpAccount);
        });
        callback(accounts);
    }, (error) => {
        console.error("Error fetching SMTP accounts: ", error);
    });

    return unsubscribe;
};

export const updateSmtpAccountStatus = async (userId: string, accountId: string, status: 'Connected' | 'Disconnected' | 'Error') => {
    if (!userId) throw new Error('User not logged in');
    try {
        const accountRef = doc(db, 'users', userId, 'smtpAccounts', accountId);
        await updateDoc(accountRef, { status });
    } catch (error) {
        console.error("Error updating SMTP account status: ", error);
        throw new Error("Failed to update SMTP account status.");
    }
};
