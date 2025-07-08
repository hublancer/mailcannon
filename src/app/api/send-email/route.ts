
// src/app/api/send-email/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Define the expected request body structure
interface SendEmailRequest {
  to: string;
  subject: string;
  html: string;
  userId: string; // The ID of the user who owns the SMTP account
  fromEmailId: string; // The ID of the SMTP account document in Firestore
}

// Define the structure for SMTP account data stored in Firestore
interface SmtpAccount {
  server: string;
  port: number;
  secure: boolean;
  username: string;
  password?: string; // Password should be stored securely
}

/**
 * Handles POST requests to send an email.
 * @param request - The incoming NextRequest object.
 */
export async function POST(request: NextRequest) {
  // 1. Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: getCorsHeaders() });
  }

  try {
    // 2. Secure the endpoint with an API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.EMAIL_API_SECRET_KEY) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: getCorsHeaders(),
      });
    }

    const body: SendEmailRequest = await request.json();
    const { to, subject, html, userId, fromEmailId } = body;

    // Validate request body
    if (!to || !subject || !html || !userId || !fromEmailId) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Missing required fields' }), {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    // 3. Load SMTP configuration from Firestore using the user-specific path
    const accountDocRef = doc(db, 'users', userId, 'smtpAccounts', fromEmailId);
    const accountDoc = await getDoc(accountDocRef);

    if (!accountDoc.exists()) {
      return new NextResponse(JSON.stringify({ success: false, error: 'SMTP account not found.' }), {
        status: 404,
        headers: getCorsHeaders(),
      });
    }

    const smtpConfig = accountDoc.data() as SmtpAccount;

    if (!smtpConfig.password) {
        return new NextResponse(JSON.stringify({ success: false, error: 'SMTP account credentials are not complete.' }), {
            status: 500,
            headers: getCorsHeaders(),
        });
    }

    // 4. Use Nodemailer to create transporter and send the email
    const transporter = nodemailer.createTransport({
      host: smtpConfig.server,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
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

    // Verify connection configuration
    await transporter.verify();

    const mailOptions = {
      from: `"${smtpConfig.username}" <${smtpConfig.username}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);

    // 5. Return success JSON
    return new NextResponse(JSON.stringify({ success: true, message: 'Email sent successfully' }), {
      status: 200,
      headers: getCorsHeaders(),
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return new NextResponse(JSON.stringify({ success: false, error: error.message || 'An internal server error occurred' }), {
      status: 500,
      headers: getCorsHeaders(),
    });
  }
}

/**
 * Returns CORS headers for local development.
 * In production, you should configure this more securely.
 */
function getCorsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*', // Allows all origins
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    };
}
