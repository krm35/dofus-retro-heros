const net = require('net'),
    querystring = require('querystring'),
    crypto = require('crypto'),
    request = require('./request'),
    accounts = require('./accounts'),
    server = new net.Server().listen(26117);

server.on('connection', function (socket) {
    let uuid;
    socket.on('data', function (data) {
        try {
            const str = data.toString().slice(0, -1);
            console.log(str);
            if (str.startsWith("connect retro main -1")) {
                const split = str.split(" ");
                uuid = split[split.length - 1];
                socket.write("connected\x00");
                socket.write("connect " + uuid + "\x00");
            } else if (str.startsWith("auth_getGameToken")) {
                for (let a in accounts) {
                    if (accounts[a].key === uuid) {
                        // noinspection JSIgnoredPromiseFromCall
                        getGameToken(accounts[a], socket, 101);
                        break;
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on('end', function () {
    });
});

function generateHashFromCertif(hm1, hm2, certif) {
    const i = crypto.createDecipheriv("aes-256-ecb", hm2, ""),
        r = Buffer.concat([i.update(certif['encodedCertificate'], "base64"), i.final()]);
    return crypto.createHash("sha256").update(hm1 + r.toString()).digest("hex")
}

async function getGameToken(account, socket, game) {
    const queryPath = {game, certificate_id: "", certificate_hash: ""};
    socket['accountLogin'] = account['login'];
    if (account['certificat']) {
        queryPath['certificate_id'] = account['certificat']['id'];
        queryPath['certificate_hash'] = generateHashFromCertif(account['hm1'], account['hm2'], account['certificat']);
    }
    const APIKEY = account['key'];

    await request(
        {
            path: "/json/Ankama/v5/Api/RefreshApiKey",
            method: 'POST',
            headers: {APIKEY}
        }, "refresh_token=" + account['refresh_token'] + "&long_life_token=true"
    );

    const json = await request({
        path: "/json/Ankama/v5/Account/CreateToken?" + querystring.stringify(queryPath),
        method: 'GET',
        headers: {APIKEY}
    });

    console.log(json);

    socket.write("auth_getGameToken " + json[1]['token'] + "\x00");
}