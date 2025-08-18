const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const optionalAuth = require('../../middlewares/optionalAuth');
const bookingValidation = require('../../validations/booking.validation');
const bookingController = require('../../controllers/booking.controller');

const router = express.Router();

router.route('/').post(validate(bookingValidation.createBooking), bookingController.createBooking).get(
  optionalAuth, // 👈 parses token if present
  validate(bookingValidation.getBookingsPublic),
  bookingController.getBookings // 👈 unified handler
);

router.get('/availability', validate(bookingValidation.checkAvailability), bookingController.checkAvailability);

router
  .route('/:bookingId')
  .get(auth('getBookings'), validate(bookingValidation.getBooking), bookingController.getBooking)
  .patch(auth('manageBookings'), validate(bookingValidation.updateBooking), bookingController.updateBooking)
  .delete(auth('manageBookings'), validate(bookingValidation.deleteBooking), bookingController.deleteBooking);

module.exports = router;
