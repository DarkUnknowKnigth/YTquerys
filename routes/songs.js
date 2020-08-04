
const ex = require('express');
const Song = require('../models/song');
const router = ex.Router();
const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, '..');
router.get('/', function(req, res){
    Song.find({}).sort({artist:1}).exec(function(err, songs) {
        if(err) {
            return res.json({
                error: err
            });
        }else{
            return res.json({
                songs: songs
            });
        }
    });
});
router.get('/:id', function(){
    Song.findOne({'id': req.params.id}, function(err, song) {
        if(err) {
            return res.json({
                error: err
            });
        }else{
            return res.json({
                song: song
            });
        }
    }); 
});
router.put('/:id', function(req , res){
    Song.findOne({'id': req.params.id}, function(err, song) {
        if(err) {
            return res.json({
                error: err
            });
        }else{
            if(song){
                Song.update({id: req.params.id},{
                    title: req.body.title,
                    artist: req.body.artist
                }, ( err, updatedSong ) => {
                    if(err){
                        return res.json({
                            message : '🔥 Error When update 🔥',
                            error: err
                        });
                    }else{
                        return res.json({
                            message: 'Song updated 👍'
                        });
                    }
                });
            }
            else{
                return res.json({
                    message: 'Song not found 😒'
                });
            }
        }
    }); 
});
router.delete('/:id', function(req, res){
    Song.findOne({'id':req.params.id}, function(err, song) {
        if(err) {
            return res.json({
                error: 'Not exist'
            });
        }else{
            let err_ = []; 
            if(song){
                const file = bucket.file(`${song.id}.mp3`);
                file.delete(function(err, apiResponse) {
                    console.log(err);
                });
                try {
                    if(fs.statSync(`${dir}/public/audio/${req.params.id}.mp3`)){
                        fs.unlinkSync(`${dir}/public/audio/${req.params.id}.mp3`);
                    } else{
                        err_.push("Cannot find your file");
                    }
                } catch(err) {
                   err_.push( 'Wrong server path access');
                   err_.push( err );
                }
                Song.delete({'id':req.params.id}, function(err){
                    if(err){
                        return res.json({
                            error: 'Canot delete'
                        });
                    }
                    return res.json({
                        'message':'deleted',
                        'error': err_
                    });
                });
            }else{
                return res.json({
                    'message':'not found',
                })
            }
        }
    }); 
    
});
module.exports = router;