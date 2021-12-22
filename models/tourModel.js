const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [
        40,
        'tour must have less than or equal to 40 characters'
      ],
      minlength: [
        6,
        'tour must have greater then or equal to 6 characters'
      ]
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'must have some duration time']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'must have a number of people in group']
    },
    difficulty: {
      type: String,
      required: [true, 'must have a level of difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'difficulty must be: easy or medium or difficult '
      }
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be above 1.0'],
      max: [5, 'rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10 // 4.6666  46.66666  47 4.7
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: {
      type: Number,
      required: [true, 'tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        // this points only current doc in new document creation
        validator: function(val) {
          return val < this.price;
        },
        message: 'Discount must ({value}) be lower than regular price'
      }
    },
    summary: { type: String, trim: true },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'tour must have cover images']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON
      type: { type: String, default: 'Point', enum: ['Point'] },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: { type: String, default: 'Point', enum: ['Point'] },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});
// virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});
// DOCUMENT MIDDLEWARE: runs before .save() and .create()

tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });

  next();
});
//////////////////////// embedding/////////////////////
// tourSchema.pre('save', async function(next) {
//   const guidePromises = this.guides.map(
//     async id => await User.findById(id)
//   );
//   this.guides = await Promise.all(guidePromises);
//   next();
// });
/////////////////////////////////////////////
// tourSchema.pre('save', function(next) {
//   console.log('will save document');
//   next();
// });
// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// query middleware
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});
tourSchema.post(/^find/, function(docs, next) {
  // console.log(`this took only ${Date.now() - this.start} milliseconds`);
  next();
});

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
