const ex = require('express');
const mongo = require('./mongo');
const yt = require('./routes/yt');
require('dotenv').config();
var bodyParser = require('body-parser'); // 
const app = ex();
app.use(ex.static('public'));
app.use('/static', ex.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/yt',yt);
app.get('*', function(req , res){
    return res.json({
        'message':'Route Dosent Exist',
        'error':'Not Route'
    })
});
app.listen(process.env.NODE_PORT, function() {
    mongo.connect(process.env.MONGO_URL, {useNewUrlParser: true}, err => {
        if(err){
            throw err;
        }
        console.log(`Mongo running ${process.env.MONGO_URL}`);
    });
    console.log('YT downloader funcionando');
});