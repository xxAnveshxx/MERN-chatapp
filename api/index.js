const express = require('express');
const mongoose = require('mongoose');
const app = express();
const dotenv = require('dotenv');
const User = require('./models/User.js');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const ws = require('ws');
const MessageModel = require('./models/message.js');

dotenv.config();
mongoose.connect(process.env.MONGO_URL);
const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

async function getUserDataFromRequest(req){
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token){
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    }  else{
      reject('Unauthorized');
      }
  });
}
app.get('/messages/:userId',async (req, res) => {
  const { userId } = req.params;
  const userData = await getUserDataFromRequest(req);
  const ourUserId = userData.userid;
  const messages = await MessageModel.find({
    sender: {$in: [userId, ourUserId]},
    recipient: {$in: [userId, ourUserId]}
  }).sort({
    createdAt: 1
  });
  res.json(messages);
});

app.get('/people', async (req, res) => {
  const users = await User.find({}, '_id username');
  res.json(users.map(user => ({
    userid: user._id,
    username: user.username
  })));
});

app.get('/profile', async (req, res) => {
  const token = req.cookies?.token;
  if (token){
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
    if (err) throw err;
    res.json({
      userid: userData.userid,
      username: userData.username
    });
  });
  }else{
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({ 
      username:username, 
      password: hashedPassword});
    jwt.sign({ userid: createdUser._id }, jwtSecret, {}, (err, token) => {
      if (err) {
        return res.status(500).json({ error: 'Token generation failed' });
      }
      res.cookie('token', token, {sameSite: 'lax', secure:false}).status(201).json({ id: createdUser._id, username });
    });
  } catch (e) {
    res.status(500).json({ error: 'Registration failed', details: e.message });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });
  if (foundUser){
    const passOk = await bcrypt.compareSync(password, foundUser.password);
    if (passOk){
      jwt.sign({ userid: foundUser._id,username}, jwtSecret, {}, (err, token) => {
        res.cookie('token',token, {sameSite: 'lax', secure:false}).json({
          id: foundUser._id,
          username: foundUser.username
        });
    });
  }
}}); 

const server = app.listen(4030);
console.log('API server is running on http://localhost:4030');

const wss = new ws.WebSocketServer({ server });
wss.setMaxListeners(20);
wss.on('connection', (connection,req) => {
  const cookies = req.headers.cookie;
  if (cookies){
    const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));
    if (tokenCookieString){
      const token = tokenCookieString.split('=')[1];
      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData)=> {
          if (err) throw err;
          const {userid, username} = userData;
          connection.userId = userid;
          connection.username = username;
          connection.on('message', async (message) => {
            const messageData = JSON.parse(message.toString());
            const {recipient, text} = messageData;
            if (recipient && text){
              const messageDoc = await MessageModel.create({
                sender: connection.userId,
                recipient,
                text
              });
              [...wss.clients]
              .filter(c => c.userId === recipient)
              .forEach(c => c.send(JSON.stringify({
                    text,
                    sender: connection.userId,
                    recipient,
                    _id: messageDoc._id,
              })));
            }
          });

          [...wss.clients].forEach(client =>{
            client.send(JSON.stringify({
              online: [...wss.clients].map(c => ({userId: c.userId, username: c.username})),
          }));
          });
        });
      }
    }
  }
});
 