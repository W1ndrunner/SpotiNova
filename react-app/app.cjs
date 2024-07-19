const express = require('express');
const pg = require('pg');
const app = express();
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();


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

// Helps convert JSON to JavaScript object
app.use(express.json());
const corsOptions ={
    origin:'http://localhost:5173', 
    credentials:true,            //access-control-allow-credentials:true
    optionsSuccessStatus:200
}

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

// Authentice User (GET request)
app.get('/users/authenticate', async (req, res) => {
    try{
        const {email, password} = req.query;
        const query = 'SELECT email, userpassword from users WHERE email = $1';
        const values = [email];
        const result = await pool.query(query, values);
        if (result.rows.length > 0){
            const user = result.rows[0];
            if (bcrypt.compare(password, user.userpassword)){
                res.status(200).send('User authenticated');
            } else{
                res.status(401).send('Invalid password');
            
            }
        } else{
            res.status(404).send('User not found');
        }
    } catch (err){
        console.error(err);
        res.status(500).json({error: 'An error occurred'});
    }
});

// Starts Express server on port 3000
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});