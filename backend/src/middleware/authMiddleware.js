import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token - require JWT_SECRET to be set
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return res.status(500).json({ success: false, message: 'Server configuration error' });
      }

      const decoded = jwt.verify(token, secret);

      // Get user from the token, omitting the password field
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authorization failed, user not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ success: false, message: 'Authorization failed, token invalid' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization failed, no token provided' });
  }
};
