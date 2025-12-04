const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { bookingService } = require('../services');

const createBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.createBooking(req.body);
  res.status(httpStatus.CREATED).send(booking);
});

const getBookings = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['from', 'to', 'type', 'email']); // email filter allowed for admins only
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const isAdmin = req.user && req.user.role === 'admin';

  if (!isAdmin) delete filter.email; // prevent public email filtering

  const projection = isAdmin ? null : ['_id', 'start_time', 'end_time', 'type']; // public redaction
  const result = await bookingService.queryBookings(filter, options, { projection });
  res.send(result);
});

const getBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.bookingId);
  if (!booking) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  res.send(booking);
});

const updateBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.updateBookingById(req.params.bookingId, req.body);
  res.send(booking);
});

const deleteBooking = catchAsync(async (req, res) => {
  await bookingService.deleteBookingById(req.params.bookingId);
  res.status(httpStatus.NO_CONTENT).send();
});

const checkAvailability = catchAsync(async (req, res) => {
  const { start, end } = pick(req.query, ['start', 'end']);
  if (!start || !end) throw new ApiError(httpStatus.BAD_REQUEST, 'start and end are required');
  const available = await bookingService.checkAvailability(start, end);
  res.send({ available });
});

const confirmBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.confirmBookingWithEmail(req.params.bookingId);
  res.send(booking);
});

const getUnconfirmedBookings = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // start of today
  const filter = { confirmed: false, start_time: { $gte: today } };
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await bookingService.queryBookings(filter, options);
  res.send(result);
});

/**
 * Reject (delete) a booking and send rejection email
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
const rejectBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    await bookingService.deleteBookingWithMessage(id, message);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking,
  checkAvailability,
  confirmBooking,
  getUnconfirmedBookings,
  rejectBooking,
};
