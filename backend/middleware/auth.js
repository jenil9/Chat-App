const jwt = require('jsonwebtoken');
const { User } = require('../models/index');

const JWT_SECRET = process.env.APP_JWT_SECRET;

const authenticateToken = async (req, res, next) => {
  const token = req.cookies['token'];
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = { ...decoded, username: user.username, friendCode: user.friendCode, profilePic: user.profilePic };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { authenticateToken };