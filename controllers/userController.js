const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {
    active: false
  });
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // create error if user posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'this route not for updating user password. Please use /updatePassword route',
        400
      )
    );
  }
  // filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // update user document
  const updateUser = await User.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: { user: updateUser }
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'server error',
    message: 'this route has not been defined'
  });
};
exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'server error',
    message: 'this route has not been defined'
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'server error',
    message: 'this route has not been defined'
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'server error',
    message: 'this route has not been defined'
  });
};
