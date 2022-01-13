const AppError = require('../utils/appError');

const handleJwtError = err =>
  new AppError(`Invalid Token! please login again`, 401);

const handleTokenExpires = err =>
  new AppError(`Your token has expired! please login again`, 401);

const handleCastErrorDB = err => {
  const message = `invalid ${err.path} :${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateErrorDB = err => {
  const message = `Duplicate field value :${
    err.keyValue
  }. Please user another value`;
  return new AppError(message, 400);
};
const handleValidationErrDB = err => {
  const errors = Object.values(err.errors).map(
    value => value.message
  );
  const message = `invalid input Data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};
////////development mode
const sendErrorDev = (err, req, res) => {
  // A) api
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack
    });
  }
  // B) rendered website
  console.error('ERROR : " :( " ', err);
  return res.status(err.statusCode).render('error', {
    title: 'something went wrong',
    msg: err.message
  });
};

///////production mode
const sendErrorProd = (err, req, res) => {
  // A) api
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      console.log(req.originalUrl);
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    ////////// programming or mongoose error which client supposed to dont know
    // 1 log error
    console.error('ERROR : ', err);
    // 2 send generic message
    return res.status(500).json({
      status: 'error',
      message: 'something wrong'
    });
  }

  /// RENDERED WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'something went wrong',
      msg: err.message
    });
  }
  ////////// programming or mongoose error which client supposed to dont know
  // 1 log error
  // console.error('ERROR : ', err);
  // 2 send generic message
  return res.status(err.statusCode).render('error', {
    title: 'something went wrong',
    msg: 'please try again later'
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = err;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateErrorDB(error);
    if (err.name === 'ValidationError')
      error = handleValidationErrDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJwtError();
    if (err.name === 'TokenExpiredError')
      error = handleTokenExpires();

    sendErrorProd(error, req, res);
    console.log(error);
  }
  next();
};
