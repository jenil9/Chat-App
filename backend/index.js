if (process.env.APP_SERVER_ENV === 'development') { require('dotenv').config(); }

const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const { authRouter, friendRouter, profileRouter } = require('./routes/index');
const { videoSocketHandler, chatSocketHandler } = require('./socket/chat');

const app = express();

// ✅ CORS must be first
app.use(cors({
  origin: process.env.APP_CLIENT_URL || "*",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ HTTPS in development, HTTP in production (Render handles SSL)
let server;
if (process.env.APP_SERVER_ENV === 'development') {
  const fs = require('fs');
  const https = require('https');
  const key = fs.readFileSync('cert.key');
  const cert = fs.readFileSync('cert.crt');
  server = https.createServer({ key, cert }, app);
} else {
  const http = require('http');
  server = http.createServer(app);
}

// ✅ Socket.io with CORS
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.APP_CLIENT_URL || "*",
    credentials: true,
  }
});

// ✅ Database
mongoose.connect(process.env.APP_DB_URI)
  .then(() => console.log("DB connected"))
  .catch((error) => {
    console.error("DB connection error:", error.message);
    process.exit(1);
  });

// ✅ API routes
app.use('/api/auth', authRouter);
app.use('/api/friend', friendRouter);
app.use('/api/profile', profileRouter);

// ✅ Serve frontend
app.use(express.static(path.join(__dirname, '../chatapp/dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../chatapp/dist/index.html'));
});

// ✅ Socket handlers
io.on('connection', (socket) => {
  chatSocketHandler(io, socket);
  videoSocketHandler(io, socket);
});

// ✅ Use Render's PORT in production, custom port in development
const PORT = process.env.PORT || process.env.APP_SERVER_PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});