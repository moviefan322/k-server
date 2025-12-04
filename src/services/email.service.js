const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');
const config = require('../config/config');
const logger = require('../config/logger');
const moment = require('moment-timezone');

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
  // Email to booker
  const subjectBooker = 'Booking Request Received';
  const startTime = moment(booking.start_time).tz('America/New_York').format('YYYY-MM-DD h:mm A z');
  const endTime = moment(booking.end_time).tz('America/New_York').format('YYYY-MM-DD h:mm A z');
  const textBooker = `Dear ${booking.name || 'Customer'},

Thank you for your booking request!

Booking Details:
- Type: ${booking.type || 'N/A'}
- Start Time: ${startTime}
- End Time: ${endTime}
- Email: ${booking.email}

We will let you know when your booking is confirmed.

-Katharsis`;
  await sendEmail(to, subjectBooker, textBooker);

  // Email to admin
  const adminEmail = 'lngclark7793@gmail.com';
  const subjectAdmin = 'Pending Booking Request';
  const textAdmin = `Admin,

A new booking request requires confirmation:

Booking Details:
- Name: ${booking.name || 'N/A'}
- Email: ${booking.email}
- Phone: ${booking.phone || 'N/A'}
- Type: ${booking.type || 'N/A'}
- Start Time: ${startTime}
- End Time: ${endTime}
- Notes: ${booking.notes || ''}

Please review and confirm this booking.`;
  await sendEmail(adminEmail, subjectAdmin, textAdmin);
};

/**
 * Send booking rejection email
 * @param {string} to
 * @param {Object} booking
 * @param {string} adminMessage
 * @returns {Promise}
 */
const sendBookingRejectionEmail = async (to, booking, adminMessage) => {
  const subject = 'Booking Request Rejected';
  const startTime = moment(booking.start_time).tz('America/New_York').format('YYYY-MM-DD h:mm A z');
  const endTime = moment(booking.end_time).tz('America/New_York').format('YYYY-MM-DD h:mm A z');
  const text = `Dear ${
    booking.name || 'Customer'
  },\n\nWe regret to inform you that your booking request could not be accommodated.\n\nBooking Details:\n- Type: ${
    booking.type || 'N/A'
  }\n- Start Time: ${startTime}\n- End Time: ${endTime}\n- Email: ${booking.email}\n\n${
    adminMessage ? `Message from Kaleb: ${adminMessage}\n\n` : ''
  }Sorry for the inconvenience. Please feel free to request another time or contact us for more information.\n\n-Katharsis`;
  await sendEmail(to, subject, text);
};

/**
 * Send booking actually confirmed email
 * @param {string} to
 * @param {Object} booking
 * @returns {Promise}
 */
const sendBookingActuallyConfirmedEmail = async (to, booking) => {
  const subject = 'Your Booking is Confirmed';
  const startTime = moment(booking.start_time).tz('America/New_York').format('YYYY-MM-DD h:mm A z');
  const endTime = moment(booking.end_time).tz('America/New_York').format('YYYY-MM-DD h:mm A z');
  const text = `Dear ${booking.name || 'Customer'},\n\nYour booking has been confirmed!\n\nBooking Details:\n- Type: ${
    booking.type || 'N/A'
  }\n- Start Time: ${startTime}\n- End Time: ${endTime}\n- Email: ${
    booking.email
  }\n\nThank you for booking with us. We look forward to seeing you!\n\n-Katharsis`;
  await sendEmail(to, subject, text);
};

module.exports = {
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendBookingConfirmationEmail,
  sendBookingRejectionEmail,
  sendBookingActuallyConfirmedEmail,
};
