const ex = require('express');
require('dotenv').config()
const app = ex();
const fs = require('fs');
const youtubedl = require('youtube-dl');
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
app.use(ex.static('public'));
app.use('/static', ex.static(__dirname + '/public'));
app.get('/help', function(req, res){
    return res.json({
        message: 'Bienvenido al server de YT-Downloader',
        help:[
            '/download/{id}?resolution={number}',
            'download/audio/{id}',
            '/view/{id}?type={audio|video}',
            '/info/{id}'
        ]
    });
});
app.get('/download/:id', function(req, res) {
    if(req.params.id.length!= 11){
        return res.json({ 
            'message':'Error the id must contain 11 characters 😫 id',
            'error':'Internal Error'
        });
    }
    let resolution = (req.query.resolution)? req.query.resolution:'720' ;
    // Will be called when the download starts.
    let extension = 'mp4'
    let file ='';
    let size ='';
    let formats= [];
    youtubedl.getInfo(`http://www.youtube.com/watch?v=${req.params.id}`, function getInfo(err, info) {
        if (err) {
            return res.json({
                'message':'Not info for your ID',
                'error':'Not found'
            });
        }
        formats = info.formats.map(mapInfo).sort( (i,j) => i.resolution - j.resolution  ) ;
        let crinfo = formats.filter( info => info.resolution.includes(resolution) && info.extension=='mp4' ).pop();
        let video = youtubedl(`https://www.youtube.com/watch?v=${req.params.id}`,[`--format=${crinfo.itag > 0?crinfo.itag:18}`],{ cwd: __dirname });
        video.on('info', function(info) {
            // console.log('Download started');
            // console.log('filename: ' + info._filename);
            // console.log('size: ' + info.size);
            file = info._filename;
            extension = info._filename.split('.')[1];
            size = info.size;
        });
        video.on('end', () => {
            // console.log('Disponible');
            res.send({ 
                'message': 'downloaded', 
                'path': `view/${req.params.id}?resolution=${resolution}`,
                'size':size,
                'file':file
            });
        }).pipe(fs.createWriteStream(`public/video/${req.params.id}_${resolution}.${extension}`));
    });
});
app.get('/view/:id', function(req, res) {
    let resolution = req.query.resolution;
    if(req.params.id.length!= 11){
        return res.json({ 
            'message':'Error the id must contain 11 characters 😫 id',
            'error':'Internal Error'
        });
    }
    if(req.query.type=="audio"){
        return res.send(`
            <audio controls>
                <source src="/audio/${req.params.id}.mp3" type="audio/mp3">
                Your browser does not support the audio element.
            </audio>
        `);
    }
    if(req.query.type=="video"){
        return res.send(`
            <video controls>
                <source src="/video/${req.params.id}_${resolution}.mp4" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `);
    }
    return res.json({ 
        'message':'Error can not find type on your request 💀',
        'error':'Internal Error'
    });
});
app.get('/info/:id', function(req, res) {
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
app.get('/download/audio/:id', function(req, res) {
    const id = req.params.id;
    if(id.length != 11){
        return res.json({ 
            'message':'Error the id must contain 11 characters 😫 id:'+id,
            'error':'Internal Error'
        });
    }
    youtubedl.exec(`http://www.youtube.com/watch?v=${req.params.id}`, ['-x', '--audio-format', 'mp3','-o' ,`public/audio/${id}.mp3`],{}, function exec(err, output) {
        if (err) {
            if(fs.existsSync(`${__dirname}/public/audio/${id}.mp3`)){
                return res.json({
                    'message':'Downloaded',
                    'path':`/view/audio/${id}.mp3`,
                });
            }
            return res.json({ 
                'message':'Error when try convert audio 💀 id:'+id,
                'error':'Internal Error'
            });
        }
    });    
});
app.listen(process.env.NODE_PORT, function() {
    console.log('YT downloader funcionando');
});