let fs = require('fs'),
    http = require('http'),
    path = require('path'),
    rd = require('./readdir-server');

let typeMap = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.png': 'image/png',
    '.woff':  'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.svg': 'image/svg+xml'
};

http.createServer((req, resp) => {
    let requestedDirectory = `.${req.url}`,
        content, ext;

    function sendResp(reqD) {
        content = fs.readFileSync(reqD);
        ext = path.extname(reqD);
        resp.setHeader('Content-Type',typeMap[ext]);
        resp.write(content);
    }

    if (fs.existsSync(requestedDirectory)){
        if (fs.statSync(requestedDirectory).isDirectory()) {
            content = rd(requestedDirectory);
            fs.writeFileSync('result.json',content,'utf-8');
            requestedDirectory = './client/index.html';
            //resp.write(content);
        }
    } else {
        requestedDirectory = './client/404.html';
    }

    sendResp(requestedDirectory);
    resp.end();

}).listen(9999);
