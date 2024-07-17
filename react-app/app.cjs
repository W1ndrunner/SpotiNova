const express = require('express');
const pg = require('pg');
const app = express();
const fs = require('fs');
const cors = require('cors');
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
        const now = new Date();
        const query = 'INSERT INTO users (userid, email, userpassword, registrationdate) VALUES (DEFAULT, $1, $2, $3) RETURNING *';
        const values = [email, password, now];
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
})

// Starts Express server on port 3000
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});