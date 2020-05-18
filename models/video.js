const mongoose = require('mongoose');
let videoSchema = new mongoose.Schema({
    title: {
      type: String,
      unique : false,
      required : false
    },
    artist: {
      type: String,
      unique : false,
      required : false
    },
    extension: String,
    duration: String,
    resolutions: Array,
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

videoSchema.statics = {
    create : function(data, cb) {
        var video = new this(data);
        video.save(cb);
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
module.exports = mongoose.model('Video', videoSchema);