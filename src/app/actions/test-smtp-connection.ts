'use server';

import nodemailer from 'nodemailer';
import type { SmtpAccountData } from '@/services/smtp';

export async function testSmtpConnection(accountData: SmtpAccountData) {
    try {
        const { server, port, secure, username, password } = accountData;

        if (!password) {
            return { success: false, error: 'Password is required for testing.' };
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
        
        // Then send a test email to self to confirm send capability
        await transporter.sendMail({
            from: `"${username}" <${username}>`,
            to: username,
            subject: 'MailCannon SMTP Configuration Verified',
            text: 'Your SMTP account was successfully verified and is now ready to use with MailCannon.',
            html: '<h1>Success!</h1><p>Your SMTP account was successfully verified and is now ready to use with MailCannon.</p>',
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
