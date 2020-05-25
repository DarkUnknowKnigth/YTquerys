
const ex = require('express');
const Song = require('../models/song');
const router = ex.Router();
const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, '..');
router.get('/', function(req, res){
    Song.get({}, function(err, songs) {
        if(err) {
            res.json({
                error: err
            });
        }else{
            res.json({
                songs: songs
            });
        }
    }); 
});
router.get('/:id', function(){
    Song.findOne({'id': req.params.id}, function(err, song) {
        if(err) {
            res.json({
                error: err
            });
        }else{
            res.json({
                song: song
            });
        }
    }); 
});
router.delete('/:id', function(req, res){
    Song.findOne({'id':req.params.id}, function(err, song) {
        if(err) {
            res.json({
                error: 'Not exist'
            });
        }else{
            let err_ = []; 
            if(song){
                try {
                    if(fs.statSync(dir+song.path.replace('static','public'))){
                        fs.unlinkSync(dir+song.path.replace('static','public'));
                    } else{
                        err_.push("Cannot find your file");
                    }
                } catch(err) {
                   err_.push( 'Wrong server path access');
                   err_.push( err );
                }
                Song.delete({'id':req.params.id}, function(err){
                    if(err){
                        res.json({
                            error: 'Canot delete'
                        });
                    }
                    res.json({
                        'message':'deleted',
                        'error': err_
                    });
                });
            }else{
                res.json({
                    'message':'not found',
                })
            }
        }
    }); 
    
});
module.exports = router;