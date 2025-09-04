const express = require('express');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const {User}=require('../models/index');
const router=express.Router();

const JWT_SECRET='jenil_buha'

router.post('/signup',async (req,res)=>{
  console.log(req.body);
  
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    console.log(existingUser)
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    res.json({ success: true, message: 'User created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/login',async (req,res)=>{
  
  try{
  const {email,password}=req.body;
   const user=await User.findOne({email});
   if(!user)
   {
      return res.status(401).json({ message: "Invalid credentials" });
   }
 
   const isPasswordValid = await bcrypt.compare(password, user.password);
if (!isPasswordValid) {
  return res.status(401).json({ message: "Invalid credentials" });
}


  
  const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);

  // Set token in HttpOnly cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: false, // set true in production (HTTPS)
    sameSite: "strict",
  });

  res.json({ message: "Login successful" });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
})

router.get('/verifyToken',(req,res)=>{
  const token=req.cookies['token'];
  if(!token){
    res.status(401).json({});
    return;
  }
 
  try {
  const decoded = jwt.verify(token, JWT_SECRET);
 
  res.status(200).json(decoded);
} catch (err) {
  res.status(401).json({});
    return;
}

})

module.exports= router;