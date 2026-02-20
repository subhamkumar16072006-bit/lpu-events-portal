// api/send-ticket.js
// Dual-purpose: Vercel Serverless Function (production) + Express route handler (local dev)
const nodemailer = require('nodemailer');

/**
 * Creates a configured Nodemailer transporter using GMAIL_USER + GMAIL_APP_PASSWORD
 * from environment variables. Credentials are NEVER exposed to the browser.
 */
function createTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',   // auto-selects smtp.gmail.com:587 with STARTTLS
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
}

/**
 * Builds the HTML email body for a confirmed ticket booking.
 */
function buildEmailHTML({ student_name, event_name, ticket_id, student_reg_no }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: Arial, sans-serif; background:#f0f0f0; margin:0; padding:0; }
    .wrapper { max-width:560px; margin:40px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08); }
    .header { background:#FF5722; padding:32px 24px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:22px; letter-spacing:1px; }
    .header p  { color:rgba(255,255,255,0.85); margin:6px 0 0; font-size:13px; }
    .body { padding:32px 24px; }
    .body h2 { color:#222; margin-top:0; }
    .info-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f0f0f0; font-size:14px; }
    .info-row:last-child { border-bottom:none; }
    .label { color:#888; }
    .value { color:#111; font-weight:600; font-family:monospace; }
    .ticket-box { margin:24px 0; background:#FFF3E0; border:2px dashed #FF5722; border-radius:8px; padding:16px; text-align:center; }
    .ticket-box .tid { font-size:16px; font-weight:bold; color:#FF5722; letter-spacing:2px; word-break:break-all; }
    .footer { background:#fafafa; border-top:1px solid #eee; padding:16px 24px; text-align:center; font-size:12px; color:#aaa; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🎟 LPU Events Portal</h1>
      <p>Ticket Booking Confirmation</p>
    </div>
    <div class="body">
      <h2>Hi ${student_name}!</h2>
      <p style="color:#555;font-size:14px;">Your ticket for <strong>${event_name}</strong> has been confirmed. Show this email at the event entrance.</p>

      <div class="info-row"><span class="label">Student Name</span><span class="value">${student_name}</span></div>
      <div class="info-row"><span class="label">Registration No.</span><span class="value">${student_reg_no}</span></div>
      <div class="info-row"><span class="label">Event</span><span class="value">${event_name}</span></div>

      <div class="ticket-box">
        <p style="margin:0 0 6px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Ticket ID</p>
        <div class="tid">${ticket_id}</div>
      </div>

      <p style="font-size:13px;color:#888;">This ticket is unique to you. Do not share it with others. Arrive 15 minutes before the event starts.</p>
    </div>
    <div class="footer">
      LPU Events Portal &mdash; Lovely Professional University<br/>
      This is an automated email. Please do not reply.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Main handler — works as:
 *  • Vercel serverless function (export default)
 *  • Express route handler (module.exports.handler)
 */
async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { student_name, event_name, ticket_id, student_reg_no, student_email } = req.body;

    // Validate required fields
    if (!student_email || !student_name || !event_name || !ticket_id) {
        return res.status(400).json({ error: 'Missing required fields: student_email, student_name, event_name, ticket_id' });
    }

    // Validate env vars are set
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.error('[Nodemailer] GMAIL_USER or GMAIL_APP_PASSWORD not set in environment!');
        return res.status(500).json({ error: 'Email server not configured. Check GMAIL_USER and GMAIL_APP_PASSWORD in .env' });
    }

    try {
        const transporter = createTransporter();

        await transporter.sendMail({
            from: `"LPU Events Portal" <${process.env.GMAIL_USER}>`,
            to: student_email,
            subject: `🎟 Ticket Confirmed: ${event_name}`,
            html: buildEmailHTML({ student_name, event_name, ticket_id, student_reg_no }),
        });

        console.log(`[Nodemailer] ✅ Email sent to ${student_email} for event: ${event_name}`);
        return res.status(200).json({ success: true });

    } catch (err) {
        console.error('[Nodemailer] ❌ Failed to send email:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

// Vercel: default export
module.exports = handler;
module.exports.default = handler;
