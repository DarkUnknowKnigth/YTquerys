
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
        }
        res.json({
            songs: songs
        });
    }); 
});
router.get('/:id', function(){
    Song.findOne({'id': req.params.id}, function(err, song) {
        if(err) {
            res.json({
                error: err
            });
        }
        res.json({
            song: song
        });
    }); 
});
router.delete('/:id', function(req, res){
    Song.findOne({'id':req.params.id}, function(err, song) {
        if(err) {
            res.json({
                error: 'Not exist'
            });
        }else{
            if(song){
                try {
                    fs.unlinkSync(dir+song.path.replace('static','public'));
                    Song.delete({'id':req.params.id}, function(err){
                        if(err){
                            res.json({
                                error: 'Canot delete'
                            });
                        }
                        res.json({
                            'message':'deleted',
                        });
                    });
                  } catch(err) {
                    res.json({
                        error: 'Wrong server path access'
                    });
                  }
            }else{
                res.json({
                    'message':'not found',
                })
            }
        }
    }); 
    
});
module.exports = router;