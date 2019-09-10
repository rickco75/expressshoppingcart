var Product = require('../models/product');
var mongoose = require('mongoose');

//mongoose.connect('mongodb://127.0.0.1:27017/shopping',{ useNewUrlParser: true });
mongoose.connect('mongodb://dbuser:Password1!@ds015750.mlab.com:15750/heroku_w8bbv3s7', { useNewUrlParser: true });

var products = [new Product({
    imagePath: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/Gothiccover.png/220px-Gothiccover.png',
    title: 'Gothic Video Game',
    description: 'Awesome Game!!!',
    price: 10
}),
new Product({
    imagePath: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/Gothiccover.png/220px-Gothiccover.png',
    title: 'Gothic Video Game',
    description: 'Awesome Game!!!',
    price: 10
}),
new Product({
    imagePath: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/Gothiccover.png/220px-Gothiccover.png',
    title: 'Gothic Video Game',
    description: 'Awesome Game!!!',
    price: 10
}),
new Product({
    imagePath: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/Gothiccover.png/220px-Gothiccover.png',
    title: 'Gothic Video Game',
    description: 'Awesome Game!!!',
    price: 10
}),
new Product({
    imagePath: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/Gothiccover.png/220px-Gothiccover.png',
    title: 'Gothic Video Game',
    description: 'Awesome Game!!!',
    price: 10
}),
new Product({
    imagePath: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/Gothiccover.png/220px-Gothiccover.png',
    title: 'Gothic Video Game',
    description: 'Awesome Game!!!',
    price: 10
})
];

var done = 0;
for (var i = 0; i < products.length; i++){
    products[i].save(function(err,result){
        done++;
        if(done === products.length) {
            exit();
        }
    });
}

function exit(){
    mongoose.disconnect();
}