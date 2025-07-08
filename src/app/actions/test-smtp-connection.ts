
'use server';

import nodemailer from 'nodemailer';
import type { SmtpAccountData } from '@/services/smtp';

// The input for this action now includes the recipient email and an optional message
type TestConnectionParams = SmtpAccountData & {
    testEmail: string;
    testMessage?: string;
};

export async function testSmtpConnection(accountData: TestConnectionParams) {
    try {
        const { server, port, secure, username, password, testEmail, testMessage } = accountData;

        if (!password) {
            return { success: false, error: 'Password is required for testing.' };
        }
        if (!testEmail) {
            return { success: false, error: 'Test recipient email is required.' };
        }

        const transporter = nodemailer.createTransport({
            host: server,
            port,
            secure,
            auth: {
                user: username,
                pass: password,
            },
            tls: {
                rejectUnauthorized: false,
                ciphers: 'SSLv3',
            },
        });

        // Verify the connection first
        await transporter.verify();
        
        const defaultSubject = 'MailCannon SMTP Configuration Verified';
        const defaultHtml = '<h1>Success!</h1><p>Your SMTP account was successfully verified and is now ready to use with MailCannon.</p>';
        const defaultText = 'Your SMTP account was successfully verified and is now ready to use with MailCannon.';

        // Then send a test email to the specified recipient to confirm send capability
        await transporter.sendMail({
            from: `"${username}" <${username}>`,
            to: testEmail, // Use the provided test email
            subject: defaultSubject,
            text: testMessage || defaultText, // Use custom message or default
            html: testMessage ? `<p>${testMessage.replace(/\n/g, '<br>')}</p>` : defaultHtml, // Use custom message or default
        });

        return { success: true };

    } catch (error: any) {
        console.error('Failed to verify SMTP connection:', error);
        
        let errorMessage = `Connection failed: ${error.message}`;
        if (error.code === 'EAUTH') {
            errorMessage = 'Authentication failed. Please check your username and password.';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Connection timed out. Please check your server and port.';
        }

        return { success: false, error: errorMessage };
    }
}
