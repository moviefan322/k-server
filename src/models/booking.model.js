// models/booking.model.js
const mongoose = require('mongoose');
const validator = require('validator');
const { toJSON, paginate } = require('./plugins');

const bookingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      // More flexible phone validation - accepts most common formats
      validate(value) {
        // Allow basic phone number patterns (digits, spaces, hyphens, parentheses, plus sign)
        const phoneRegex = /^[+]?[\d\s\-().]{7,15}$/;
        if (!phoneRegex.test(String(value))) {
          throw new Error('Invalid phone number format. Please use a valid phone number with 7-15 digits.');
        }
      },
    },
    type: {
      type: String,
      required: true,
      trim: true,
      // optional: enumerate allowed types
      // enum: ['yoga', 'bodywork', 'massage', 'private-session'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    start_time: {
      type: Date,
      required: true,
      index: true,
    },
    end_time: {
      type: Date,
      required: true,
      index: true,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Validation: end_time must be after start_time
bookingSchema.pre('validate', function (next) {
  if (this.start_time && this.end_time && this.end_time <= this.start_time) {
    return next(new Error('end_time must be after start_time'));
  }
  next();
});

// Optional: prevent *identical* duplicates per user+time range
bookingSchema.index({ email: 1, start_time: 1, end_time: 1 }, { unique: true });

// Optional (nice to have): helper to check overlap conflicts
// Usage: await Booking.isTimeSlotAvailable(new Date(s), new Date(e))
bookingSchema.statics.isTimeSlotAvailable = async function (start, end, ignoreId = null) {
  const overlapQuery = {
    // existing.start < newEnd AND existing.end > newStart
    start_time: { $lt: end },
    end_time: { $gt: start },
  };
  if (ignoreId) overlapQuery._id = { $ne: ignoreId };
  const conflict = await this.findOne(overlapQuery).lean().exec();
  return !conflict;
};

// Plugins
bookingSchema.plugin(toJSON);
bookingSchema.plugin(paginate);

/**
 * @typedef Booking
 */
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
