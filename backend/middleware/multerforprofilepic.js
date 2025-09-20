const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'uploads', 'profile_pic');

        // Create folder if it doesn't exist
        fs.mkdirSync(uploadPath, { recursive: true });

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Use user ID + original file extension
        const ext = path.extname(file.originalname); // .jpg, .png, etc
        cb(null, req.params.id + ext); 
    }
});

const upload = multer({ storage });
module.exports = upload;
