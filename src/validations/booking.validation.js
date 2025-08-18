const Joi = require('joi');
const { objectId } = require('./custom.validation');

const iso = Joi.date().iso();

const createBooking = {
  body: Joi.object({
    name: Joi.string().max(120).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    type: Joi.string().required(),
    notes: Joi.string().max(2000).allow('', null),
    start_time: iso.required(),
    end_time: iso.required(),
  }),
};

const getBookingsPublic = {
  query: Joi.object({
    from: iso.required(),
    to: iso.required(),
    type: Joi.string(),
    email: Joi.string().email(), // allowed by schema; controller strips it for non-admins
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    page: Joi.number().integer().min(1).default(1),
  }),
};

const getBooking = { params: Joi.object({ bookingId: Joi.string().custom(objectId) }) };
const updateBooking = {
  params: Joi.object({ bookingId: Joi.string().custom(objectId).required() }),
  body: Joi.object({
    name: Joi.string().max(120),
    email: Joi.string().email(),
    phone: Joi.string(),
    type: Joi.string(),
    notes: Joi.string().max(2000).allow('', null),
    start_time: iso,
    end_time: iso,
  }).min(1),
};
const deleteBooking = { params: Joi.object({ bookingId: Joi.string().custom(objectId) }) };
const checkAvailability = { query: Joi.object({ start: iso.required(), end: iso.required() }) };

module.exports = {
  createBooking,
  getBookingsPublic,
  getBooking,
  updateBooking,
  deleteBooking,
  checkAvailability,
};
