//used to make requests
const express = require('express');
//Object Data Modeling (ODM) library for MongoDB
const mongoose = require('mongoose');
//middleware to parse cookies attacked to client request objects
const cookieParser = require('cookie-parser');
//helps manage configuration variables
const dotenv= require('dotenv');
//JSON Web Tokens
const jwt = require('jsonwebtoken');
//middleware to enable Cross-Origin Resource Sharing 
//allows app to handle requests from different origins
const cors = require('cors');
//used for hashing and comparing passwords securely
const bcrypt = require("bcryptjs");
//WebSocket library, enabling real-time communication between server and clients
const ws = require('ws');
//file system module, used to interact with the file system
const fs = require('fs');
//both model schemas for MongoDB 
const User = require('./models/User');
const Message = require('./models/Message')


dotenv.config();
mongoose.connect(process.env.MONGO_URL);

const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true, 
    origin: process.env.CLIENT_URL,
}));

async function getUserDataFromRequest(req) {
    return new Promise((resolve, reject) => {
        const token = req.cookies?.token;
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) throw err;
                resolve(userData);
            });
        } else {
            reject('no token');
        }
    });
}

//retrieves messages between authenticated user and specified user
app.get('/messages/:userId', async (req,res) => {
    const {userId} = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await Message.find({
        sender: {$in:[userId, ourUserId]},
        recipient: {$in:[userId, ourUserId]},
    }).sort({createdAt: 1});
    res.json(messages);
});

//returns a list of all users with their _id and username
app.get('/people', async (req, res) => {
    const users = await User.find({}, {'_id':1, username:1})
    res.json(users);
})

//returns the authenticated user's profile if a valid JWT
//token is provided in the cookies
app.get('/profile', (req,res) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        res.json(userData);
      });
    } else {
      res.status(401).json('no token');
    }
});

//authenticates a user with 'username' and 'password'
//if successful, it generates a JWT token and sets it as a cookie
app.post('/login', async (req,res) => {
    const {username, password} = req.body;
    const foundUser = await User.findOne({username});
    if (foundUser) {
      const passOk = bcrypt.compareSync(password, foundUser.password);
      if (passOk) {
        jwt.sign({userId:foundUser._id,username}, jwtSecret, {}, (err, token) => {
            res.cookie('token', token, {sameSite:'none', secure:true}).json({
                id: foundUser._id,
            });
        });
      }
    }
});

//logs out the user by clearing the JWT token
app.post('/logout', (req, res) => {
    res.cookie('token', '', {sameSite:'none', secure:true}).json('ok');
});

//registers a new user
//if successful, it generates a JWT token and sets it as a cookie
app.post('/register', async (req,res) => {
    const {username, password} = req.body;

    try {
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
        const createdUser = await User.create({
            username: username, 
            password: hashedPassword,
        });
        jwt.sign({userId:createdUser._id, username}, jwtSecret, {}, (err, token) => {
            if(err) throw err;
            res.cookie('token', token, {sameSite:'none', secure:true}).status(201).json({
                id: createdUser._id,
            });
        });

    } catch(err) {
        if (err) throw err;
        res.status(500).json('error');
    }   
});

const server = app.listen(4000);

//WebSocket server initialization
const wss = new ws.WebSocketServer({server});
wss.on('connection', (connection, req) => {
    
    //iterates over all WebSocket clients and extracts their user IDs and username
    function notifyAboutOnlinePeople() {
        [...wss.clients].forEach(client => {
            client.send(JSON.stringify({
                online: [...wss.clients].map(c => ({userId:c.userId, username:c.username}))
            }));
        });
    }

    //every 5 sec a 'ping' is sent and a 'pong' isn't responded within 1 sec,
    //the connection is terminated and user is removed from the online list
    connection.isAlive = true;
    connection.timer = setInterval(() => {
        connection.ping();
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            notifyAboutOnlinePeople();
        }, 1000);
    }, 5000);

    connection.on('pong', () => {
        clearTimeout(connection.deathTimer);
    });

    //read username and id from the cookie for this connection
    const cookies = req.headers.cookie;
    if(cookies) {
        const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));
        if(tokenCookieString) {
            const token = tokenCookieString.split('=')[1]
            if(token) {
                jwt.verify(token, jwtSecret, {}, (err, userData) => {
                    if(err) throw err;
                    const {userId, username} = userData;
                    connection.userId = userId;
                    connection.username = username;
                })
            }
        }
    }

    //listens for incoming messages from the client
    // parses the message data and saves attached files to the server,
    //and stores the messages in the database
    connection.on('message', async (message) => {
        const messageData = JSON.parse(message.toString());
        const {recipient, text, file} = messageData;
        let filename = null;
        if(file) {
            const parts = file.name.split('.');
            const ext = parts[parts.length - 1];
            filename = Date.now() + "." + ext;
            const path = __dirname + '/uploads/' + filename;
            const bufferData = Buffer.from(file.data, 'base64');
            fs.writeFile(path, bufferData, () => {
                console.log('file saved: ' + path);
            });
        }
        if(recipient && (text || file)) {
            const messageDoc = await Message.create({
                sender: connection.userId,
                recipient,
                text,
                file: file ? filename : null,
            });
            [...wss.clients]
                .filter(c => c.userId === recipient)
                .forEach(c => c.send(JSON.stringify({
                    text, 
                    recipient,
                    file: file ? filename : null,
                    _id: messageDoc._id,
                })));
        } 
    });
    //notify everyone about someone being online
    notifyAboutOnlinePeople();
});