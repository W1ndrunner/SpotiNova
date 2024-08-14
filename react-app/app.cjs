const express = require('express');
const pg = require('pg');
const app = express();
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcrypt');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const { error } = require('console');
const {spawn} = require('child_process');
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

async function refreshAccessToken(refreshToken) {
    const authOptions = {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
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
                res.status(200).json(user.accesstoken);
                console.log('access token, not expired:', user.accesstoken);
            } else{
                const result2 = await refreshAccessToken(user.refreshtoken);
                if (result2.refresh_token == undefined){
                    const query2 = 'UPDATE users SET accesstoken = $1, tokenexpire = $2 WHERE email = $3 RETURNING *';
                    const values2 = [result2.access_token, result2.expires_at, email];    
                    const result3 = await pool.query(query2, values2);
                    if (result3.rows.length > 0){
                        res.status(200).json(result2.access_token);
                        console.log('access token, expired no refresh: ', result2.access_token);
                    } else{
                        res.status(400).send('Tokens not updated');
                        }
                } else{    
                    const query2 = 'UPDATE users SET accesstoken = $1, refreshtoken = $2, tokenexpire = $3 WHERE email = $4 RETURNING *';
                    const values2 = [result2.access_token, result2.refresh_token, result2.expires_at, email];
                    console.log('refresh token: ', result2.refresh_token);      
                    const result3 = await pool.query(query2, values2);
                    if (result3.rows.length > 0){
                        res.status(200).json(result2.access_token);
                        console.log('access token, expired with refresh: ', result2.access_token);
                    } else{
                        res.status(400).send('Tokens not updated');
                        }
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

async function addTopTracks(userid, tracks){
    try{
        let isError = false;
        const query1 = 'DELETE FROM songs WHERE spotifyid IN (SELECT spotifyid FROM user_topsongs WHERE userid = $1)';
        const values1 = [userid];
        const result1 = await pool.query(query1, values1);
        const query2 = 'DELETE FROM user_topsongs WHERE userid = $1';
        const values2 = [userid];
        const result2 = await pool.query(query2, values2);
        for (let i = 0; i < tracks.length; i++){
            const query = 'INSERT INTO songs (spotifyid, artist, releasedate, popularity, danceability, energy, songkey, loudness, speechiness, acousticness, instrumentalness, liveness, valence, tempo, name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *';
            const values = [tracks[i].id, tracks[i].artist, tracks[i].year, tracks[i].popularity, tracks[i].danceability, tracks[i].energy, tracks[i].key, tracks[i].loudness, tracks[i].speechiness, tracks[i].acousticness, tracks[i].instrumentalness, tracks[i].liveness, tracks[i].valence, tracks[i].tempo, tracks[i].name];
            const query2 = 'INSERT INTO user_topsongs (userid, spotifyid) VALUES ($1, $2) RETURNING *';
            const values2 = [userid, tracks[i].id];
            const result = await pool.query(query, values);
            const result2 = await pool.query(query2, values2);
            if (!(result.rows.length > 0 && result2.rows.length > 0)){
                isError = true;
            }
        }
        return isError;
    } catch(error){
        console.error(error);
        res.status(500).json({error: 'An error occurred'});
    }
};

// Add Top Tracks to database (POST request)
app.post('/users/addTopTracks', async (req, res) => {
    try{
        const {email, tracks} = req.body;
        const query1 = 'SELECT userid from users WHERE email = $1';
        const values1 = [email];
        const result1 = await pool.query(query1, values1);
        const userid = result1.rows[0].userid;
        const result2 = await addTopTracks(userid, tracks);
        console.log('result2: ', result2);
        if (!result2){
            res.status(200).send('Top tracks added');
        } else{
            res.status(400).send('Top tracks not added');
        }
    } catch (error){
        console.error(error);
        res.status(500).json({error: 'An error occurred'});
    }
});

app.get('/users/recommendations', async (req, res) => {
    try{
        const{email} = req.query;
        const query = 'SELECT userid from users WHERE email = $1';
        const values = [email];
        const result = await pool.query(query, values);
        const userid = result.rows[0].userid;
        let dataToSend;
        const process = spawn('python', ['recommendations.py', userid]);
        process.on('error', (error) => {
            console.error(`Error spawning Python script: ${error.message}`);
        });
        process.stfout.on('data', (data) => {
            dataToSend = data.toString();
        });
        process.stderr.on('data', (data) => {
            console.error(`Error from Python script: ${data.toString()}`);
        });
        process.on('close', (code) => {
            console.log(`Python script exited with code ${code}`);
            res.status(200).json(dataToSend);
        });
    } catch (error){
        console.error(error);
        res.status(500).json({error: 'An error occurred'});
    }
});

    // Starts Express server on port 3000
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});