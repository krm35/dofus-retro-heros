const fs = require('fs'),
    http = require('http'),
    path = require('path'),
    os = require('os'),
    {spawn} = require('child_process'),
    {username} = os.userInfo(),
    accounts = require('./accounts'),
    windows = process.platform === "win32",
    linux = process.platform === "linux",
    debug = process.argv.includes("--debug");

process.on('uncaughtException', function (err) {
    console.log('uncaughtException', err);
});

const osPath = windows ? path.join("C:", "Users", username, 'AppData', 'Roaming')
    : linux ? path.join(os.homedir(), '.config') : path.join(os.homedir(), "Library", "Application Support");
let program = [JSON.parse("" + fs.readFileSync(path.join(osPath, "zaap", "repositories", "production", "retro", "main", "release.json")))['location']];
if (debug) program = ["C:\\Users\\" + username + "\\Desktop\\Retro\\"];
const retroClientPath = path.join(program[0], "resources", "app", "retroclient");
const tempFile = path.join(retroClientPath, "temp.html");
const D1ElectronLauncherFile = path.join(retroClientPath, "D1ElectronLauncher.html");
fs.copyFileSync(D1ElectronLauncherFile, tempFile);
fs.copyFileSync("./D1ElectronLauncher.html", D1ElectronLauncherFile);

// noinspection JSCheckFunctionSignatures
const dofus = spawn(path.join(program[0], (linux ? "dofus1electron" : "Dofus Retro.exe")), [], {
    env: {
        ZAAP_HEROES: JSON.stringify(accounts),
        ...(windows ?
                {
                    ZAAP_CAN_AUTH: true,
                    ZAAP_GAME: "retro",
                    ZAAP_HASH: "",
                    ZAAP_INSTANCE_ID: "1",
                    ZAAP_LOGS_PATH: "C:\\Users\\" + username + "\\AppData\\Roaming\\zaap\\retro",
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
    if (fs.existsSync(tempFile)) {
        fs.copyFileSync(tempFile, D1ElectronLauncherFile);
        fs.unlinkSync(tempFile);
    }
}