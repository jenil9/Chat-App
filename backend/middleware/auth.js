const jwt = require('jsonwebtoken');
const { User } = require('../models/index');
const rateLimit = require('express-rate-limit');

const JWT_SECRET = process.env.APP_JWT_SECRET;

const loginSignupLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { success: false, message: 'Too many requests. Please try again later.' },
  handler: (req, res) => {
    return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
  },
});

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

module.exports = { authenticateToken, rateLimiter: loginSignupLimiter };
