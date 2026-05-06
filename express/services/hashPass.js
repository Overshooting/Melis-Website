const argon2 = require('argon2');

const password = process.argv[2] || 'defaultPassword';

async function hashPassword() {
    try {
        const hash = (await argon2.hash(password)).toString();
        console.log('Password ' + password + ' hashed successfully: ' + hash);
    } catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('Error hashing password');
    }
}

hashPassword();