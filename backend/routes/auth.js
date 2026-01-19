const express = require('express');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const {User}=require('../models/index');
const router=express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/signup',async (req,res)=>{
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
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


  
  const token = jwt.sign({ id: user._id,email:user.email}, JWT_SECRET);

  // Set token in HttpOnly cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,          // REQUIRED for HTTPS
    sameSite: "none"       // REQUIRED for cross-origin
  });
  

  res.json({"userid":user._id });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
})

router.get('/verifyToken',async (req,res)=>{
  const token=req.cookies['token'];
  if(!token){
    res.status(401).json({});
    return;
  }
 
  try {
  const decoded = jwt.verify(token, JWT_SECRET);
  const user=await User.findOne({email:decoded.email});//,  
  const data={...decoded,username: user.username,friendCode:user.friendCode,profilePic:user.profilePic}
  res.status(200).json(data);
} catch (err) {
  res.status(401).json({});
    return;
}

})
router.get("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true, // use true in production (HTTPS)
    sameSite: "strict",
  });
  return res.status(200).json({ message: "Logged out successfully" });
});
module.exports= router;