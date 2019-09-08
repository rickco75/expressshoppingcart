var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');
var Product = require('../models/product');
var authService = require("../services/auth");
var User = require('../models/user');

var csrfProtection = csrf();
router.use(csrfProtection);

/* GET users listing. */
router.get('/', function (req, res, next) {
  Product.find(function (err, docs) {
    var productChunks = [];
    var chunkSize = 3;
    for (var i = 0; i < docs.length; i += chunkSize) {
      productChunks.push(docs.slice(i, i + chunkSize));
    }
    res.render('shop/index', { title: 'Shopping Cart', products: productChunks });
  });
});


router.get('/user/signup', (req, res, next) => {
  var messages = req.flash('error');
  res.render('user/signup', { csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0 });
});

// router.post('/user/signup', passport.authenticate('local.signup', {
//   successRedirect: '/user/profile',
//   failureRedirect: '/user/signup',
//   failureFlash: true
// }));
router.post("/user/signup", function (req, res, next) {
  var password = authService.hashPassword(req.body.password);
  var email = req.body.email;
  var user = new User({ email: email, password: password });
  var foundUser = User.find({ email: email });
  if (foundUser) {
    console.log('user has been located in the database ')
  } else {
    user.save(function (err, doc) {
      if (err) return console.error(err);
      console.log(doc.email + " saved to users collection.");
    });
  }
  res.render('user/singnin');
});

router.get('/user/profile', (req, res, next) => {
  res.render('/user/profile')

});

module.exports = router;
