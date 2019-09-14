var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');
var Product = require('../models/product');
var authService = require("../services/auth");
var User = require('../models/user');
var moment = require('moment');
var Cart = require('../models/cart');
var Order = require('../models/order');

const jwt = require("jsonwebtoken");

// var csrfProtection = csrf();
// router.use(csrfProtection);

/* GET product listing. */
router.get('/', function (req, res, next) {
  var successMsg = req.flash('success')[0];
  console.log('/ route for shop/index');
  Product.find(function (err, docs) {
    var productChunks = [];
    var chunkSize = 3;
    for (var i = 0; i < docs.length; i += chunkSize) {
      productChunks.push(docs.slice(i, i + chunkSize));
    }
    res.render('shop/index', { title: 'Shopping Cart', products: productChunks, successMsg: successMsg, noMessages: !successMsg });
  });
});

router.get('/add-to-cart/:id', (req, res, next) => {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  Product.findById(productId, (err, product) => {
    if (err) {
      return res.redirect('/');
    }
    cart.add(product, product.id);
    req.session.cart = cart;
    console.log(req.session.cart);
    res.redirect('/');
  });
});

router.delete('/user/delete/:id', (req, res, next) => {
  let userId = req.params.id;
  User.deleteOne({ _id: userId }, (err) => {
    console.log(err);
  });
  res.redirect('/user/profile');
});


router.get('/user/signup', (req, res, next) => {
  //var messages = req.flash('error');
  console.log(res.locals.loggedIn);
  if (res.locals.loggedIn) {
    res.redirect('profile');
  } else {
    res.render('user/signup');
  }
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
        res.render('user/signin', { message: "Thank you for registering! Please sign in" });
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
      res.render('user/signin', { message: "Your are not a registered user, please signup to continue." });
    } else {
      // set the last login
      docs.lastLogin = Date.now();
      req.UserId = docs._id;
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

    try {
      authService.verifyUser(token).then(user => {
        if (user) {

          var foundUser = User.findOne({ email: user.email }, (err, docs) => {
            var lastlogin = moment(docs.lastLogin).format('LLL');
            foundUsers = User.find((err, docs2) => {
              res.render('user/profile', { user: docs, users: docs2, lastlogin: lastlogin });
            });
          });
        } else {
          res.status(401);
          res.send("Invalid Authentication Token");
        }
      });
    } catch (err) {
      console.log(err);
      res.render('user/signin', { message: "Your session has Expired! Please login to continue." });
    }
  }
});

router.get("/user/logout", function (req, res, next) {
  res.cookie("jwt", "", { expires: new Date(0) });
  res.redirect("/user/signin");
});

router.get('/user/signin', (req, res, next) => {
  loggedinuser = res.locals.loggedIn;
  console.log(loggedinuser);

  if (loggedinuser) {
    res.redirect('/user/profile');
  } else {
    res.render('user/signin');
  }
});

router.get('/shopping-cart', (req, res, next) => {
  if (!req.session.cart) {
    return res.render('shop/shopping-cart', { products: null })
  }
  var cart = new Cart(req.session.cart);
  var errMsg = req.flash('error')[0];
  res.render('shop/shopping-cart', { products: cart.generateArray(), totalPrice: cart.totalPrice });
})

router.get('/checkout', (req, res, next) => {
  var errMsg = req.flash('error')[0];
  if (!req.session.cart) {
    return res.redirect('/shopping-cart');
  }
  var cart = new Cart(req.session.cart);
  res.render('shop/checkout', { total: cart.totalPrice, errMsg: errMsg, noError: !errMsg });
});

router.post('/checkout', (req, res, next) => {
  let token = req.cookies.jwt;
  let UserId = "";
  if (token) {
    let decoded = jwt.decode(token, "secretkey");
    userId = decoded.UserId;
    console.log(decoded);
  }

  if (!req.session.cart) {
    return res.redirect('/shopping-cart');
  }
  var cart = new Cart(req.session.cart);
  var stripe = require("stripe")("sk_test_jaaxtB6dn9mDaOBPAKb43a1A00AWzUss22");
  console.log(req.body.stripeToken);
  stripe.charges.create({
    amount: cart.totalPrice * 100,
    currency: "usd",
    source: req.body.stripeToken, // obtained with Stripe.js
    description: "Video Games"
  }, function (err, charge) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('/checkout');
    }  
    console.log("request.body",req.body); 
    var order = new Order({
      user: userId,
      cart: cart,
      address: req.body.address,
      name: req.body.name,
      paymentId: charge.id
    });
    console.log("Order Object: " , order);
    order.save(function (err, result) {
      if (err){
        console.log(err);
      }
      req.flash('success', 'Successfully bought product!');
      req.session.cart = null;
      res.redirect('/');
    });
  });
});

module.exports = router;