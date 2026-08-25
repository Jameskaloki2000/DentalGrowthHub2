const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    secure: true,
    port: 465,
    auth: {
        user: 'resend',
        pass: 'your-resend-api-key'
    }
});

transporter.sendMail({
    from: 'onboarding@resend.dev',
    to: 'dentalgrowthhub.ke@gmail.com',
    subject: 'Test Resend SMTP',
    text: 'Hello from Resend!'
}).then(info => console.log('Success:', info.messageId))
  .catch(err => console.error('Error:', err.message));
