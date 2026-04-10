// require('dotenv').config();
// const express=require('express')
// const cookieParser=require('cookie-parser');
// const mongoose=require('mongoose');
// const fs=require('fs');
// const cors=require('cors');


// const {authRouter,friendRouter,profileRouter}=require('./routes/index');
// const {videoSocketHandler,chatSocketHandler}=require('./socket/chat');


// const app=express();
// app.use(express.static(__dirname))

// const key = fs.readFileSync('cert.key')
// const cert = fs.readFileSync('cert.crt')
// const server = require('https').createServer({key,cert},app);
// const io = require('socket.io')(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     credentials: true
//   }
// });


// mongoose.connect(process.env.APP_DB_URI)
// .then(()=>{
//   if(process.env.APP_SERVER_ENV === 'development') {
//   }
// })
// .catch((error)=>{
//   console.error("Error connecting to database:", error.message);
//   process.exit(1);
// })

// const allowedOrigins = [
//   process.env.APP_CLIENT_URL,
//   process.env.APP_CLIENT_URL_PRODUCTION
// ].filter(Boolean);

// // app.use(cors({
// //   origin: function (origin, callback) {
// //     // allow requests with no origin (Postman, mobile apps)
// //     if (!origin) return callback(null, true);

// //     if (allowedOrigins.includes(origin)) {
// //       callback(null, true);
// //     } else {
// //       callback(new Error("CORS not allowed"));
// //     }
// //   },
// //   credentials: true
// // }));
// app.use(cors({
//   origin: true,
//   credentials: true
// }));

// const  path= require('path') ;

// // app.use(express.static(path.join(__dirname, "../chatapp/dist")));

// // app.get("*", (req, res) => {
// //   res.sendFile(path.join(__dirname, "../chatapp/dist/index.html"));
// // });

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());
// app.use('/api/auth',authRouter);
// app.use('/api/friend',friendRouter);
// app.use('/api/profile',profileRouter);
// // app.get('/',(req,res)=>{
// //   res.json({
// //     "msg":"hello from the api of chat app project"
// //     ,"/api/auth/signup":"create user",
// //     "api/auth/login":"verify user and generate token",
// //     "api/auth/verifyToken":"to verify token and decode it"
// //   });
// // })

// // Test endpoint for CORS
// app.get('/test-cors', (req, res) => {
//   res.json({ message: 'CORS is working!', timestamp: new Date().toISOString() });
// })

// app.use(express.static(path.join(__dirname, "../chatapp/dist")));

// app.use((req, res) => {
//   res.sendFile(path.join(__dirname, "../chatapp/dist/index.html"));
// });

// io.on("connection", (socket) => {
//   chatSocketHandler(io, socket);
//   videoSocketHandler(io,socket);
// });

// const PORT = process.env.APP_SERVER_PORT || 3000;
// server.listen(PORT,"0.0.0.0", () => {
//     if (process.env.APP_SERVER_ENV === 'development') {
//       console.log(`Server running at port ${PORT}`);
//       console.log(`CORS enabled for: ${process.env.APP_CLIENT_URL}`);
//     }
// });
if(process.env.APP_SERVER_ENV === 'development'){require('dotenv').config();}
const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');

const { authRouter, friendRouter, profileRouter } = require('./routes/index');
const { videoSocketHandler, chatSocketHandler } = require('./socket/chat');

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


const key = fs.readFileSync('cert.key');
const cert = fs.readFileSync('cert.crt');
const server = null;

if(process.env.APP_SERVER_ENV === 'development') {server = https.createServer({ key, cert }, app)}
else {server = https.createServer(app)}

const io = require('socket.io')(server, {
  cors: process.env.APP_SERVER_ENV === 'development'
    ? {
        origin: process.env.APP_CLIENT_URL,  // http://localhost:5173
        credentials: true,
      }
    : {}   // same origin in production — no cors needed
});

// ✅ Database
mongoose.connect(process.env.APP_DB_URI)
  .then()
  .catch((error) => {
    console.error("DB connection error:", error.message);
    process.exit(1);
  });

// API routes — before static files
app.use('/api/auth', authRouter);
app.use('/api/friend', friendRouter);
app.use('/api/profile', profileRouter);


app.use(express.static(path.join(__dirname, '../chatapp/dist')));


app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../chatapp/dist/index.html'));
});

// Socket handlers
io.on('connection', (socket) => {
  chatSocketHandler(io, socket);
  videoSocketHandler(io, socket);
});

const PORT = process.env.APP_SERVER_PORT;
server.listen(PORT, '0.0.0.0', () => {
  
});