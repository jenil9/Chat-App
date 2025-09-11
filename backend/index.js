require('dotenv').config();
const express=require('express')
const cookieParser=require('cookie-parser');
const mongoose=require('mongoose');
const cors=require('cors');


const {authRouter,friendRouter}=require('./routes/index');

const app=express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

mongoose.connect(process.env.MONGODB_URI)
.then(()=>{
  if(process.env.NODE_ENV === 'development') {
    console.log("Database connected successfully");
  }
})
.catch((error)=>{
  console.error("Error connecting to database:", error.message);
  process.exit(1);
})

app.use(cors({       //for cross origin talk
  origin: process.env.FRONTEND_URL, // frontend URL
  credentials: true,               // if you need cookies later
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use('/api/auth',authRouter);
app.use('/api/friend',friendRouter);
app.get('/',(req,res)=>{
  res.json({
    "msg":"hello from the api of chat app project"
    ,"/api/auth/signup":"create user",
    "api/auth/login":"verify user and generate token",
    "api/auth/verifyToken":"to verify token and decode it"
  });
})

io.on("connection", (socket) => {
  chatSocketHandler(io, socket);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT,()=>{
    if(process.env.NODE_ENV === 'development') {
      console.log(`Server running at port ${PORT}`);
    }
})