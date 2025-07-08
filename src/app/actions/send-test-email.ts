
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

        // This transporter configuration is critical for compatibility.
        const transporter = nodemailer.createTransport({
            host: smtpConfig.server,
            port: smtpConfig.port,
            secure: smtpConfig.secure, // Use SSL/TLS
            auth: {
                user: smtpConfig.username,
                pass: smtpConfig.password, // Password fetched from server-side
            },
            // This setting is crucial for compatibility with many hosting providers
            // like Hostinger who may use self-signed or non-standard SSL certificates.
            tls: {
                rejectUnauthorized: false,
                ciphers: 'SSLv3', // This is the key fix for Hostinger compatibility
            },
        });

        // Verify connection configuration
        await transporter.verify();

        // Send the test email
        await transporter.sendMail({
            from: `"${smtpConfig.username}" <${smtpConfig.username}>`,
            to: toEmail,
            subject: 'MailCannon - SMTP Connection Test',
            text: 'Success! This is a test email from your MailCannon application to confirm your SMTP settings are working correctly.',
            html: '<p><b>Success!</b></p><p>This is a test email from your MailCannon application to confirm your SMTP settings are working correctly.</p>',
        });

        // Update the account status to 'Connected' in Firestore
        await updateSmtpAccountStatus(user.uid, smtpAccountId, 'Connected');
        
        return { success: true };

    } catch (error: any) {
        console.error('Failed to send test email:', error);
        // If an error occurs, update the status to 'Error'
        try {
           await updateSmtpAccountStatus(user.uid, smtpAccountId, 'Error');
        } catch (statusError) {
           console.error('Failed to update status to Error:', statusError);
        }
        
        // Return a specific error message
        let errorMessage = `Connection failed: ${error.message}`;
        if (error.code === 'EAUTH') {
            errorMessage = 'Authentication failed. Please check your username and password.';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Connection timed out. Please check your server and port.';
        }

        return { success: false, error: errorMessage };
    }
}
