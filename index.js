const fs = require('fs'),
    http = require('http'),
    WebSocket = require('ws'),
    {spawn} = require('child_process'),
    {username} = require('os').userInfo(),
    accounts = require('./accounts'),
    debug = process.argv.includes("--debug");

process.on('uncaughtException', function (err) {
    console.log('uncaughtException', err);
});

const path = JSON.parse("" + fs.readFileSync("C:\\Users\\" + username + "\\AppData\\Roaming\\zaap\\repositories\\production\\retro\\main\\release.json"))['location'] + "\\";
let program = [path];
if (debug) program = ["C:\\Users\\" + username + "\\Desktop\\Retro\\"];
const retroClientPath = program[0] + "resources\\app\\retroclient\\";
fs.copyFileSync(retroClientPath + "D1ElectronLauncher.html", retroClientPath + "temp.html");
fs.copyFileSync("./D1ElectronLauncher.html", retroClientPath + "D1ElectronLauncher.html");

// noinspection JSCheckFunctionSignatures
const dofus = spawn(program[0] + "Dofus Retro.exe", [], {
    env: {
        ZAAP_CAN_AUTH: true,
        ZAAP_GAME: "retro",
        ZAAP_HASH: "",
        ZAAP_INSTANCE_ID: "1",
        ZAAP_LOGS_PATH: "C:\\Users\\" + username + "\\AppData\\Roaming\\zaap\\retro",
        ZAAP_PORT: "26117",
        ZAAP_RELEASE: "main"
    }
});

dofus.on('exit', () => {
    replaceFiles();
    process.exit(0)
});

if (debug) require('./debug')(dofus.pid);
else require('./launcher');

const server = http.createServer(function (req, res) {
    res['end']();
}).listen(8080);

server.on('upgrade', function upgrade(request, socket, head) {
    wss['handleUpgrade'](request, socket, head, function done(ws) {
        wss['emit']('connection', ws, request);
    });
});

const wss = new WebSocket.Server({noServer: true});

wss['on']('connection', function connection(ws) {
    ws.on('message', function message(message) {
        ws.send(JSON.stringify(router[message]()));
    });
});

const router = {};

router['start'] = () => {
    replaceFiles();
    return accounts;
};

function replaceFiles() {
    if (fs.existsSync(retroClientPath + "temp.html")) {
        fs.copyFileSync(retroClientPath + "temp.html", retroClientPath + "D1ElectronLauncher.html");
        fs.unlinkSync(retroClientPath + "temp.html");
    }
}