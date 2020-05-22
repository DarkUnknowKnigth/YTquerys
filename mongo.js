const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
module.exports = mongoose;

