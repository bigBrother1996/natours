const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();
// GLOBAL middlewares
//set security HTTP headers
app.use(helmet());
// limit request from the same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message:
    'Too many request from this IP, please try again  in an hour'
});
app.use('/api', limiter);

// Body parser, reading date from req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());
// Data sanitize against XSS
app.use(xss());
// Prevent parametr polution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);
// Serving static files
app.use(express.static('public'));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// test middleware
app.use((req, res, next) => {
  const time = (req.requestedTime = new Date().toISOString());
  console.log(time);
  next();
});

// routes
app.use('/api/v1/tours', require('./routes/tourRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/reviews', require('./routes/reviewRoutes'));

app.all('*', (req, res, next) => {
  next(
    new AppError(`cannot get ${req.originalUrl} on this server`, 404)
  );
});

app.use(globalErrorHandler);

module.exports = app;
