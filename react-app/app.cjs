const express = require('express');
const pg = require('pg');
const app = express();
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcrypt');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const { error } = require('console');
require('dotenv').config();
const redirect_url = 'http://localhost:3000/callback';

// Database connection details with SSL
const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    ssl: {
        ca: fs.readFileSync('ca-certificate.crt').toString(),
    },

});

const generateRandomString = function(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

// Helps convert JSON to JavaScript object
app.use(express.json());
app.use(cookieParser());
const corsOptions ={
    origin:'http://localhost:5173', 
    credentials:true,            //access-control-allow-credentials:true
    optionsSuccessStatus:200
}
let stateKey = 'spotify_auth_state'; // Name of cookie
app.use(cors(corsOptions));

// Create User (POST request)
app.post('/users/create', async (req, res) => {
    try{
        const{email, password} = req.body;
        const query1 = 'SELECT email from users WHERE email = $1';
        const values1 = [email];
        const result1 = await pool.query(query1, values1);
        if (result1.rows.length > 0){
            res.status(409).send('User already exists');
            return;
        }
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);
        const now = new Date();
        const query = 'INSERT INTO users (userid, email, userpassword, registrationdate) VALUES (DEFAULT, $1, $2, $3) RETURNING *';
        const values = [email, hash, now];
        const result = await pool.query(query, values);
        if (result.rows.length > 0){
            res.status(200).json(result.rows[0]);
        } else{
            res.status(400).send('User not created');
        }
    } catch(err){
        console.error(err);
        res.status(500).json({error: 'An error occurred'});
    }
});

async function authenticateUser(password, user){
    const result = await bcrypt.compare(password, user.userpassword);
    return result;
}
// Authentice User (GET request)
app.get('/users/authenticate', async (req, res) => {
    try{
        const {email, password} = req.query;
        const query = 'SELECT email, userpassword from users WHERE email = $1';
        const values = [email];
        const result = await pool.query(query, values);
        if (result.rows.length > 0){
            const user = result.rows[0];
            const result2 = await authenticateUser(password, user);
            if (result2){
                res.status(200).send('User authenticated');
            } else{
                res.status(401).send('User not authenticated');
            }
        } else{
            res.status(404).send('User not found');
        }
    } catch (err){
        console.error(err);
        res.status(500).json({error: 'An error occurred'});
    }
});

// Add tokens to user (POST request)
app.post('/users/addTokens', async (req, res) => {
    try{
        const{email, accessToken, refreshToken} = req.body;
        const expires_at = new Date(new Date().getTime() + 3600 * 1000);
        const query = 'UPDATE users SET accesstoken = $1, refreshtoken = $2, tokenexpire = $3 WHERE email = $4 RETURNING *';
        const values = [accessToken, refreshToken, expires_at, email];
        const result = await pool.query(query, values);
        if (result.rows.length > 0){
            res.status(200).json(result.rows[0]);
        } else{
            res.status(400).send('Tokens not added');
        }
    } catch (error){
        console.error(error);
        res.status(500).json({error: 'An error occurred'});
    }
});


// Connect to Spotify (GET request)
app.get('/connect', function(req, res) { // handle login request from connect button on homepage
    let state = generateRandomString(16);
    res.cookie(stateKey, state); // set cookie to travel with request
    res.header('Access-Control-Allow-Origin', '*');
    // request authorisation - auto redirects to callback
    const scope = 'user-top-read ';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: process.env.CLIENT_ID,
            scope: scope,
            redirect_uri: redirect_url,
            state: state
        }));
});

// Callback function to receive tokens
app.get('/callback', function(req, res) {

    // Request resresh and access tokens after comparing states
    let code = req.query.code || null;
    let state = req.query.state || null;
    let storedState = req.cookies ? req.cookies[stateKey] : null;
    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else{
        res.clearCookie(stateKey);
        const authOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64'))
            },
            body: `code=${code}&redirect_uri=${redirect_url}&grant_type=authorization_code`,
            json: true
        };

        fetch('https://accounts.spotify.com/api/token', authOptions)
        .then((response) => {
            if (response.status === 200) {
                response.json().then((data) => {
                    const access_token = data.access_token;
                    const refresh_token = data.refresh_token;
                    const expires_at = new Date(new Date().getTime() + data.expires_in * 1000); 
                    res.redirect('http://localhost:5173/home?' + 
                        querystring.stringify({
                            access_token: access_token,
                            refresh_token: refresh_token
                        }));
                        });
                } else{
                    console.log('error:', response);
                    res.redirect('/home' +
                        querystring.stringify({
                            error: 'invalid_token'
                        }));
                };
            })
            .catch(error => {
                console.error(error);
            });
    }
});

async function refreshAccessToken(refresh_token) {
    const authOptions = {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=refresh_token&refresh_token=${refresh_token}`,
    };
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', authOptions);
        if (response.status === 200) {
            const data = await response.json();
            const access_token = data.access_token;
            const refresh_token = data.refresh_token;
            const expires_at = new Date(new Date().getTime() + data.expires_in * 1000); 
            return { access_token: access_token, refresh_token: refresh_token, expires_at: expires_at };
        }
    } catch (error) {
        console.error(error);
    }
}

// Refresh token (GET request)
app.get('/refreshToken', async (req, res) => {
    const refresh_token = req.query.refresh_token;
    const result = await refreshAccessToken(refresh_token);
    res.send(result);
});

// Get access token (GET request)
app.get('/users/getToken', async (req, res) => {
    try{
        const {email} = req.query;
        const query = 'SELECT accesstoken, refreshtoken, tokenexpire from users WHERE email = $1';
        const values = [email];
        const result = await pool.query(query, values);
        if (result.rows.length > 0){
            const user = result.rows[0];
            const now = new Date();
            if (user.tokenexpire > now){
                res.status(200).json(user.access_token);
                console.log('access token:', user.access_token);
            } else{
                const result2 = await refreshAccessToken(user.refreshtoken);
                const query2 = 'UPDATE users SET accesstoken = $1, refreshtoken = $2, tokenexpire = $3 WHERE email = $4 RETURNING *';
                const values2 = [result2.access_token, result2.refresh_token, result2.expires_at, email];
                const result3 = await pool.query(query2, values2);
                if (result3.rows.length > 0){
                    res.status(200).json(result2.access_token);
                    console.log('access token:', result2.access_token);
                } else{
                    res.status(400).send('Tokens not updated');
                    }
            }
        } else{
            res.status(404).send('User not found');
        }
    } catch (error){
        console.error(error);
        res.status(500).json({error: 'An error occurred'});
    }
});

// Get top artists (GET request)
// Get top tracks (GET request)
app.get('/toptracks', async (req, res) => {
    
});


    // Starts Express server on port 3000
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});