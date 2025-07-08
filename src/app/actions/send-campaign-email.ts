
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';

interface SendCampaignEmailParams {
    to: string;
    subject: string;
    html: string;
    userId: string;
    smtpAccountId: string;
}

export async function sendCampaignEmail(params: SendCampaignEmailParams) {
    const { to, subject, html, userId, smtpAccountId } = params;
    
    if (!userId) {
        return { success: false, error: 'Authentication required.' };
    }

    try {
        const accountDocRef = doc(db, 'users', userId, 'smtpAccounts', smtpAccountId);
        const accountDoc = await getDoc(accountDocRef);

        if (!accountDoc.exists()) {
            return { success: false, error: 'SMTP account not found.' };
        }

        const smtpConfig = accountDoc.data();

        if (!smtpConfig.password) {
            return { success: false, error: 'SMTP account credentials are not complete.' };
        }

        const transporter = nodemailer.createTransport({
            host: smtpConfig.server,
            port: smtpConfig.port,
            secure: smtpConfig.secure, // true for 465, false for other ports
            auth: {
                user: smtpConfig.username,
                pass: smtpConfig.password,
            },
            // This setting is crucial for compatibility with many hosting providers
            // like Hostinger who may use self-signed or non-standard SSL certificates.
            tls: {
                rejectUnauthorized: false,
                ciphers: 'SSLv3', // This is the key fix for Hostinger compatibility
            },
        });

        await transporter.sendMail({
            from: `"${smtpConfig.username}" <${smtpConfig.username}>`,
            to: to,
            subject: subject,
            html: html,
        });

        return { success: true };

    } catch (error: any) {
        console.error('Failed to send campaign email:', error);
        return { success: false, error: error.message || 'Failed to send email' };
    }
}
