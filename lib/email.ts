import nodemailer from "nodemailer";

// Create transporter object using environment variables
const transporter = nodemailer.createTransport({
  host: process.env["SMTP_HOST"],
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env["EMAIL_USER"],
    pass: process.env["EMAIL_PASS"],
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Sends an email notification using an HTML template.
 * @param email - Recipient's email address.
 * @param title - Email subject.
 * @param message - Email message or HTML.
 */
const sendEmailNotification = async (
  email: string,
  title: string,
  message: string
) => {
  try {
    // Mail options
    const mailOptions = {
      from: process.env["EMAIL_USER"],
      to: email,
      subject: title,
      html: message,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

export default sendEmailNotification;
