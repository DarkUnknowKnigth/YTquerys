const mongoose = require('../mongo');
const uniqueValidator = require('mongoose-unique-validator');
const bcrypt = require('bcrypt');
let userSchema = new mongoose.Schema({
    name: {
      type: String,
      unique : false,
      required : true
    },
    email: {
      type: String,
      unique : true,
      required : true
    },
    password:{
        type: String,
        unique: false,
        required:true,
    },
    photo:String,
    role : {
        type: Number,
        unique: false,
        required: true
    }
  });

userSchema.statics = {
    create : function(data, cb) {
        var user = new this(data);
        user.save(cb);
    },

    get: function(query, cb) {
        this.find(query, cb);
    },

    getByName: function(query, cb) {
        this.find(query, cb);
    },

    update: function(query, updateData, cb) {
        this.findOneAndUpdate(query, {$set: updateData},{new: true}, cb);
    },

    delete: function(query, cb) {
        this.findOneAndDelete(query,cb);
    },
    authenticate: function (email, password, callback) {
        this.findOne({ email: email }).exec(function (err, user) {
            if (err) {
                return callback(err)
            } else if (!user) {
                let err = new Error('User not found');
                err.status = 401;
                err.error = 'User not found'
               
                return callback(err);
            } else {
                bcrypt.compare(password, user.password, function (err, result) {
                    if(!err){
                        if (result === true) {
                            return callback(null, user);
                        } else {
                            let err = new Error('Password not match');
                            err.status = 401;
                            err.error = 'Pasword not match';
                            return callback(err,null);
                        }
                    } else {
                        return callback();
                    }
                });
            }
        });
    }
}
userSchema.pre('save', function (next) {
    let user = this;
    bcrypt.hash(user.password, 10, function (err, hash){
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
});
userSchema.plugin(uniqueValidator);
module.exports = mongoose.model('User', userSchema);