const fs = require('fs'),
    http = require('http'),
    {spawn} = require('child_process'),
    {username} = require('os').userInfo(),
    accounts = require('./accounts'),
    windows = process.platform === "win32",
    debug = process.argv.includes("--debug");

process.on('uncaughtException', function (err) {
    console.log('uncaughtException', err);
});

const osPath = windows ? "C:/Users/" + username + "/AppData/" : "/home/" + username + "/.config/";

const path = JSON.parse("" + fs.readFileSync(osPath + "zaap/repositories/production/retro/main/release.json"))['location'] + "/";
let program = [path];
if (debug) program = ["C:/Users/" + username + "/Desktop/Retro/"];
const retroClientPath = program[0] + "resources/app/retroclient/";
fs.copyFileSync(retroClientPath + "D1ElectronLauncher.html", retroClientPath + "temp.html");
fs.copyFileSync("./D1ElectronLauncher.html", retroClientPath + "D1ElectronLauncher.html");

// noinspection JSCheckFunctionSignatures
const dofus = spawn(program[0] + (windows ? "Dofus Retro.exe" : "dofus1electron"), [], {
    env: {
        ZAAP_HEROES: JSON.stringify(accounts),
        ...(windows ?
                {
                    ZAAP_CAN_AUTH: true,
                    ZAAP_GAME: "retro",
                    ZAAP_HASH: "",
                    ZAAP_INSTANCE_ID: "1",
                    ZAAP_LOGS_PATH: "C:/Users/" + username + "/AppData/Roaming/zaap/retro",
                    ZAAP_PORT: "26117",
                    ZAAP_RELEASE: "main"
                } :
                process.env
        )

    }
});

dofus.on('exit', () => {
    replaceFiles();
    process.exit(0)
});

if (debug) require('./debug')(dofus.pid);
else require('./launcher');

http.createServer(function (req, res) {
    if (router[req.url]) res['end'](router[req.url]());
    else res['end']();
}).listen(8080);

const router = {};

router['/start'] = () => {
    replaceFiles();
    return JSON.stringify(accounts);
};

router['/electron-tabs.js'] = () => {
    return fs.readFileSync("./electron-tabs.js");
};

function replaceFiles() {
    if (fs.existsSync(retroClientPath + "temp.html")) {
        fs.copyFileSync(retroClientPath + "temp.html", retroClientPath + "D1ElectronLauncher.html");
        fs.unlinkSync(retroClientPath + "temp.html");
    }
}