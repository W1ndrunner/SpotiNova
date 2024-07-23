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

app.get('/callback', function(req, res) {

    // Request resresh and access tokens after comparing states
    let code = req.query.code || null;
    let state = req.query.state || null;
    let storedState = req.cookies ? req.cookies[stateKey] : null;
    console.log('state:', state);
    console.log('storedState:', storedState);
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
                    console.log('access token:', access_token);
                    console.log('refresh token:', refresh_token);
                    res.redirect('/home' + 
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

    // Starts Express server on port 3000
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});