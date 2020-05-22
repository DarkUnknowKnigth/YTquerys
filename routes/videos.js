const ex = require('express');
const Video = require('../models/video');
const router = ex.Router();
const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, '..');
router.get('/', function(req, res){
    Video.get({}, function(err, videos) {
        if(err) {
            res.json({
                error: err
            });
        }else{
            res.json({
                videos: videos
            });
        }
    }); 
});
router.get('/:id', function(){
    Video.findOne({'id': req.params.id}, function(err, video) {
        if(err) {
            res.json({
                error: err
            });
        }else{
            res.json({
                video: video
            });
        }
    }); 
});
router.delete('/:id', function(req, res){
    Video.findOne({'id':req.params.id}, function(err, video) {
        if(err) {
            res.json({
                error: 'Not exist'
            });
        }else{
            if(video){
                try {
                    video.resolutions.forEach( resolution => {
                        fs.unlinkSync(dir+`/public/video/${video.id}_${resolution}.mp4`);
                    });
                    Video.delete({'id':req.params.id}, function(err){
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