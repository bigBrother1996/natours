const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION , shutting down the server....');
  console.log(err.name, ';', err.message);
  process.exit(1);
});

const app = require('./app');
//remote database
// const DB = process.env.REMOTE_DATABASE.replace(
//   '<password>',
//   process.env.DATABASE_PASSWORD
// );

/////local database
const DB = process.env.LOCAL_DATABASE;
mongoose
  .connect(DB, {
    useNewUrlParser: true
  })
  .then(() => console.log('DB connected successfully'));

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`listening... on port ${port}`);
});

process.on('unhandledRejection', err => {
  console.log(err.name, ';', err.message);
  console.log('UNHANDLED REJECTION, shutting down the server....');
  server.close(() => {
    process.exit(1);
  });
});
