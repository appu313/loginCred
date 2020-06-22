const crypto = require("crypto");
const { split } = require("shamir");
const nodemailer = require("nodemailer");
const config = require("../../config.json")

async function sendmail(email, content) {
    let transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: false,
        auth: {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS
        }
    });

    let info = await transporter.sendMail({
        from: "Elections Bot <noreply@nitcvote.com>",
        to: email,
        subject: "Private Key Share",
        text: "Your share(s): "+content,
        html: "<h2>Your share(s): "+content+"</h2>"
    });
}

function generateKeys() {
    return crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });
}

function shamirSplit(secret, parts) {
    const utf8Encoder = new TextEncoder();
    const secretBytes = utf8Encoder.encode(secret);
    return split(crypto.randomBytes, parts, parts, secretBytes);
}

function shamirShare(emails) {
    const { privateKey, publicKey } = generateKeys();
    let parts = shamirSplit(privateKey, emails.length);
    var count = 0;
    for (let sharenumber in parts) {
        var share = {"id":sharenumber, "share":Buffer.from(parts[sharenumber]).toString('hex')}
        sendmail(emails[count++], JSON.stringify(share));
    }
    return publicKey;
}

module.exports = shamirShare;
