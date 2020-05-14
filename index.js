var ex = require('express');
var app = ex();
var fs = require('fs');
//npm init 
//npm install youtube-dl
var youtubedl = require('youtube-dl');
app.use(ex.static('public'));
app.use('/static', ex.static(__dirname + '/public'));
app.get('/', function(req, res){
    return res.json({
        message: 'Bienvenido al server de YT-Downloader',
        help:[
            '/download/{id}/{name}/{tag}',
            '/view/:name',
            '/info/:id',
            '/audio/:id'
        ]
    });
});
app.get('/download/:id/:name/:itag', function(req, res) {
    var video = youtubedl(`https://www.youtube.com/watch?v=${req.params.id}`,
        // Optional arguments passed to youtube-dl.
        [`--format=${req.params.itag}`],
        // Additional options can be given for calling `child_process.execFile()`.
        { cwd: __dirname });
    // Will be called when the download starts.
    video.on('info', function(info) {
        console.log('Download started');
        console.log('filename: ' + info._filename);
        console.log('size: ' + info.size);
    });
    video.on('end', () => {
        console.log('Disponible');
        res.send({ 'message': 'downloaded', 'url': `http://localhost:3000/${req.params.name}.mp4` });
    });
    video.pipe(fs.createWriteStream('public/' + req.params.name + '.mp4'));
});
app.get('/view/:name', function(req, res) {
    return res.redirect(`http://localhost:3000/${req.params.name}.mp4`);
});
app.get('/info/:id', function(req, res) {
    function mapInfo(item) {
        return {
            itag: item.format_id,
            filetype: item.ext,
            resolution: item.resolution ||
                (item.width ? item.width + 'x' + item.height : 'audio only')
        }
    }

    youtubedl.getInfo(`http://www.youtube.com/watch?v=${req.params.id}`, function getInfo(err, info) {
        if (err) {
            throw err
        }
        var formats = { id: info.id, formats: info.formats.map(mapInfo) }
        return res.send(formats);
    })
});
app.get('/audio/:id', function(req, res) {
    var audio = youtubedl.exec(`http://www.youtube.com/watch?v=${req.params.id}`, ['-f', 'bestaudio'], {}, function exec(err, output) {
        if (err) {
            throw err
        }
        console.log(output.join('\n'));
        return res.send({ 'message': 'avalible', 'instructions': 'change the extension file to .mp3' });
    });

});
app.listen(3000, function() {
    console.log('YT downloader funcionando');
});