require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const EMAIL_USER = process.env.EMAIL_USER || 'onboarding@resend.dev'; // Resend requires sending from a verified domain or this test email
const EMAIL_PASS = process.env.EMAIL_PASS || 'your-resend-api-key';
const BOOKING_URL = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ36wlbSLcwiPIYdnOzfRKPw9qYGkgEjQ7QWt-wxNy8GcDN1W9ymjXzWgIbPfiRPd_52gs226Tlt?gv=true';

// In-memory store for deduplication
// Tracks email + submission time to prevent duplicates
const scheduledEmails = new Map();

// Configure Nodemailer transporter with Resend SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    secure: true,
    port: 465,
    auth: {
        user: 'resend',
        pass: EMAIL_PASS // The Resend API Key
    }
});

// Helper: Map treatments to natural language
const mapTreatments = (treatmentsStr) => {
    if (!treatmentsStr || treatmentsStr.trim() === '') return null;
    
    // Split by comma since the frontend joins them
    const rawTreatments = treatmentsStr.split(',').map(t => t.trim());
    if (rawTreatments.length === 0) return null;

    const treatmentMap = {
        'Dental Implants': 'dental implant',
        'Veneers / Smile Makeovers': 'veneer',
        'Invisalign / Clear Aligners': 'Invisalign',
        'Braces / Orthodontics': 'orthodontics',
        'Full-Mouth Restoration': 'full-mouth restoration',
        'Teeth Whitening': 'teeth whitening',
        'Cosmetic Bonding': 'cosmetic bonding',
        'General Dentistry': 'general dentistry',
        'Other': 'other'
    };

    let mapped = rawTreatments.map(t => treatmentMap[t] || t.toLowerCase());
    mapped = mapped.filter(t => t !== 'other'); // Remove 'other' for cleaner sentence if present with actuals
    if (mapped.length === 0) return null;

    if (mapped.length === 1) return mapped[0];
    if (mapped.length === 2) return `${mapped[0]} and ${mapped[1]}`;
    
    const last = mapped.pop();
    return `${mapped.join(', ')}, and ${last}`;
};

// Helper: Format Email Copy
const formatEmail = (firstName, treatmentsSentence, clinicName) => {
    const greetingName = firstName && firstName.trim() !== '' ? firstName.trim() : 'there';
    const clinic = clinicName && clinicName.trim() !== '' ? clinicName.trim() : 'your clinic';
    const treatments = treatmentsSentence ? treatmentsSentence : 'your practice';
    
    const html = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
            <p>Hi ${greetingName},</p>
            <p>Thanks for applying for a strategy call with Dental Growth Hub.</p>
            <p>We’ve received your enquiry about growing ${treatments} at ${clinic}.</p>
            <p>Expect a WhatsApp message and a call from our team soon to confirm your details.</p>
            <p>In the meantime, book your preferred time here:</p>
            
            <p style="margin: 32px 0;">
                <a href="${BOOKING_URL}" style="background-color: #2563eb; color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">BOOK YOUR STRATEGY CALL &rarr;</a>
            </p>
            
            <p>If you have any questions or anything you’d like us to know, simply reply to this email so we can plan your meeting better.</p>
            
            <p>Looking forward to speaking with you.<br>
            James<br>
            Dental Growth Hub</p>
        </div>
    `;

    const text = `Hi ${greetingName},\n\nThanks for applying for a strategy call with Dental Growth Hub.\n\nWe’ve received your enquiry about growing ${treatments} at ${clinic}.\n\nExpect a WhatsApp message and a call from our team soon to confirm your details.\n\nIn the meantime, book your preferred time here:\n\nBOOK YOUR STRATEGY CALL -> ${BOOKING_URL}\n\nIf you have any questions or anything you’d like us to know, simply reply to this email so we can plan your meeting better.\n\nLooking forward to speaking with you.\nJames\nDental Growth Hub`;

    return { html, text };
};

app.post('/api/webhook', (req, res) => {
    // Acknowledge receipt immediately
    res.status(202).json({ status: 'ACCEPTED', message: 'Webhook received.' });

    // Extract necessary fields
    const { 
        email, 
        firstName, 
        procedures, 
        leadClassification,
        dgh_external_id, // Use the frontend-generated external ID for deduplication
        clinicName
    } = req.body;

    if (!email || !leadClassification) {
        console.log('Skipping: Missing email or classification.');
        return;
    }

    // Qualification check
    if (leadClassification !== 'HOT_LEAD' && leadClassification !== 'QUALIFIED_LEAD') {
        console.log(`Skipping: Lead classification is ${leadClassification}`);
        return;
    }

    // Deduplication check
    const dedupeKey = dgh_external_id || email;
    if (scheduledEmails.has(dedupeKey)) {
        console.log(`Skipping: Email already scheduled or sent for ${dedupeKey}`);
        return;
    }

    // Schedule the email
    scheduledEmails.set(dedupeKey, { status: 'SCHEDULED', scheduledAt: Date.now() });
    console.log(`Scheduled follow-up email for ${email} in 15 seconds.`);

    const treatmentsSentence = mapTreatments(procedures);
    const { html, text } = formatEmail(firstName, treatmentsSentence, clinicName);

    const mailOptions = {
        from: `"Dental Growth Hub" <${EMAIL_USER}>`,
        to: email,
        replyTo: EMAIL_USER,
        subject: 'Your Dental Growth Hub application — next step',
        text: text,
        html: html
    };

    // 15-second delay mechanism (15000ms)
    setTimeout(async () => {
        try {
            console.log(`\n\n🕒 [15 SECONDS PASSED] Sending scheduled email to ${email}...`);
            
            // If the user hasn't set a real App Password yet, we just mock the send so they can test the logic!
            if (EMAIL_PASS === '' || EMAIL_PASS === 'your-16-character-password') {
                console.log(`\n======================================================`);
                console.log(`[TEST MODE] Email successfully generated!`);
                console.log(`To: ${email}`);
                console.log(`Subject: ${mailOptions.subject}`);
                console.log(`Body:\n${mailOptions.text}`);
                console.log(`======================================================\n`);
                console.log(`(Note: Actual email was not sent because Google App Password is not configured yet).`);
                scheduledEmails.set(dedupeKey, { status: 'SENT', sentAt: Date.now() });
            } else {
                await transporter.sendMail(mailOptions);
                scheduledEmails.set(dedupeKey, { status: 'SENT', sentAt: Date.now() });
                console.log(`✅ Successfully sent real email to ${email}`);
            }
        } catch (error) {
            console.error(`❌ Failed to send email to ${email}:`, error);
            scheduledEmails.set(dedupeKey, { status: 'FAILED', reason: error.message, failedAt: Date.now() });
        }
    }, 15000);
});

// Local health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', uptime: process.uptime() });
});

app.listen(PORT, () => {
    console.log(`Dental Growth Hub Email Service running on port ${PORT}`);
});
