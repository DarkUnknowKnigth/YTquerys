const ex = require('express');
const mongo = require('./mongo');
const yt = require('./routes/yt');
const songs = require('./routes/songs');
const videos = require('./routes/videos');
const users = require('./routes/users');
const session = require('express-session');
const User = require('./models/user');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: __dirname + '/public/image',
    filename: function(req, file , cb){
        if(req.params.id){
            cb(null, req.params.id)
        }
        cb('Not req file',null)
    }
});
const upload = multer({storage:storage});
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser'); // 
const app = ex();
const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions));
app.use(session({
    secret: 'work hard',
    resave: true,
    saveUninitialized: false
  }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(ex.static('public'));
app.use('/static', ex.static(__dirname + '/public'));
app.get('/', function(req, res){
    res.status(200).json({
        message:'Api YT-Downloader',
        version: '0.0.1'
    });
});
app.use('/yt',yt);
app.use('/songs',songs);
app.use('/videos',videos);
app.use('/users', users);
app.post('/login', function( req , res){
  if(req.body.email && req.body.password){
      User.authenticate(req.body.email, req.body.password,function(err, auth){
          if(err){
              return res.json({
                  error:err
              });
          }else{
              if(auth){
                  req.session.user = auth.name;
                  req.session.uid = auth._id;
                  res.json({
                      user:auth,
                      message:'ok'
                  });
              }
          }
      });
  }else{
      res.json({
          message: 'User and Pasword required',
          error:'Not Email or password'
      });
  }

});
app.post('/register', function(req, res){
  if(req.body.email && req.body.password && req.body.cpassword && req.body.name ){
      if(req.body.password === req.body.cpassword){
          let userData = {
              email: req.body.email,
              name: req.body.name,
              password: req.body.password,
          }
          User.create(userData, function(err, user){
              if(err){
                  return res.json({error: err});
              }else{
                  res.status(201).json({
                      message: 'User Created',
                      user: user
                  });
              }
          });
      }else{
          return res.json({
              message: 'Register error',
              error:'Not confirmed',
              errors: ['passwords are not equals']
          });
      }
  }
  else{
      let err=[];
      req.body.email ? '' : err.push('email is required');
      req.body.name ? '' : err.push('name is required');
      req.body.password ? '' : err.push('password is required');
      req.body.cpassword ? '' : err.push('password not comfirmed');
      res.json({
          message: 'Missing Parameters',
          error:'No Password - User - Email',
          errors: err
      });
  }
});
app.post('/photo/:id', upload.single('photo'), (req, res) => {
  if(req.file && req.params.id) {
      User.findOne({_id:req.params.id},function(err, user){
          if(err){
              return res.json({
                  error: err
              });
          }
          User.update({_id:req.params.id},{},function(err , updatedUser){
              
          })

      });
      res.json({
          message:'Photo saved'
      });
  }
  else{
      res.json({
          error: 'No image'
      })
  };
});
app.get('/logout', function(req, res, next) {
    if (req.session) {
      console.log(req.session);
      // delete session object
      req.session.destroy(function(err) {
        if(err) {
          return next(err);
        } else {
          return res.redirect('/');
        }
      });
    }
});
app.get('*',function(req, res){
    res.json({'message':'not found 🙄🙄'});
});
app.listen(process.env.NODE_PORT, function() {
    mongo.connect(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}, err => {
        if(err){
            throw err;
        }
        console.log(`Mongo running ${process.env.MONGO_URL}`);
    });
    console.log('YT downloader funcionando');
});