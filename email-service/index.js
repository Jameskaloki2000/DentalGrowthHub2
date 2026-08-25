require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3001;
const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';
const BOOKING_URL = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ36wlbSLcwiPIYdnOzfRKPw9qYGkgEjQ7QWt-wxNy8GcDN1W9ymjXzWgIbPfiRPd_52gs226Tlt?gv=true';

// In-memory deduplication store
const scheduledEmails = new Map();

// Configure Gmail SMTP transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD.replace(/\s/g, '') // strip spaces from app password
    }
});

// Startup log
const isReady = GMAIL_USER && GMAIL_APP_PASSWORD;
console.log('\n====================================================');
console.log('  Dental Growth Hub — Email Service (Gmail SMTP)');
console.log(`  Mode:     ${isReady ? '✅  LIVE — sending from ' + GMAIL_USER : '⚠️  Missing credentials in .env'}`);
console.log(`  Port:     ${PORT}`);
console.log('====================================================\n');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mapTreatments = (treatmentsStr) => {
    if (!treatmentsStr || treatmentsStr.trim() === '') return null;
    const rawTreatments = treatmentsStr.split(',').map(t => t.trim());
    const treatmentMap = {
        'Dental Implants': 'dental implants',
        'Veneers / Smile Makeovers': 'veneers & smile makeovers',
        'Invisalign / Clear Aligners': 'Invisalign / clear aligners',
        'Braces / Orthodontics': 'orthodontics',
        'Full-Mouth Restoration': 'full-mouth restoration',
        'Teeth Whitening': 'teeth whitening',
        'Cosmetic Bonding': 'cosmetic bonding',
        'General Dentistry': 'general dentistry',
        'Other': 'other treatments'
    };
    let mapped = rawTreatments.map(t => treatmentMap[t] || t).filter(t => t !== 'other treatments');
    if (mapped.length === 0) return null;
    if (mapped.length === 1) return mapped[0];
    if (mapped.length === 2) return `${mapped[0]} and ${mapped[1]}`;
    const last = mapped.pop();
    return `${mapped.join(', ')}, and ${last}`;
};

const buildEmail = (firstName, treatmentsSentence, clinicName) => {
    const name = firstName?.trim() || 'there';
    const clinic = clinicName?.trim() || 'your clinic';
    const treatments = treatmentsSentence || 'your dental services';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0a0e14,#111827);padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#e5a93c;letter-spacing:0.5px;">Dental Growth Hub</p>
            <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;">AI-Driven Patient Acquisition for Dentists</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#111827;">Hi ${name},</p>
            <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6;">
              Thanks for applying for a strategy call with <strong>Dental Growth Hub</strong>.
            </p>
            <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6;">
              We've received your enquiry about growing <strong>${treatments}</strong> at <strong>${clinic}</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
              Expect a WhatsApp message and a call from our team shortly to confirm your details and answer any questions.
            </p>
            <p style="margin:0 0 8px;font-size:16px;color:#374151;">In the meantime, lock in your preferred call time here:</p>
            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr>
                <td style="background:linear-gradient(135deg,#e5a93c,#f0c060);border-radius:8px;">
                  <a href="${BOOKING_URL}" style="display:inline-block;padding:16px 32px;font-size:16px;font-weight:700;color:#000000;text-decoration:none;letter-spacing:0.3px;">
                    Book Your Strategy Call →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:15px;color:#6b7280;line-height:1.6;">
              If you have any questions before then, simply reply to this email — I read every one personally.
            </p>
          </td>
        </tr>
        <!-- Signature -->
        <tr>
          <td style="padding:0 40px 32px;">
            <p style="margin:0;font-size:15px;color:#374151;line-height:1.8;">
              Talk soon,<br>
              <strong>James</strong><br>
              Dental Growth Hub<br>
              <a href="mailto:${GMAIL_USER}" style="color:#e5a93c;text-decoration:none;">${GMAIL_USER}</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              © ${new Date().getFullYear()} Dental Growth Hub. You're receiving this because you applied for a strategy call.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const text = `Hi ${name},\n\nThanks for applying for a strategy call with Dental Growth Hub.\n\nWe've received your enquiry about growing ${treatments} at ${clinic}.\n\nExpect a WhatsApp message and a call from our team shortly.\n\nIn the meantime, book your preferred call time here:\n${BOOKING_URL}\n\nIf you have any questions, simply reply to this email.\n\nTalk soon,\nJames\nDental Growth Hub\n${GMAIL_USER}`;

    return { html, text };
};

// ─── Webhook Endpoint ────────────────────────────────────────────────────────
app.post('/api/webhook', async (req, res) => {
    res.status(202).json({ status: 'ACCEPTED', message: 'Webhook received. Email will be sent in 15 seconds.' });

    const { email, firstName, procedures, leadClassification, dgh_external_id, clinicName } = req.body;

    console.log(`\n📨 Webhook received:`);
    console.log(`   To:             ${email}`);
    console.log(`   Name:           ${firstName}`);
    console.log(`   Clinic:         ${clinicName}`);
    console.log(`   Classification: ${leadClassification}`);

    if (!email || !leadClassification) {
        console.log('⏭  Skipping: Missing email or classification.');
        return;
    }

    if (leadClassification !== 'HOT_LEAD' && leadClassification !== 'QUALIFIED_LEAD') {
        console.log(`⏭  Skipping: Not a qualified lead (${leadClassification}).`);
        return;
    }

    const dedupeKey = dgh_external_id || email;
    if (scheduledEmails.has(dedupeKey)) {
        console.log(`⏭  Skipping: Already scheduled/sent for ${dedupeKey}.`);
        return;
    }

    scheduledEmails.set(dedupeKey, { status: 'SCHEDULED', scheduledAt: Date.now() });
    console.log(`⏰  Email scheduled for ${email} — firing in 15 seconds...`);

    const treatmentsSentence = mapTreatments(procedures);
    const { html, text } = buildEmail(firstName, treatmentsSentence, clinicName);

    const mailOptions = {
        from: `"Dental Growth Hub" <${GMAIL_USER}>`,
        to: email,
        replyTo: GMAIL_USER,
        subject: 'Your Dental Growth Hub application — next step',
        html,
        text
    };

    setTimeout(async () => {
        console.log(`\n🕒 [15s] Sending email to ${email} via Gmail SMTP...`);
        try {
            const info = await transporter.sendMail(mailOptions);
            scheduledEmails.set(dedupeKey, { status: 'SENT', sentAt: Date.now(), messageId: info.messageId });
            console.log(`✅ Email sent to ${email} | Message ID: ${info.messageId}`);
        } catch (error) {
            console.error(`❌ Failed to send to ${email}:`, error.message);
            scheduledEmails.set(dedupeKey, { status: 'FAILED', reason: error.message, failedAt: Date.now() });
        }
    }, 15000);
});

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', mode: 'Gmail SMTP', from: GMAIL_USER, uptime: Math.round(process.uptime()), scheduled: scheduledEmails.size });
});

app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
