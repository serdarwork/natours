const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true, // trim only works for String
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
      // validate: [
      //   validator.isAlpha,
      //   'Tour name must contains only letters (a-z / A-Z)',
      // ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour mush have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // 4.666666, 46.6666, 47, 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      // this keyword only points to current document on NEW document creation, not for update
      validate: {
        validator: function (val) {
          return val < this.price; // 100 < 200
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour mush have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String], // An array of String
    createdAt: {
      type: Date,
      default: Date.now, //https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/learn/lecture/15065096#questions/14026396
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      // [longitude, latitude]
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Creating index (After schema declaration)
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// Virtual properties (requires toJSON: { virtuals: true } option on the schema)
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // from reviewModel
  localField: '_id', // Id that is stored in the current model (tourModel)
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create() but not .insertMany( or findOneandUpdate
tourSchema.pre('save', function (next) {
  // this points to the current document with VIRTUAL properties
  this.slug = slugify(this.name, { lower: true });
  // It's always the best practice to include next() in every middleware, If you call `next()` with an argument, that argument is assumed to be an error.
  next();
});

// Embedded guides
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });

// // post middleware functions are executed after all the pre middleware functions
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// Mongoose will **not** call the middleware function, if middlewares were defined after the model was compiled
// QUERY MIDDLEWARE: use regex to runs for .find(), and .findOne()
tourSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();

  next();
});

// Populate guides
tourSchema.pre(/^find/, function (next) {
  // this points to the current query (So, no need to use ASYNC-AWAIT)
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

// this middleware is going to run after the query has already executed
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} miliseconds!`);
  next();
});

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   // this points to the current aggregation object
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema); // 'Tour' string here points to name of the collection: tours

module.exports = Tour;
