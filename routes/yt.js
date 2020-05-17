const ex = require('express');
const fs = require('fs');
const path = require('path');
const Song = require('../models/song');
const youtubedl = require('youtube-dl');
const dir = path.resolve(__dirname, '..');
let router = ex.Router();
let mapInfo = function (item) {
    return {
        itag: item.format_id,
        extension: item.ext,
        resolution: (item.format_note && item.format_note != 'tiny' ) ? item.format_note.substring(0,item.format_note.length-1) : '0',
        width: item.width? item.width : 0,
        height: item.height? item.height : 0,
        quality: item.width ? item.width :0
    }
}

router.get('/help', function(req, res){
    return res.json({
        message: 'Bienvenido al server de YT-Downloader',
        help:[
            'yt/download/{id}?resolution={number}',
            'yt/download/audio/{id}',
            'yt/save/{id}?type={audio|video}',
            'yt/info/{id}',
            '/static/audio/{id}.mp3',
            '/static/video/{id}_{resolution}.mp3'
        ]
    });
});
/**
 * res.params.id : numeric (11 digits)
 * res.query.resolution : numeric(144|240|360|480|720|1080)
 */
router.post('/register', function(req, res){
    return res.json({'message':'registred'});
});
router.post('/login', function(req, res){
    return res.json({'message':'logged'});
});
router.get('/download/:id', function(req, res) {
    let resolution= '480';
    if( req.query.resolution ){
        resolution =  req.query.resolution;
        let validResolution = ['144','240','360','480','720','1080'];
        let isValidRs = false;
        validResolution.forEach( rs => {
            if(rs == resolution){
                isValidRs = true;
            }
        });
        resolution = isValidRs ? req.query.resolution : '480';
    }else{
        resolution ='480';
    }
    // Will be called when the download starts.
    let extension = 'mp4'
    let file ='';
    let size ='';
    let formats= [];
    if(req.params.id.length!= 11){
        return res.json({ 
            'message':'Error the id must contain 11 characters 😫 id',
            'error':'Internal Error'
        });
    }
    if(fs.existsSync(`${dir}/public/video/${req.params.id}_${resolution}.mp4`)){
        res.send({ 
            'message': 'downloaded', 
            'path': `view/${req.params.id}?resolution=${resolution}&type=video`,
            'size':size,
            'file':file
        });
    }
    youtubedl.getInfo(`http://www.youtube.com/watch?v=${req.params.id}`, function getInfo(err, info) {
        if (err) {
            return res.json({
                'message':'Not info for your Id',
                'error':'Not found'
            });
        }
        formats = info.formats.map(mapInfo).sort( (i,j) => i.resolution - j.resolution  ) ;
        let crinfo = formats.filter( info => info.resolution.includes(resolution) && info.extension=='mp4' ).pop();
        let video = youtubedl(`https://www.youtube.com/watch?v=${req.params.id}`,[`--format=${crinfo.itag > 0?crinfo.itag:18}`],{ cwd: dir });
        video.on('info', function(info) {
            console.log('Download started');
            console.log('filename: ' + info._filename);
            console.log('size: ' + info.size);
            file = info._filename;
            extension = info._filename.split('.')[1];
            size = info.size;
        });
        video.on('end', () => {
            console.log('Disponible');
            res.send({ 
                'message': 'downloaded', 
                'path': `view/${req.params.id}?resolution=${resolution}&type=video`,
                'size':size,
                'file':file
            });
        }).pipe(fs.createWriteStream(`public/video/${req.params.id}_${resolution}.${extension}`));
    });
});
router.get('/save/:id', function(req, res) {
    let resolution = req.query.resolution;
    if(req.params.id.length!= 11){
        return res.json({ 
            'message':'Error the id must contain 11 characters 😫 id',
            'error':'Internal Error'
        });
    }
    if(req.query.type=="audio"){
        Song.get({'id':req.params.id}, function(err , song){
            if(err){
                throw err;
            }
            res.download(`${dir}/public/audio/${req.params.id}.mp3`, song.title+'.mp3' );
        });
    }
    else if(req.query.type=="video"){
        return res.download(`${dir}/public/video/${req.params.id}_${resolution}.mp4`,);
    }
    else{
        return res.json({ 
            'message':'Error can not find type on your request 💀',
            'error':'Internal Error'
        });
    }
});
router.get('/info/:id', function(req, res) {
    if(req.params.id.length!= 11){
        return res.json({ 
            'message':'Error the id must contain 11 characters 😫 id',
            'error':'Internal Error'
        });
    }
    youtubedl.getInfo(`http://www.youtube.com/watch?v=${req.params.id}`, function getInfo(err, info) {
        if (err) {
            throw err
        }
        let formats = { id: info.id, formats:  info.formats.map(mapInfo).sort( (i,j) => i.resolution - j.resolution  )}
        return res.send(formats);
    });
});
router.get('/download/audio/:id', function(req, res) {
    const id = req.params.id;
    if(id.length != 11){
        return res.json({ 
            'message':'Error the id must contain 11 characters 😫 id:'+id,
            'error':'Internal Error'
        });
    }
    if(fs.existsSync(`${dir}/public/audio/${id}.mp3`)){
        Song.get({'id': id}, function(err, song) {
            if(err) {
                res.json({
                    error: err
                })
            }
            return res.json({
                'song':song,
                'message':'Downloaded On Server 😁😁😁'
            });
        }); 
    }else{
        youtubedl.exec(`http://www.youtube.com/watch?v=${id}`, ['-x', '--audio-format', 'mp3','-o' ,`public/audio/${id}.mp3`],{}, function exec(err, output) {
            if (err) {
                youtubedl.getInfo(`http://www.youtube.com/watch?v=${id}`, function getInfo(err, info) {
                    if (err) {
                        return res.json({
                            'message':'Error when try get info of audio 💀 id:'+id,
                            'error':'Internal Error'
                        });
                    }
                    let song = {
                        id:id,
                        title: info.title,
                        artist: info.artist,
                        extension:'mp3',
                        duration: info.duration,
                        path:`/static/audio/${id}.mp3`,
                        pathDownload:`/save/${id}?type=audio`,
                        imagePath:info.thumbnails[0].url    
                    };
                    Song.create(song, function(err, song) {
                        if(err) {
                            res.json({
                                'error' : err
                            });
                        }
                        Song.get({}, function(err, songs) {
                            if(err) {
                                res.json({
                                    error: err
                                })
                            }
                            return res.json({
                                'song':song,
                                'songs':songs,
                                'message':'On Server 😁😁😁',
                                'path':`/save/${id}?type=audio`,
                            });
                        }); 
                    });
                });
            }
            else{
                res.send('Error desconocido');
            }
        });    
    }
});
module.exports = router;


