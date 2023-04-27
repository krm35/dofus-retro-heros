const https = require('https'),
    zlib = require('zlib');

module.exports = function request(options, body) {
    options.headers = {
        'accept': '*/*',
        'accept-encoding': 'gzip,deflate',
        'accept-language': 'fr',
        'connection': 'close',
        'user-agent': 'Zaap 3.9.6',
        ...(options.headers || {})
    };

    if (body) {
        options.headers["content-length"] = body.length;
        options.headers["content-type"] = "text/plain;charset=UTF-8";
    }

    return new Promise((resolve) => {
        let data = "", buffer = [];

        const req = https.request({
            hostname: 'haapi.ankama.com',
            port: 443,
            ...options
        }, function (res) {
            if (res.headers['content-encoding'] === 'gzip') {
                const gunzip = zlib.createGunzip();
                res.pipe(gunzip);
                gunzip.on('data', function (data) {
                    buffer.push(data.toString())
                }).on("end", function () {
                    let json;
                    try {
                        json = JSON.parse(buffer.join(""))
                    } catch (e) {
                    }
                    resolve([false, json || buffer.join("")]);
                }).on('error', () => {
                    resolve([true]);
                })
            } else {
                res.on('data', (chunk => {
                    data += chunk;
                }));
                res.on('end', () => {
                    try {
                        resolve([false, JSON.parse(data)]);
                    } catch (e) {
                        resolve([false, data.toString()]);
                    }
                });
                res.on('error', () => {
                    resolve([true]);
                })
            }
        }).on('error', (err) => {
            resolve([true, "error " + err]);
        });
        if (body) req.write(body);
        req.end();
    });
};