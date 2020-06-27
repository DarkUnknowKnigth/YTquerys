const ex = require('express');
const fs = require('fs');
const path = require('path');
const Song = require('../models/song');
const Video = require('../models/video');
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
    res.json({
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
        res.json({ 
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
    else {
        let id = req.params.id;
        Video.findOne({'id':req.params.id},function (err, videoOld){
            if(err){
               res.json({
                   'error':err
               });
            } 
            else {
                if(videoOld != null){  
                    console.log('Exist but not resolution');  
                    youtubedl.getInfo(`http://www.youtube.com/watch?v=${req.params.id}`, function getInfo(err, info) {
                        if (err) {
                            res.json({
                                'message':'Not info for your Id',
                                'error':'Not found'
                            });
                        }else{
                            formats = info.formats.map(mapInfo).sort( (i,j) => i.resolution - j.resolution  ) ;
                            let crinfo = formats.filter( info => info.resolution.includes(resolution) && info.extension=='mp4' ).pop();
                            let video = youtubedl(`https://www.youtube.com/watch?v=${req.params.id}`,[`--format=${crinfo.itag > 0?crinfo.itag:18}`],{ cwd: dir });
                            video.on('info', function(info) {
                                file = info._filename;
                                extension = info._filename.split('.')[1];
                                size = info.size;
                            });
                            video.on('end', () => {
                                console.log('Disponible');
                                let newRes = [...videoOld.resolutions,Number.parseInt(resolution)];
                                Video.update({'id':id},{
                                    'resolutions':newRes
                                }, (err, updatedVideo) =>{
                                    if(err){
                                        res.json({
                                            'message':'Not updated videos resolutions',
                                            'error':'Not Update'
                                        });
                                    }
                                    Video.get({}, function(err, videos) {
                                        if(err) {
                                            res.json({
                                                error: err
                                            })
                                        }else{
                                            res.json({
                                                'video':updatedVideo,
                                                'videos':videos,
                                                'size':size,
                                                'file':file,
                                                'message':'On Server 😁😁😁',
                                                'path':`/save/${id}?type=video`,
                                            });
                                        }
                                    }); 
                                })
                            }).pipe(fs.createWriteStream(`public/video/${req.params.id}_${resolution}.${extension}`));
                        }
                    });
               } else {
                    console.log('No exists');  
                    youtubedl.getInfo(`http://www.youtube.com/watch?v=${req.params.id}`, function getInfo(err, info) {
                        if (err) {
                            res.json({
                                'message':'Not info for your Id',
                                'error':'Not found'
                            });
                        }else{
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
                                let data = {
                                    id:id,
                                    title: info.title?info.title:'Unknown',
                                    artist: info.artist?info.artist:'Unknown',
                                    extension:'mp4',
                                    duration: info.duration,
                                    path:`/static/video/${id}.mp4`,
                                    pathDownload:`/save/${id}?type=video`,
                                    imagePath:info.thumbnails[0].url,
                                    resolutions:[Number.parseInt(resolution)]    
                                };
                                Video.create(data, function(err, newVideo) {
                                    if(err) {
                                        res.json({
                                            'error' : err
                                        });
                                    }else{
                                        Video.get({}, function(err, videos) {
                                            if(err) {
                                                res.json({
                                                    error: err
                                                })
                                            }else{
                                                res.json({
                                                    'video':newVideo,
                                                    'videos':videos,
                                                    'size':size,
                                                    'file':file,
                                                    'message':'On Server 😁😁😁',
                                                    'path':`/save/${id}?type=video`,
                                                });
                                            }
                                        }); 
                                    }
                                });
                            }).pipe(fs.createWriteStream(`public/video/${req.params.id}_${resolution}.${extension}`));
                        }
                    });
                }
            }
        });
    }
});
router.get('/save/:id', function(req, res) {
    let resolution = req.query.resolution;
    if(req.params.id.length!= 11){
        res.json({ 
            'message':'Error the id must contain 11 characters 😫 id',
            'error':'Internal Error'
        });
    }
    if(req.query.type=="audio"){
        Song.findOne({'id':req.params.id}, function(err , song){
            if(err){
                res.json({ 
                    'message':'Error song not found 😫',
                    'error':'Internal Error'
                });
            }
            res.download(`${dir}/public/audio/${song.id}.mp3`,`${song.artist} ${song.title}.mp3`);
        });
    }
    else if(req.query.type=="video"){
        Video.findOne({'id':req.params.id},(err , video)=>{
            if(err){
                res.json({ 
                    'message':'Error Video not Found 😫',
                    'error':'Internal Error'
                });
            }
            if(video && video.resolutions.length > 0){
                let validResolution = ['144','240','360','480','720','1080'];
                let index = validResolution.indexOf(resolution);
                let cres = video.resolutions.filter(resol => validResolution[ index - 1] <= Number.parseInt(resolution) || validResolution[index + 1] >= Number.parseInt(resolution));
                if(cres.length > 0){
                    res.download(`${dir}/public/video/${req.params.id}_${cres[0]}.mp4`,`${video.title} ${video.artist}.mp4`);
                } else{
                    res.download(`${dir}/public/video/${req.params.id}_${video.resolutions[0]}.mp4`,`${video.title} ${video.artist}.mp4`);
                }
            }else{
                res.json({ 
                    'message':'Error No Found videos with your id 😫',
                    'error':'Internal Error'
                });
            }
        });
    }
    else{
        res.json({ 
            'message':'Error can not find type on your request 💀',
            'error':'Internal Error'
        });
    }
});
router.get('/info/:id', function(req, res) {
    if(req.params.id.length!= 11){
        res.json({ 
            'message':'Error the id must contain 11 characters 😫 id',
            'error':'Internal Error'
        });
    }
    youtubedl.getInfo(`http://www.youtube.com/watch?v=${req.params.id}`, function getInfo(err, info) {
        if (err) {
            throw err
        }
        let formats = { id: info.id, formats:  info.formats.map(mapInfo).sort( (i,j) => i.resolution - j.resolution  )}
        res.send(formats);
    });
});
router.get('/download/audio/:id', function(req, res) {
    const id = req.params.id;
    if(id.length != 11){
        res.status(500).json({ 
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
            Song.get({}, function(err, songs) {
                if(err) {
                    res.json({
                        error: err
                    })
                }
                res.json({
                    'song':song,
                    'songs':songs,
                    'message':'Downloaded On Server 😁😁😁',
                    'path':`/save/${id}?type=audio`,
                });
            }); 
        }); 
    }else{
        youtubedl.exec(`http://www.youtube.com/watch?v=${id}`, ['-x', '--audio-format','mp3', '-f', 'bestaudio','-o' ,`public/audio/${id}.%(ext)s`],{}, function exec(err, output) {
            console.error(err);
            console.warn(output);
            console.log(`${dir}/audio/${id}.webm`);
            youtubedl.getInfo(`http://www.youtube.com/watch?v=${id}`, function getInfo(err, info) {
                if (err) {
                    res.json({
                        'message':'Error when try get info of audio 💀 id:'+id,
                        'error':'Internal Error'
                    });
                }else{
                    bucket.upload(`${dir}/public/audio/${id}.mp3`, function( err, file, apiResponse) {
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
                                let song = {
                                    id:id,
                                    title: info.title?info.title:'Unknown',
                                    artist: info.artist?info.artist:'Unknown',
                                    extension:'mp3',
                                    duration: info.duration,
                                    path:url,
                                    pathDownload:`/save/${id}?type=audio`,
                                    imagePath:info.thumbnails[0].url    
                                };
                                Song.create(song, function(err, song) {
                                    if(err) {
                                        res.json({
                                            'error' : err
                                        });
                                    }else{
                                        Song.get({}, function(err, songs) {
                                            if(err) {
                                                res.json({
                                                    error: err
                                                });
                                            }else{
                                                res.json({
                                                    'song':song,
                                                    'songs':songs,
                                                    'message':'On Server 😁😁😁',
                                                    'path':`/save/${id}?type=audio`,
                                                });
                                            }
                                        }); 
                                    }
                                });
                                
                            });
                        }
                    });
                }
            });
        });    
            
    }
});
module.exports = router;


