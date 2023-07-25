// review / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');
const Booking = require('./bookingModel');
const AppError = require('../utils/appError');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

// Users can only review a tour they've booked
reviewSchema.pre('save', async function (next) {
  const checkBooking = await Booking.findOne({
    user: this.user,
    tour: this.tour,
  });
  if (!checkBooking)
    return next(
      new AppError('You must first purchase this tour to leave a review!', 403)
    );

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // In static methods the "this" keyword points to the current model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0]?.nRating || 0,
    ratingsAverage: stats[0]?.avgRating || 4.5,
  });
};

reviewSchema.post('save', function () {
  // this points to current review (Document),
  // this.constructor = Review (Model)
  this.constructor.calcAverageRatings(this.tour);
});

// no need to use asyn/await here https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/learn/lecture/15065554#questions/9321370
reviewSchema.post(/^findOneAnd/, function (doc) {
  if (doc) {
    doc.constructor.calcAverageRatings(doc.tour);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
