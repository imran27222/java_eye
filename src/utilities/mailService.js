const nodemailer = require("nodemailer");

// Create a transporter object
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Correct Gmail SMTP server address
  port: 465, // Use 465 for SSL, or 587 for STARTTLS

  secure: true, // True for 465, false for other ports
  auth: {
    user: process.env.SMTP_EMAIL, // Your Hostinger email
    pass: process.env.SMTP_PASSWORD, // Your email password
  },
});

// Send an email
async function sendEmail(to, subject, text, html) {
  try {
    const info = await transporter.sendMail({
      from: `${process.env.SMTP_EMAIL}`, // Sender address
      to:"alik2624@gmail.com", // Receiver's email
      subject:"Testing Redis", // Subject line
      text:text, // Plain text body
      html, // HTML body (optional)
    });

    console.log("Email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

module.exports = sendEmail;
