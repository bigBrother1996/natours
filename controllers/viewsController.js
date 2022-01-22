const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingsModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const User = require('../models/userModel');
exports.getOverview = catchAsync(async (req, res, next) => {
  // get all tours
  const tours = await Tour.find();
  // build template
  // render that template using tour data from  alltours
  res.status(200).render('overview', {
    title: 'All tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // get specific tour and populate review
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  if (!tour) {
    return next(new AppError('there is no tour found with that name', 404));
  }
  // build template
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLogin = catchAsync(async (req, res, next) => {
  // build template
  res.status(200).render('login', {
    title: `login`
  });
});

exports.getSignup = catchAsync(async (req, res, next) => {
  // build template

  res.status(200).render('signup', {
    title: `signup`
  });
});

exports.getAccount = async (req, res) => {
  // const user = await User.findOne();
  // if (!user) {
  //   return next(new AppError('there is no user account found', 404));
  // }
  res.status(200).render('account', {
    title: `your Account`
  });
};

exports.getMytours = catchAsync(async (req, res, next) => {
  // 1 find all bookings
  const bookings = await Booking.find({ user: req.user.id });
  // 2 find tours with returned IDs
  // console.log(bookings);
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My tours',
    tours
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );
  res
    .status(200)
    .render(`account`, { title: 'Your account', user: updatedUser });
});
