const morgan = require('morgan');
const express = require('express');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const app = express();
// middlewares

app.use(express.json());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.static('public'));

app.use((req, res, next) => {
  const time = (req.requestedTime = new Date().toISOString());
  console.log(time);
  next();
});

// routes
app.use('/api/v1/tours', require('./routes/tourRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));

app.all('*', (req, res, next) => {
  next(new AppError(`cannot get ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
