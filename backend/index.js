const express=require('express')
const cookieParser=require('cookie-parser');
const mongoose=require('mongoose');
const cors=require('cors');


const {authRouter}=require('./routes/index');

const app=express();
mongoose.connect('mongodb://127.0.0.1:27017/chatapp')
.then(()=>{console.log("database connected")})
.catch(()=>{console.log("error connecting database")})

app.use(cors({       //for cross origin talk
  origin: 'http://localhost:5173', // frontend URL
  credentials: true,               // if you need cookies later
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use('/api/auth',authRouter);
app.get('/',(req,res)=>{
  res.json({
    "msg":"hello from the api of chat app project"
    ,"/api/auth/signup":"create user",
    "api/auth/login":"verify user and generate token"
  });
})

app.listen(3000,()=>{
    console.log("server rrunning at 3000");
})