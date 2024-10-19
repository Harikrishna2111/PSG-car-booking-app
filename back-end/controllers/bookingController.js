// imports
const asyncHandler = require("express-async-handler");
const path = require("path");
const Booking = require("../models/booking");
const User = require("../models/users");
const { body, validationResult } = require("express-validator");

// configuring multer to handle multipart formdata (images)
// and upload those images to the /uploads folder in the root
const multer = require('multer')
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// initialize the multer object with which we can successfully upload 
// images to our server
const upload = multer({storage, limits: {fileSize: 10 * 1024 * 1024}})

// a list of middlewares to handle a 'book' POST request
module.exports.book_post = [
  
  body("first")
  .trim()
  .escape(),
  body("last")
  .trim()
  .escape(),
  body("email")
  .trim()
  .isEmail()
  .withMessage("Please Enter a Valid Email!")
  .escape(),
  body("pickLoc")
  .trim()
  .notEmpty()
  .escape(),
  body("dropLoc")
  .trim()
  .notEmpty()
  .escape(),
  body("reference")
  .trim()
  .escape(),
  body("no_of_ppl")
  .trim()
  .escape(),
  
  upload.single("imageData"), 
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.send({
        errors: errors.array(),
        booked : false
      });
    }

    else{
      const booking = new Booking({...req.body, user: req.user._id, img: "images/" + req.file.filename});
      await booking.save();
      return res.json({booked: true, booking});
    }
    
  }),
];


// a simple controller function to handle 'booking history' GET request
module.exports.booking_history_get = asyncHandler(async (req, res, next) => {
  const bookingHistory = await Booking.find({user: req.user._id, isOnGoing: true});
  res.json({history: bookingHistory});
})

// a simple controller function to handle 'on going bookings' GET request
module.exports.on_going_bookings_get = asyncHandler(async (req, res, next) => {
  const ongoingBookings = await Booking.find({isOnGoing: true});
  return res.json({bookings: ongoingBookings})
})

// a simple controller function to handle 'confirm booking' POST request
module.exports.confirm_booking_post = asyncHandler(async (req, res, next) => {
  const {bookingId, confirmed} = req.body;
  const booking = await Booking.findById(bookingId);

  if (!booking) return res.json({error: "Booking Does Not Exist!"});

  const newBooking = new Booking({
    ...booking,
    bookingStatus: (confirmed) ? true : false,
    isOnGoing: (confirmed) ? true : false
  })

  await Booking.findByIdAndUpdate(bookingId, newBooking);
  res.json({bookingStatus: newBooking.bookingStatus})
})
  
  