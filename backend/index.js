require('dotenv').config();
const express=require('express')
const cookieParser=require('cookie-parser');
const mongoose=require('mongoose');
const cors=require('cors');


const {authRouter,friendRouter,profileRouter}=require('./routes/index');
const {videoSocketHandler,chatSocketHandler}=require('./socket/chat');


const app=express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:5173",
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

app.use(cors({       //for cross origin talk
  origin: ["http://localhost:5173", "http://localhost:3000"], // frontend URL
  credentials: true,               // if you need cookies later
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS","PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
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