const ex = require('express');
const router = ex.Router();
const isAuth = require('../middleware/auth');
const User = require('../models/user');
router.use(isAuth);
router.get('/', function(req, res){
    User.get({}, function(err, users) {
        if(err) {
            return res.json({
                error: err
            });
        }
        res.json({
            users: users
        });
    }); 
});
router.get('/:id', function(req, res){
    User.findOne({'_id': req.params.id}, function(err, user) {
        if(err) {
            return res.json({
                error: err
            });
        }
        res.json({
            user: user
        });
    }); 
});
router.put('/:id', function(req, res){
    User.update({_id:req.params.id},req.body, function(err, updatedUser){
        if(err){
            return res.json({
                error: err
            });
        }else{
            User.get({}, function(err, users) {
                if(err) {
                    return res.json({
                        error: err
                    });
                }
                res.json({
                    message:'updated',
                    user:updatedUser,
                    users: users
                });
            }); 
        }
        
    });
});
router.delete('/:id', function(req, res){
    User.delete({_id: req.params.id},function(err){
        if(err){
            res.json({
                error:err
            });
        }else{
            User.get({}, function(err, users) {
                if(err) {
                    return res.json({
                        error: err
                    });
                }
                res.json({
                    message:'deleted',
                    users: users
                });
            });
        }
    });
});

module.exports = router;