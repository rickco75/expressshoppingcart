var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');
var Product = require('../models/product');
var authService = require("../services/auth");
var User = require('../models/user');

// var csrfProtection = csrf();
// router.use(csrfProtection);

/* GET product listing. */
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
  res.render('user/signup');
});

router.post("/user/signup", function (req, res, next) {
  var password = authService.hashPassword(req.body.password);
  var email = req.body.email;
  var user = new User({ 
      email: email, 
      password: password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      city: req.body.city,
      state: req.body.state,
      phone: req.body.phone      
    });
  var foundUser = User.find({ email: email }, (err, docs) => {
    if (docs.length == 0) {
      user.save(function (err, doc) {
        if (err) return console.error(err);
        console.log(doc.email + " saved to users collection.");
        res.render('user/signin', { message: "Thank you for registering! Please signin" });
      });
    } else {
      console.log('user already exists!')
      res.render('user/signin', { message: "Your username already exists please log in!" });
    }
  });
});

router.post("/user/signin", (req, res, next) => {
  var email = req.body.email;
  var password = req.body.password;
  var foundUser = User.findOne({ email: email }, (err, docs) => {
    if (!docs) {
      res.render('user/signin', { message: "Your are not a registered user" });
    } else {

      // set the last login
      docs.lastLogin = Date.now();
      docs.save();

      let passwordMatch = authService.comparePasswords(
        password,
        docs.password
      );
      if (passwordMatch) {
        console.log('password match!')
        let token = authService.signUser(docs);
        res.cookie("jwt", token);
        res.redirect('/user/profile');
      }
    }
  });
})

router.get('/user/profile', (req, res, next) => {
  let token = req.cookies.jwt;
  if (token) {
    try{

      authService.verifyUser(token).then(user => {
        if (user) {
          console.log(user.email);
          var foundUser = User.findOne({ email: user.email }, (err, docs) => {
            console.log('valid user');
            res.render('user/profile', { user: docs });
          });
        } else {
          res.status(401);
          res.send("Invalid Authentication Token");
        }
      });
    } catch(err){
      //console.log(err);
      res.send("Your session has Expired! Please login to continue.");
    }
  }
});

router.get("/user/logout", function (req, res, next) {
  res.cookie("jwt", "", { expires: new Date(0) });
  res.redirect("/user/signin");
});

router.get('/user/signin', (req, res, next) => {
  res.render('user/signin');
});

module.exports = router;
