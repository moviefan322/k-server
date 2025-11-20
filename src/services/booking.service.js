// services/booking.service.js
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const Booking = require('../models/booking.model');
const { emailService } = require('./index');
const logger = require('../config/logger');

const toDate = (v) => (v instanceof Date ? v : new Date(v));

/**
 * Create a booking (with overlap check)
 * @param {Object} payload
 * @returns {Promise<Booking>}
 */
const createBooking = async (payload) => {
  const start = toDate(payload.start_time);
  const end = toDate(payload.end_time);

  // Sanity: end after start
  if (!(start instanceof Date) || Number.isNaN(start) || !(end instanceof Date) || Number.isNaN(end)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'start_time and end_time must be valid dates');
  }
  if (end <= start) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'end_time must be after start_time');
  }

  // Overlap check (race-safe enough for typical traffic; add transaction if you expect heavy concurrency)
  const available = await Booking.isTimeSlotAvailable(start, end);
  if (!available) {
    throw new ApiError(httpStatus.CONFLICT, 'Time slot conflicts with an existing booking');
  }

  try {
    const doc = await Booking.create({ ...payload, start_time: start, end_time: end });

    // Send booking confirmation email
    try {
      if (doc.email) {
        await emailService.sendBookingConfirmationEmail(doc.email, doc);
        logger.info(`Booking confirmation email sent to ${doc.email}`);
      }
    } catch (emailError) {
      // Log email error but don't fail the booking creation
      logger.error('Failed to send booking confirmation email:', emailError.message);
    }

    return doc;
  } catch (err) {
    // Handle duplicate key from unique index { email, start_time, end_time }
    if (err && err.code === 11000) {
      throw new ApiError(httpStatus.CONFLICT, 'Duplicate booking for this user and time range');
    }
    throw err;
  }
};

/**
 * Query bookings with pagination
 * filter: { from, to, type, email }
 * options: { sortBy, limit, page }
 */
const queryBookings = async (filter, options, extra = {}) => {
  const { type, email, from, to } = filter || {};
  const mongoFilter = {};
  if (type) mongoFilter.type = type;
  if (email) mongoFilter.email = email;
  // overlap window: start < to  AND  end > from
  if (to) mongoFilter.start_time = { $lt: new Date(to) };
  if (from) mongoFilter.end_time = { $gt: new Date(from) };

  const paginateOpts = {
    sortBy: options && options.sortBy ? options.sortBy : 'start_time:asc',
    limit: options && options.limit ? options.limit : 20,
    page: options && options.page ? options.page : 1,
  };

  if (extra && extra.projection) {
    paginateOpts.select = Array.isArray(extra.projection) ? extra.projection.join(' ') : String(extra.projection);
  }

  return Booking.paginate(mongoFilter, paginateOpts);
};

/**
 * Get booking by id
 */
const getBookingById = async (id) => {
  if (!mongoose.isValidObjectId(id)) return null;
  return Booking.findById(id);
};

/**
 * Update booking by id (re-check overlap if times change)
 */
const updateBookingById = async (id, update) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  const current = await Booking.findById(id);
  if (!current) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  // If changing times, ensure valid + available
  const nextStart = update.start_time ? toDate(update.start_time) : current.start_time;
  const nextEnd = update.end_time ? toDate(update.end_time) : current.end_time;

  if (!(nextStart instanceof Date) || Number.isNaN(nextStart) || !(nextEnd instanceof Date) || Number.isNaN(nextEnd)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'start_time and end_time must be valid dates');
  }
  if (nextEnd <= nextStart) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'end_time must be after start_time');
  }

  if (update.start_time || update.end_time) {
    const available = await Booking.isTimeSlotAvailable(nextStart, nextEnd, id);
    if (!available) {
      throw new ApiError(httpStatus.CONFLICT, 'Time slot conflicts with an existing booking');
    }
  }

  try {
    const updated = await Booking.findByIdAndUpdate(
      id,
      { ...update, start_time: nextStart, end_time: nextEnd },
      { new: true, runValidators: true }
    );
    return updated;
  } catch (err) {
    if (err && err.code === 11000) {
      throw new ApiError(httpStatus.CONFLICT, 'Duplicate booking for this user and time range');
    }
    throw err;
  }
};

/**
 * Delete booking by id
 */
const deleteBookingById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  const deleted = await Booking.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
};

/**
 * Check availability for a proposed window
 */
const checkAvailability = async (startISO, endISO) => {
  const start = toDate(startISO);
  const end = toDate(endISO);
  if (end <= start) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'end must be after start');
  }
  return Booking.isTimeSlotAvailable(start, end);
};

module.exports = {
  createBooking,
  queryBookings,
  getBookingById,
  updateBookingById,
  deleteBookingById,
  checkAvailability,
};
