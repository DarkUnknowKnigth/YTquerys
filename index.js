require('dotenv').config();
const ex = require('express');
const mongo = require('./mongo');
const yt = require('./routes/yt')
const songs = require('./routes/songs');
const videos = require('./routes/videos');
const users = require('./routes/users');
const session = require('express-session');
const User = require('./models/user');
const multer = require('multer');
const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert({
        'type':process.env.type,
        'project_id':process.env.project_id,
        'private_key_id':process.env.private_key_id,
        'private_key':process.env.private_key,
        'client_email':process.env.client_email,
        'client_id':process.env.client_id,
        'auth_uri':process.env.auth_uri,
        'token_uri':process.env.token_uri,
        'auth_provider_x509_cert_url':process.env.auth_provider_x509_cert_url,
        'client_x509_cert_url':process.env.client_x509_cert_url
    }),
    storageBucket: 'gs://yt-downloader-bc6b0.appspot.com'
});
bucket = admin.storage().bucket();
const storage = multer.diskStorage({
    destination: __dirname + '/public/image',
    filename: function(req, file , cb){
        if(req.params.id){
            cb(null, `${req.params.id}.${file.originalname.split('.').pop()}`);
        }else{
            cb('Not req id',null);
        }
    }
});
const upload = multer({storage:storage});
const cors = require('cors');
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
                      session: req.session.uid,
                      message:'logged'
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
              role: 0
          }
          User.create(userData, function(err, user){
              if(err){
                res.json({error: err});
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
    if(req.file) {
        if(req.params.id){
            User.findOne({_id:req.params.id},function(err, user){
                if(err){
                    return res.json({
                        error: err
                    });
                }
                bucket.upload(req.file.path, function( err, file, apiResponse) {
                    if(err){
                        return res.json({
                            error: err
                        });
                    }
                    if(file){
                        const config = {
                            action: 'read',
                            expires: '03-17-2025'
                        };
                        file.getSignedUrl(config, function(err, url) {
                            if (err) {
                                return res.json({
                                    error: err
                                });
                            }
                            User.update({_id:req.params.id},{'photo':url},function(err , updatedUser){
                                if(err){
                                    res.json({
                                        error: err
                                    });
                                }
                                res.json({
                                    message: 'Updated',
                                    user: updatedUser
                                });
                            });
                        });
                    }
                });
            });
        }else{
            res.json({
                error: 'No uid'
            });
        }
    }
    else{
      res.json({
          error: 'No image'
      });
    }
});
app.get('/logout', function(req, res, next) {
    if (req.session) {
      // delete session object
      req.session.destroy(function(err) {
        if(err) {
         res.json({
             error:err
         });
        } else {
            res.json({
                message:'Logged out'
            });
        }
      });
    }
});
app.get('*',function(req, res){
    res.json({'message':'not found 🙄🙄'});
});
let server_port = process.env.PORT || 80;
let server_host = '0.0.0.0';
app.listen(server_port, server_host, function() {
    mongo.connect(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}, err => {
        if(err){
            throw err;
        }
        console.log(`Mongo running`);
    });
    console.log('YT downloader running');
});