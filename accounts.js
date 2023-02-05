const fs = require('fs'),
    os = require('os'),
    crypto = require('crypto'),
    {machineIdSync} = require('node-machine-id'),
    accounts = {};

function decrypt(data) {
    const splitData = data.split('|');
    const initializationVector = Buffer.from(splitData[0], 'hex');
    const encryptedData = Buffer.from(splitData[1], 'hex');
    const hash = createHashFromString(uuid);
    const decipher = crypto.createDecipheriv('aes-128-cbc', hash, initializationVector);
    const decryptedData = decipher.update(encryptedData);
    const decryptedBuffer = Buffer.concat([decryptedData, decipher.final()]);
    const jsonData = decryptedBuffer.toString();
    return JSON.parse(jsonData)
}

function createHashFromStringSha(e) {
    const n = crypto.createHash("sha256");
    n.update(e);
    return n.digest("hex").slice(0, 32)
}

function getComputerRam() {
    return Math.pow(2, Math.round(Math.log(os.totalmem() / 1024 / 1024) / Math.log(2)))
}

function getOsVersion() {
    const [t, n] = os.release().split(".");
    return parseFloat(`${t}.${n}`)
}

function createHmEncoders() {
    const t = [
        os.arch(),
        os.platform(),
        machineIdSync(),
        os.userInfo().username,
        getOsVersion(),
        getComputerRam()
    ];
    const hm1 = createHashFromStringSha(t.join(""));
    const hm2 = hm1.split("").reverse().join("");
    return {hm1, hm2};
}

function createHashFromString(string) {
    const hash = crypto.createHash('md5');
    hash.update(string);
    return hash.digest()
}

const uuid = [os.platform(), os.arch(), machineIdSync(), os.cpus().length, os.cpus()[0].model].join();
const path = process.platform === "win32" ? "C:\\Users\\" + os.userInfo().username + "\\AppData\\Roaming\\zaap\\keydata\\"
    : "/home/" + os.userInfo().username + "/.config/zaap/keydata/";
const {hm1} = createHmEncoders();

fs.readdirSync(path).filter(file => file.includes("keydata")).forEach(file => {
    const decrypted = decrypt(fs.readFileSync(path + file).toString());
    const {login} = decrypted;
    accounts[login] = decrypted;
    accounts[login]['login'] = login;
    accounts[login]['hm1'] = hm1;
});

module.exports = accounts;