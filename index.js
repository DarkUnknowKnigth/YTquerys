const ex = require('express');
const mongo = require('./mongo');
const yt = require('./routes/yt');
const song = require('./routes/songs');
const videos = require('./routes/videos');
const cors = require('cors')
require('dotenv').config();
const bodyParser = require('body-parser'); // 
const app = ex();
const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(ex.static('public'));
app.use('/static', ex.static(__dirname + '/public'));
app.use('/yt',yt);
app.use('/songs',song);
app.use('/videos',videos);
app.get('*',function(req, res){
    res.json({'message':'not found 🙄🙄'});
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