const mongoose = require('mongoose');
let songSchema = new mongoose.Schema({
    title: {
      type: String,
      unique : false,
      required : true
    },
    artist: {
      type: String,
      unique : false,
      required : true
    },
    extension: String,
    duration: String,
    pathDownload: {
      type: String,
      unique : false,
      required : true
    },
    path: {
      type: String,
      unique : false,
      required : true
    },
    id: {
      type: String,
      unique : true,
      required : true
    },
    imagePath:String
  });

songSchema.statics = {
    create : function(data, cb) {
        var song = new this(data);
        song.save(cb);
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
    }
}
module.exports = mongoose.model('Song', songSchema);