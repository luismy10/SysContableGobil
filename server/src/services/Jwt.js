const jwt = require('jsonwebtoken');

function createToken(user, key, expiresIn = '10h') {
    return new Promise((resolve, reject) => {
        jwt.sign(user, key, { expiresIn: expiresIn }, (error, token) => {
            if (error) {
                reject("error");
            } else {
                resolve(token);
            }
        });
    });
}

function verifyToken(token, key) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, key, (error, authorization) => {
            if (error) {
                reject("expired");
            } else {
                resolve(authorization);
            }
        });
    });
}

function token(req, res, next) {
    const bearerToken = req.headers['authorization'];

    if (typeof bearerToken !== 'undefined') {
        const token = bearerToken.split(" ")[1];
        req.token = token;
        next();
    } else {
        res.sendStatus(403);
    }
}

module.exports = { createToken, verifyToken, token }