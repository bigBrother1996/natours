const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `invalid ${err.path} :${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateErrorDB = err => {
  const message = `Duplicate field value :${
    err.keyValue.name
  }. Please user another value`;
  return new AppError(message, 400);
};
const handleValidationErrDB = err => {
  const errors = Object.values(err.errors).map(value => value.message);
  const message = `invalid input Data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};
////////development mode
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
};
///////production mode
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }
  ////////// programming or mongoose error which client supposed to dont know
  else {
    // 1 log error
    console.error('ERROR : ', err);
    // 2 send generic message
    res.status(500).json({
      status: 'error',
      message: 'something wrong'
    });
  }
};
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = err;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateErrorDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrDB(error);

    sendErrorProd(error, res);
    console.log(error);
  }

  next();
};
