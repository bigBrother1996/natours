const crypto = require('crypto');
const util = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  // remove the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    password,
    passwordConfirm,
    passwordChangedAt,
    role
  } = req.body;

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    passwordChangedAt,
    role
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  // 2) check if user exist && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('incorrect email or password', 401));
  }
  // 3) if everything ok ,send token to the client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) getting the token and check if it is there
  let token = '';
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('you are not logged in please login to gain access', 401)
    );
  }

  // 2) verrification token
  const decoded = await jwt.verify(token, process.env.JWT_SECRET);

  // 3) check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('this user belonging to token does not exist', 401)
    );
  }
  // 4) check if user changed pasword after token was issued

  if (currentUser.changePaswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'user recently changed the password! Please log in again',
        401
      )
    );
  }
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

// only for rendered pages no
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verrification token
      const decoded = await jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);

      // 2) check if user still exist
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      // 3) check if user changed pasword after token was issued

      if (currentUser.changePaswordAfter(decoded.iat)) {
        return next();
      }
      // there is no logged in user
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  // roles ['admin','lead-guide']
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      next(new AppError('you are not allowed to perform this action', 403));
    } else next();
  };
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on POST email
  const user = await User.findOne({
    email: req.body.email
  });
  if (!user) {
    return next(new AppError('user does not exist with this email', 404));
  }
  // 2) generate random reset token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });
  // 3) send it to the user
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a patch request with your new password and passwordConfirm to ${resetURL}.\nIf you didn't forget your password, please ignore this email! `;

  try {
    await sendEmail({
      email: user.email,
      subject: `your password reset token (valid 10 minutes)`,
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token send to email!'
    });
  } catch (err) {
    user.createPasswordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('there were an error sending email.try again later', 500)
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() }
  });

  // if token has not expired and there is a user set new password
  if (!user) return next(new AppError('Token is invalid or has expired'), 400);
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save();
  // update change passwordAt property for the user
  // log the user in send the JWT to the client
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // get user from the collection
  const user = await User.findById(req.user.id).select('+password');
  // check password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('your password is incorrect '), 401);
  }

  // if so update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // log the user, send JWT
  createSendToken(user, 200, res);
});
