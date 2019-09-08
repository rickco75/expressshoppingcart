var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var userSchema = new Schema({
    email: {type:String,required:true},
    password: {type:String,required:true}
})


userSchema.method.encryptPassworld = function(passport) {
    return bcrypt.hashSync(password,bcrypt.genSaltSync(5), null);
};

userSchema.method.validPassword = function(passport) {
    return bcrypt.compareSync(passport,this.password);
}
module.exports = mongoose.model('User',userSchema);