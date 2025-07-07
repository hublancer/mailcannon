'use server';

import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import { updateSmtpAccountStatus } from '@/services/smtp';

interface SendTestEmailParams {
    smtpAccountId: string;
    toEmail: string;
}

export async function sendTestEmail({ smtpAccountId, toEmail }: SendTestEmailParams) {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: 'Authentication required.' };
    }

    try {
        const accountDocRef = doc(db, 'users', user.uid, 'smtpAccounts', smtpAccountId);
        const accountDoc = await getDoc(accountDocRef);

        if (!accountDoc.exists()) {
            return { success: false, error: 'SMTP account not found.' };
        }

        const smtpConfig = accountDoc.data();

        const transporter = nodemailer.createTransport({
            host: smtpConfig.server,
            port: smtpConfig.port,
            secure: smtpConfig.port === 465, // true for 465, false for other ports
            auth: {
                user: smtpConfig.username,
                pass: smtpConfig.password,
            },
            // Add this to trust self-signed certs, common in development/testing
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verify connection configuration
        await transporter.verify();

        await transporter.sendMail({
            from: `"${smtpConfig.username}" <${smtpConfig.username}>`,
            to: toEmail,
            subject: 'MailCannon - SMTP Test Email',
            text: 'This is a test email from MailCannon to confirm your SMTP settings are working correctly.',
            html: '<p>This is a test email from MailCannon to confirm your SMTP settings are working correctly.</p>',
        });

        await updateSmtpAccountStatus(user.uid, smtpAccountId, 'Connected');
        
        return { success: true };

    } catch (error: any) {
        console.error('Failed to send test email:', error);
        // Best effort to update status, don't block response if this fails
        try {
           await updateSmtpAccountStatus(user.uid, smtpAccountId, 'Error');
        } catch (statusError) {
           console.error('Failed to update status to Error:', statusError);
        }
        return { success: false, error: `Connection failed: ${error.message}` };
    }
}
