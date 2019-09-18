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

// SHOP GET MAIN PRODUCTS PAGE
router.get('/', function (req, res, next) {
  var successMsg = req.flash('success')[0];
  console.log("is user logged in? ", res.locals.loggedIn);
  Product.find(function (err, docs) {
    var productChunks = [];
    var chunkSize = 3;
    for (var i = 0; i < docs.length; i += chunkSize) {
      productChunks.push(docs.slice(i, i + chunkSize));
    }
    res.render('shop/index', { title: 'Shopping Cart', products: productChunks, successMsg: successMsg, noMessages: !successMsg });
  });
});

// SHOP: REDUCE ITEM BY ONE SHOPPING CART
router.get('/reduce/:id', (req, res, next) => {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  cart.reduceByOne(productId);
  req.session.cart = cart;
  res.redirect('/shopping-cart');
});

// SHOP: REMOVE ITEM FROM CART
router.get('/remove/:id', (req, res, next) => {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.removeItem(productId);
  req.session.cart = cart;
  res.redirect('/shopping-cart');

});

// SHOP: ADD PRODUCT TO CART 
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

// USER DELETE USER/:ID
router.delete('/user/delete/:id', (req, res, next) => {
  let userId = req.params.id;
  User.deleteOne({ _id: userId }, (err) => {
    console.log(err);
  });
  res.redirect('/user/profile');
});

// USER GET SIGNUP
router.get('/user/signup', (req, res, next) => {
  //var messages = req.flash('error');
  console.log(res.locals.loggedIn);
  if (res.locals.loggedIn) {
    res.redirect('profile');
  } else {
    res.render('user/signup');
  }
});

// USER: POST SIGNUP
router.post("/user/signup", function (req, res, next) {
  var password = authService.hashPassword(req.body.password);
  var email = req.body.email;
  // if(req.session.oldUrl){
  //   var oldUrl = req.session.
  //   req.session.oldUrl = null;
  //   res.redirect(oldUrl);
  // } else {
  //   res.redirect("/user/profile");
  // }
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

// USER: GET SIGNIN
router.get('/user/signin', (req, res, next) => {
  loggedinuser = res.locals.loggedIn;
  console.log(loggedinuser);

  if (loggedinuser) {
    res.redirect('/user/profile');
  } else {
    res.render('user/signin');
  }
});

// USER: POST SIGNIN
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
        console.log("session.oldUrl", req.session.oldUrl);
        if (req.session.oldUrl) {
          var oldUrl = req.session.oldUrl;
          req.session.oldUrl = null;
          res.redirect(oldUrl);
        } else {
          res.redirect('/user/profile');
        }
      }
    }
  });
})

// USER: GET PROFILE
router.get('/user/profile', (req, res, next) => {
  var stripe = require('stripe')('sk_test_jaaxtB6dn9mDaOBPAKb43a1A00AWzUss22');
  let token = req.cookies.jwt;
  console.log("token", token);
  if (token) {
    try {
      authService.verifyUser(token).then(user => {
        if (user) {
          var foundUser = User.findOne({ email: user.email }, (err, docs) => {
            var lastlogin = moment(docs.lastLogin).format('LLL');
            foundUsers = User.find((err, docs2) => {
              Order.find({ user: docs._id }, function (err, orders) {
                if (err) {
                  return res.write('Error!');
                }
                var cart;
                orders.forEach(function (order) {
                  cart = new Cart(order.cart);
                  order.items = cart.generateArray();
                });
                //console.log("orders ", orders);
                stripe.charges.list(
                  { limit: 100 },
                  function (err, charges) {
                    res.render('user/profile', { charges: charges.data, user: docs, users: docs2, lastlogin: lastlogin, orders: orders });
                  }
                );
              });
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
  else {
    res.redirect('signin');
  }
});

// USERS: LOGOUT
router.get("/user/logout", function (req, res, next) {
  res.cookie("jwt", "", { expires: new Date(0) });
  res.redirect("/user/signin");
});

// SHOP: VIEW SHOPPING CART
router.get('/shopping-cart', (req, res, next) => {
  if (!req.session.cart) {
    return res.render('shop/shopping-cart', { products: null })
  }
  var cart = new Cart(req.session.cart);
  var errMsg = req.flash('error')[0];
  res.render('shop/shopping-cart', { products: cart.generateArray(), totalPrice: cart.totalPrice });
})

// SHOP GET PLACE ORDER VIA STRIPE
router.get('/placeorder', (req, res, next) => {
  res.render('shop/placeorder');
});

// STRIPE: PAY FOR ORDER
router.post('/placeorder', (req, res, next) => {
  let token = req.body.stripeToken;

  var stripe = require("stripe")("sk_test_jaaxtB6dn9mDaOBPAKb43a1A00AWzUss22");
  console.log("Stripe Token: " + token);

  stripe.orders.pay('or_1FJPaEG1LlRFqSBCzkKNNlBV', {
    source: token,
  })

  res.send("Stripe Token: " + token);
});

// SHOP: GET CHECKOUT 
router.get('/checkout', isLoggedIn, (req, res, next) => {
  var errMsg = req.flash('error')[0];
  if (!req.session.cart) {
    return res.redirect('/shopping-cart');
  }
  var cart = new Cart(req.session.cart);
  res.render('shop/checkout', { total: cart.totalPrice, errMsg: errMsg, noError: !errMsg });
});


// SHOP: POST CHECKOUT
router.post('/checkout', isLoggedIn, (req, res, next) => {
  let token = req.cookies.jwt;
  let userId = '5d77c8bbb6d14a0c708ecd9a'; // default userId to avoid errors for order table
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
    console.log("request.body", req.body);
    var order = new Order({
      user: userId,
      cart: cart,
      address: req.body.address,
      name: req.body.name,
      paymentId: charge.id,
      phone: req.body.phone,
      city: req.body.city,
      state: req.body.state,
      zipcode: req.body.zipcode
    });
    console.log("Order Object: ", order);
    order.save(function (err, result) {
      if (err) {
        console.log(err);
      }

      req.flash('success', 'Successfully bought product!');
      req.session.cart = null;
      res.redirect('/');
    });
  });
});

// STRIPE: LIST PRODUCTS
router.get('/listproducts', (req, res, next) => {
  var stripe = require('stripe')('sk_test_jaaxtB6dn9mDaOBPAKb43a1A00AWzUss22');

  try {
    stripe.products.list(
      { limit: 10 },
      function (err, products) {
        // asynchronously called
        console.log(products.data);
        return res.render('shop/showproducts', { products: products.data });
      }
    );
  } catch (err) {
    console.log('error: ', err);
    return res.send(err);

  }
});

// STRIPE: CREATE SKU 
router.get('/createSku', (req, res, next) => {
  const stripe = require('stripe')('sk_test_jaaxtB6dn9mDaOBPAKb43a1A00AWzUss22');
  try {
    (async () => {
      const sku1 = await stripe.skus.create({
        currency: 'usd',
        inventory: { 'type': 'finite', 'quantity': 500 },
        price: 65.00,
        product: 'prod_FogKwaH2pmtqQI',
        image: '',
        attributes: { 'year': '2018', 'name': 'Download','type':'downloadable' },
      });
    })();
  } catch (err) {
    console.log(err);
  }
  res.send('skus created');
});

// STRIPE: SHOW INDIVIDUAL PRODUCT WITH SKUS
router.get('/showproduct/:id', (req, res, next) => {
  var productId = req.params.id;
  var stripe = require('stripe')('sk_test_jaaxtB6dn9mDaOBPAKb43a1A00AWzUss22');
    stripe.products.retrieve(
      productId,
      function (err, product) {
        // asynchronously called
        var images = product.images;
        var dimensions = product.package_dimensions;
        //console.log(product);
        stripe.skus.list(
          {limit:100,product:productId},
          function(err, skus) {
            // asynchronously called
            //console.log("skus: " + skus.data);
            for (i=0;i < skus.data.length;i++){
             // console.log(skus.data[i].product);
              if (skus.data[i].product == productId){
                console.log(skus.data[i]);
              }
            }
            return res.render('shop/showproduct', {skus:skus.data, product: product, images: images, dimensions:dimensions });
          }
        );        
        
        
      }
    );
})

// STRIPE: CREATE PRODUCT
router.get('/createProduct', (req, res, next) => {
  const stripe = require('stripe')('sk_test_Ax3fBL1nJ24mAZIV6tD5r2Xu00PDVgG5PW');

  const product = stripe.products.create({
    name: 'Limited Edition Video Game',
    type: 'good',
    attributes: ['name', 'description', 'year'],
    description: 'Street Fighter Series Classic',
  });
  console.log(product);
  res.send('product created');
});

// STRIPE: CREATE ORDER 
router.get('/createOrder', (req, res, next) => {
  const stripe = require("stripe")("sk_test_jaaxtB6dn9mDaOBPAKb43a1A00AWzUss22");
  stripe.orders.create({
    currency: 'usd',
    items: [
      {
        type: 'sku',
        parent: 'sku_FogKUU7ekrvkEm'
      }
    ],
    shipping: {
      name: 'Josh bergs',
      address: {
        line1: '4344 bay Street',
        city: 'Atlanta',
        state: 'GA',
        country: 'US',
        postal_code: '30338'
      }
    },
    email: 'josh.rosen@example.com'
  }, function (err, order) {
    console.log(order);
    // asynchronously called
  });
  var timeStamp = Date.now();
  var timestamp2 = moment(timeStamp).format('LLL');
  res.send('order created at ' + timestamp2);
});

// STRIPE: GET ALL ORDERS
router.get('/orders', (req, res, next) => {
  var stripe = require('stripe')('sk_test_jaaxtB6dn9mDaOBPAKb43a1A00AWzUss22');
  var orderList;
  stripe.orders.list(
    { limit: 3 },
    function (err, orders) {
      orderList = orders;
      console.log("Order List: ", orderList);
      // asynchronously called
    }
  );
  res.send(orderList);
})

// STRIPE: GET ALL TRANSACTIONS
router.get('/getTransactions', (req, res, next) => {
  var stripe = require('stripe')('sk_test_jaaxtB6dn9mDaOBPAKb43a1A00AWzUss22');
  var transactionList;
  stripe.issuing.transactions.list(
    { limit: 30 },
    function (err, transactions) {
      transactionList = transactions;
      console.log("transactions: ", transactions);
    }
  );
  res.send("transactionlist: " + transactionList);

});

module.exports = router;

function isLoggedIn(req, res, next) {
  if (res.locals.loggedIn) {
    return next();
  }
  req.session.oldUrl = req.url;
  res.redirect('user/signin');
}