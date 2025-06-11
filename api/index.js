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
      res.cookie('token', token, {sameSite: 'none', secure:true}).status(201).json({ id: createdUser._id, username });
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
        res.cookie('token',token, {sameSite: 'none', secure:true}).json({
          id: foundUser._id,
          username: foundUser.username
        });
    });
  }
}}); 

const server = app.listen(4030);
console.log('API server is running on http://localhost:4030');

const wss = new ws.WebSocketServer({ server });
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
        });
      }
    }
  }

  [...wss.clients].forEach(client =>{
    client.send(JSON.stringify({
      online: [...wss.clients].map(c => ({userId: c.userId, username: c.username})),
  }));
  });
});
