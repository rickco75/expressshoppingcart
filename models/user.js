var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var userSchema = new Schema({
    email: {type:String,required:true},
    password: {type:String,required:true},
    firstName: {type:String,required:false},
    lastName: {type:String,required:false},
    city: {type:String,required:false},
    state: {type:String,required:false},
    phone: {type:String,required:false},
    admin: {type:Boolean,default:0},
    lastLogin: {type:Date,default:Date.now()}
})


userSchema.method.encryptPassworld = function(passport) {
    return bcrypt.hashSync(password,bcrypt.genSaltSync(5), null);
};

userSchema.method.validPassword = function(passport) {
    return bcrypt.compareSync(passport,this.password);
}
module.exports = mongoose.model('User',userSchema);