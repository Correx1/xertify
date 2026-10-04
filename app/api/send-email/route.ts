import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { apiKey, from, to, subject, bodyText, pdfBase64, filename } = await req.json();

    const resendKey = process.env.RESEND_API_KEY || apiKey;
    const sender = process.env.RESEND_FROM_EMAIL || from || 'Acme Academy <certificates@acmeacademy.org>';

    if (!to || !to.trim()) {
      return NextResponse.json(
        { error: 'Recipient email address (To) is required.' },
        { status: 400 }
      );
    }

    // If Resend API Key is missing, return a safe, simple error message
    if (!resendKey || !resendKey.trim() || resendKey.includes('your_api_key')) {
      return NextResponse.json(
        { error: 'Email service is currently unavailable. Please try again later.' },
        { status: 400 }
      );
    }

    // Call Resend REST API directly
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: sender,
        to: [to.trim()],
        subject: subject || 'Your Official Certificate',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
            <div style="margin-bottom: 20px;">
              <span style="font-size: 18px; font-weight: 800; color: #2563eb; tracking-tight: -0.5px;">Xertified</span>
            </div>
            <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">Your Official Certificate is Attached</h2>
            <p style="white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">${bodyText}</p>
            <div style="border-top: 1px solid #e2e8f0; pt: 16px; margin-top: 24px; font-size: 12px; color: #94a3b8;">
              <p>Sent securely via <strong>Xertified</strong>. Your PDF certificate is attached to this email.</p>
            </div>
          </div>
        `,
        attachments: pdfBase64 ? [
          {
            filename: filename || 'certificate.pdf',
            content: pdfBase64,
          }
        ] : [],
      }),
    });

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      return NextResponse.json(
        { error: 'Unable to send email. Please check sender/recipient email addresses.' },
        { status: resendResponse.status }
      );
    }

    return NextResponse.json({ success: true, data });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json({ error: 'An unexpected error occurred while sending emails.' }, { status: 500 });
  }
}
