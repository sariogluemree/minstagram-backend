const nodemailer = require('nodemailer');

// Gmail SMTP veya başka bir SMTP servisini kullanabilirsin.
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,  // Gmail adresin
        pass: process.env.EMAIL_PASS   // Gmail şifren veya uygulama şifren
    }
});

const sendVerificationEmail = async (email, verificationCode) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification Code',
            text: `Your verification code is: ${verificationCode}`
        };

        await transporter.sendMail(mailOptions);
        //console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error('Error sending verification email:', error);
    }
};

module.exports = sendVerificationEmail;
