const _ = require('lodash').now;

/**
 * UID Generator
 ** Generates a user defind prefix + a random 26 chanracter string 
 ** Eg:  generateUid("Item-") returns 'Item-91O592i9z0s762r5S1i5T5S3K7'
 */

function generateUid(id) {
    const currentTime = _.now().toString();
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < currentTime.length; ++i) {
        id += ((chars.charAt(Math.floor(Math.random() * chars.length))) + currentTime[i]);
    }
    return id;
}

module.exports = generateUid;