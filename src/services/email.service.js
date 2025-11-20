const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');
const config = require('../config/config');
const logger = require('../config/logger');

const mailerSend = new MailerSend({
  apiKey: config.email.mailersendApiToken,
});

/* istanbul ignore next */
if (config.env !== 'test') {
  logger.info('MailerSend initialized with API token');
}

/**
 * Send an email using MailerSend API
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text) => {
  const sentFrom = new Sender(config.email.from, 'Booking System');
  const recipients = [new Recipient(to, to)];

  const emailParams = new EmailParams().setFrom(sentFrom).setTo(recipients).setSubject(subject).setText(text);

  await mailerSend.email.send(emailParams);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;
  const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send booking confirmation email
 * @param {string} to
 * @param {Object} booking
 * @returns {Promise}
 */
const sendBookingConfirmationEmail = async (to, booking) => {
  const subject = 'Booking Confirmation';
  const startTime = new Date(booking.start_time).toLocaleString();
  const endTime = new Date(booking.end_time).toLocaleString();

  const text = `Dear ${booking.name || 'Customer'},

Your booking has been confirmed!

Booking Details:
- Type: ${booking.type || 'N/A'}
- Start Time: ${startTime}
- End Time: ${endTime}
- Email: ${booking.email}

Thank you for your booking!

Best regards,
Your Booking Team`;

  await sendEmail(to, subject, text);
};

module.exports = {
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendBookingConfirmationEmail,
};
