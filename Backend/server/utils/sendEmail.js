const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password
    },
  });

  const mailOptions = {
    from: `"LaundryApp" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };