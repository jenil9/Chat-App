require('dotenv').config();
const express=require('express')
const cookieParser=require('cookie-parser');
const mongoose=require('mongoose');
const fs=require('fs');
const cors=require('cors');


const {authRouter,friendRouter,profileRouter}=require('./routes/index');
const {videoSocketHandler,chatSocketHandler}=require('./socket/chat');


const app=express();
app.use(express.static(__dirname))

const key = fs.readFileSync('cert.key')
const cert = fs.readFileSync('cert.crt')
const server = require('https').createServer({key,cert},app);
const io = require('socket.io')(server, {
  cors: {
    // origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  }
});


mongoose.connect(process.env.MONGODB_URI)
.then(()=>{
  if(process.env.NODE_ENV === 'development') {
  }
})
.catch((error)=>{
  console.error("Error connecting to database:", error.message);
  process.exit(1);
})

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://yourdomain.com"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (Postman, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use('/api/auth',authRouter);
app.use('/api/friend',friendRouter);
app.use('/api/profile',profileRouter);
app.get('/',(req,res)=>{
  res.json({
    "msg":"hello from the api of chat app project"
    ,"/api/auth/signup":"create user",
    "api/auth/login":"verify user and generate token",
    "api/auth/verifyToken":"to verify token and decode it"
  });
})

// Test endpoint for CORS
app.get('/test-cors', (req, res) => {
  res.json({ message: 'CORS is working!', timestamp: new Date().toISOString() });
})

io.on("connection", (socket) => {
  chatSocketHandler(io, socket);
  videoSocketHandler(io,socket);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT,()=>{
    if(process.env.NODE_ENV === 'development') {
      console.log(`Server running at port ${PORT}`);
      console.log(`CORS enabled for: http://localhost:5173`);
    }
})
// require('dotenv').config();
// const express=require('express')
// const cookieParser=require('cookie-parser');
// const mongoose=require('mongoose');
// const fs=require('fs');
// const cors=require('cors');

// const {authRouter,friendRouter,profileRouter}=require('./routes/index');
// const {videoSocketHandler,chatSocketHandler}=require('./socket/chat');

// const app=express();
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// // FIXED: Handle both HTTP and HTTPS based on environment
// let server;
// const PORT = process.env.PORT || 3000;
// const isDevelopment = process.env.NODE_ENV !== 'production';

// if (isDevelopment) {
//   // Use HTTP for development
//   server = require('http').createServer(app);
//   console.log('Using HTTP (development mode)');
// } else {
//   // Use HTTPS for production
//   try {
//     const key = fs.readFileSync('cert.key')
//     const cert = fs.readFileSync('cert.crt')
//     server = require('https').createServer({key,cert},app);
//     console.log('Using HTTPS with certificates (production)');
//   } catch (err) {
//     server = require('http').createServer(app);
//     console.log('HTTPS certificates not found, falling back to HTTP');
//   }
// }

// const io = require('socket.io')(server, {
//   cors: {
//     origin: "http://localhost:5173",
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     credentials: true
//   }
// });

// mongoose.connect(process.env.MONGODB_URI)
// .then(()=>{
//   if(process.env.NODE_ENV === 'development') {
//     console.log('Connected to MongoDB');
//   }
// })
// .catch((error)=>{
//   console.error("Error connecting to database:", error.message);
//   process.exit(1);
// })

// const allowedOrigins = [
//   "http://localhost:5173",
//   "http://localhost:3000",
//   "https://yourdomain.com"
// ];

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin) return callback(null, true);

//     if (allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("CORS not allowed"));
//     }
//   },
//   credentials: true
// }));

// app.use('/api/auth',authRouter);
// app.use('/api/friend',friendRouter);
// app.use('/api/profile',profileRouter);

// app.get('/',(req,res)=>{
//   res.json({
//     "msg":"hello from the api of chat app project",
//     "/api/auth/signup":"create user",
//     "/api/auth/login":"verify user and generate token",
//     "/api/auth/verifyToken":"to verify token and decode it"
//   });
// })

// app.get('/test-cors', (req, res) => {
//   res.json({ message: 'CORS is working!', timestamp: new Date().toISOString() });
// })

// io.on("connection", (socket) => {
//   chatSocketHandler(io, socket);
//   videoSocketHandler(io,socket);
// });

// server.listen(PORT,()=>{
//     console.log(`Server running at port ${PORT}`);
//     console.log(`CORS enabled for: http://localhost:5173`);
// })