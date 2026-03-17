const upload = require('../middleware/multerforprofilepic'); // your multer setup
const fs = require('fs');
// const cloudinary = require('./cloudinaryConfig'); // your cloudinary config

const express = require('express');
const mongoose = require('mongoose');
const { User } = require('../models/index');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Apply authentication to all profile routes
router.use(authenticateToken);

const cloudinaryupload=require('../utility/cloudinary');

router.post('/profilepic',upload.single('image'),async (req,res)=>{
    const userid= req.user.id;
    try{
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const result = await cloudinaryupload(req.file.path, userid);

        // 2️⃣ Delete local file
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Failed to delete local file:', err);
        });
        await User.findByIdAndUpdate(userid, { profilePic: result.secure_url });

        // 3️⃣ Return Cloudinary URL
        res.json({ url: result.secure_url });
    }
    catch(err)
    {
        res.status(500).json({ message: err.message });
    }
})

router.patch('/profilepic/remove',async(req,res)=>{
    const userid= req.user.id;
    try{
        await User.findByIdAndUpdate(userid, { profilePic: null });
        res.status(200).json({});
    }
    catch(err)
    {
        res.status(500).json({ message: err.message });
    }
})
router.patch('/update-username',async(req,res)=>{
    const userid= req.user.id;
    try{
        await User.findByIdAndUpdate(userid, { username: req.body.username });
        res.status(200).json({});
    }
    catch(err)
    {
        res.status(500).json({ message: err.message });
    }
})
module.exports=router;