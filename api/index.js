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
const MessageModel = require('./models/Message.js');
const fs = require('fs');

dotenv.config();
const PORT = process.env.PORT || 4030;
mongoose.connect(process.env.MONGO_URL);
const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

app.use('/uploads', express.static(__dirname + '/uploads'));

app.use(cors({
    origin: [
        'https://mern-chatapp-1-mzeq.onrender.com',
        'http://localhost:5173',
        process.env.CLIENT_URL
    ], 
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get('/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

async function getUserDataFromRequest(req){
  return new Promise((resolve, reject) => {
    let token = req.cookies?.token;
    
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (token){
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) {
          console.log('JWT verification error:', err.message);
          reject('Invalid token');
        } else {
          resolve(userData);
        }
      });
    } else {
      reject('No token provided');
    }
  });
}

app.get('/messages/:userId',async (req, res) => {
  try {
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
  } catch (error) {
    console.log('Messages fetch error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.get('/people', async (req, res) => {
  const users = await User.find({}, {'_id':1 ,username:1});
  res.json(users);
});

app.get('/profile', async (req, res) => {
  try {
    const userData = await getUserDataFromRequest(req);
    res.json({
      userid: userData.userid,
      username: userData.username
    });
  } catch (error) {
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
      res.cookie('token', token, {
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true 
      }).status(201).json({ 
        id: createdUser._id, 
        username,
        token: token
      });
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
        res.cookie('token', token, {
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true
        }).json({
          id: foundUser._id,
          username: foundUser.username,
          token: token
        });
    });
  }
}}); 

app.post('/logout', (req, res) => {
  res.cookie('token', '', { 
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }).status(200).json({ message: 'Logged out successfully' });
});

const server = app.listen(PORT, () => {
  console.log(`API server is running on port ${PORT}`);});

const wss = new ws.WebSocketServer({ server });
wss.setMaxListeners(20);

wss.on('connection', (connection, req) => {
  
  function notifyAboutOnlinePeople() {
    [...wss.clients].forEach(client => {
      if (client.readyState === ws.OPEN) {
        client.send(JSON.stringify({
          online: [...wss.clients]
            .filter(c => c.readyState === ws.OPEN && c.userId)
            .map(c => ({userId: c.userId, username: c.username})),
        }));
      }
    });
  }

  connection.isAlive = true;
  connection.lastSeen = Date.now();
  
  connection.pingInterval = setInterval(() => {
    if (!connection.isAlive) {
      console.log(`Connection terminated for user: ${connection.username || 'unknown'} - No response to ping`);
      clearInterval(connection.pingInterval);
      connection.terminate();
      notifyAboutOnlinePeople();
      return;
    }
    
    connection.isAlive = false;
    connection.ping();
  }, 120000); 

  connection.on('pong', () => {
    connection.isAlive = true;
    connection.lastSeen = Date.now();
  });

  connection.on('close', () => {
    console.log(`User ${connection.username || 'unknown'} disconnected`);
    clearInterval(connection.pingInterval);
    notifyAboutOnlinePeople();
  });

  connection.on('error', (error) => {
    console.log(`WebSocket error for user ${connection.username || 'unknown'}:`, error.message);
    clearInterval(connection.pingInterval);
  });

  const url = require('url');
  const query = url.parse(req.url, true).query;
  const cookies = req.headers.cookie;
  
  let token = null;
  
  if (query.token) {
    token = query.token;
  } else if (cookies) {
    const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));
    if (tokenCookieString) {
      token = tokenCookieString.split('=')[1];
    }
  }
  
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) {
        console.log('WebSocket auth error:', err.message);
        connection.close(1008, 'Invalid token');
        return;
      }
      
      const {userid, username} = userData;
      connection.userId = userid;
      connection.username = username;
      
      console.log(`User ${username} connected via WebSocket`);
      
      connection.on('message', async (message) => {
        connection.lastSeen = Date.now();
        const messageData = JSON.parse(message.toString());
        const {recipient, text, file} = messageData;
        
        let filename = null;
        if (file) {
          console.log('size', file.data.length);
          const parts = file.name.split('.');
          const ext = parts[parts.length - 1];
          filename = Date.now() + '.'+ext;
          const path = __dirname + '/uploads/' + filename;
          const bufferData = Buffer.from(file.data.split(',')[1], 'base64');
          fs.writeFile(path, bufferData, () => {
            console.log('file saved:'+path);
          });
        }
        
        if (recipient && (text || file)){ 
          const messageDoc = await MessageModel.create({
            sender: connection.userId,
            recipient,
            text: text || '',
            file: file ? filename : null, 
          });
          [...wss.clients]
          .filter(c => (c.userId === recipient || c.userId === connection.userId) && c.readyState === ws.OPEN)
          .forEach(c => c.send(JSON.stringify({
                text,
                sender: connection.userId,
                recipient,
                file: file ? filename : null, 
                _id: messageDoc._id,
          })));
        }
      });

      notifyAboutOnlinePeople();
    });
  } else {
    console.log('No token provided for WebSocket connection');
    connection.close(1008, 'No token provided');
  }
});

setInterval(() => {
  const now = Date.now();
  wss.clients.forEach((connection) => {
    if (connection.lastSeen && (now - connection.lastSeen) > 300000) {
      console.log(`Cleaning up stale connection for user: ${connection.username || 'unknown'}`);
      connection.terminate();
    }
  });
}, 600000);