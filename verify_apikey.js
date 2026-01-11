const connectDatabase = require('./config/db');
const db = require('./models'); // Still need db for finding user
const authService = require('./services/authService');
const authJwt = require('./middlewares/authJwt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Mock response object
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    return res;
};

async function run() {
    try {
        console.log('Connecting and syncing DB...');
        await connectDatabase(); // Handles sync and column addition

        const username = 'verify_api_key_' + crypto.randomBytes(4).toString('hex');
        const password = 'password123';

        console.log(`\n1. Registering user: ${username}`);
        const registered = await authService.register(db, { username, password });
        console.log('   Registered ID:', registered.id);

        console.log('\n2. Logging in...');
        let loginResult;
        try {
            loginResult = await authService.login(db, { username, password });
            console.log('DEBUG: loginResult:', loginResult);
        } catch (loginErr) {
            console.error('LOGIN FAILED:', loginErr);
            throw loginErr;
        }

        if (!loginResult.apiKey) {
            throw new Error('FAIL: apiKey not returned in login result');
        }
        console.log('   SUCCESS: apiKey returned:', loginResult.apiKey);
        console.log('   Checking if apiKey matches DB...');
        const userInDb = await db.User.findOne({ where: { username } });
        if (userInDb.apiKey !== loginResult.apiKey) {
            throw new Error('FAIL: apiKey in DB does not match returned key');
        }
        console.log('   SUCCESS: DB has correct apiKey');

        console.log('\n3. Testing Middleware with API Key...');
        const req = {
            headers: {
                'x-api-key': loginResult.apiKey
            }
        };

        let nextCalled = false;
        const next = () => {
            nextCalled = true;
        };

        const res = mockRes();

        await authJwt(req, res, next);

        if (nextCalled) {
            console.log('   SUCCESS: Middleware called next()');
            if (req.user && req.user.username === username) {
                console.log('   SUCCESS: req.user populated correctly:', req.user.username);
            } else {
                throw new Error('FAIL: req.user not populated correctly');
            }
        } else {
            console.log('   FAIL: Middleware did not call next()');
            console.log('   Response:', res.statusCode, res.body);
            throw new Error('Middleware failed');
        }

        console.log('\n4. Testing Middleware with INVALID API Key...');
        const reqInvalid = {
            headers: {
                'x-api-key': 'invalid_key_123'
            }
        };
        const resInvalid = mockRes();
        let nextCalledInvalid = false;
        await authJwt(reqInvalid, resInvalid, () => { nextCalledInvalid = true; });

        if (!nextCalledInvalid && resInvalid.statusCode === 401) {
            console.log('   SUCCESS: Middleware rejected invalid key (401)');
        } else {
            throw new Error('FAIL: Middleware accepted invalid key or wrong status');
        }

        console.log('\nVERIFICATION PASSED!');
        process.exit(0);

    } catch (err) {
        console.error('\nVERIFICATION FAILED:', err);
        process.exit(1);
    }
}

run();
