'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';

interface SendLeadEmailParams {
    to: string;
    subject: string;
    html: string;
    smtpAccountId: string;
    userId: string;
}

export async function sendLeadEmail(params: SendLeadEmailParams) {
    const { to, subject, html, smtpAccountId, userId } = params;
    
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
            secure: smtpConfig.secure,
            auth: {
                user: smtpConfig.username,
                pass: smtpConfig.password,
            },
            tls: {
                rejectUnauthorized: false,
                ciphers: 'SSLv3', 
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
        console.error('Failed to send lead email:', error);
        return { success: false, error: error.message || 'Failed to send email' };
    }
}
