import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  return jwt.sign({ id }, secret, {
    expiresIn: '30d'
  });
};

const validateRegisterInput = (username, email, password) => {
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (!email || !email.includes('@')) {
    return 'Valid email required';
  }
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

const validateLoginInput = (email, password) => {
  if (!email || !password) {
    return 'Email and password required';
  }
  return null;
};

export const register = async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;

    // Validate input
    const validation = validateRegisterInput(username, email, password);
    if (validation) {
      return res.status(400).json({ success: false, message: validation });
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Username or email already registered' });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password, // User model automatically hashes
      avatar,
      isOnline: true
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        mood: user.mood,
        energyLevel: user.energyLevel,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const validation = validateLoginInput(email, password);
    if (validation) {
      return res.status(400).json({ success: false, message: validation });
    }

    // Find user by email or username
    const user = await User.findOne({ $or: [{ email }, { username: email }] });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Match password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Set online
    await User.findByIdAndUpdate(user._id, { isOnline: true, lastSeen: new Date() });

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        mood: user.mood,
        energyLevel: user.energyLevel,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        mood: user.mood,
        energyLevel: user.energyLevel,
        isOnline: user.isOnline
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error loading profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { avatar, status, mood, energyLevel } = req.body;

    const updates = {};
    if (avatar !== undefined) updates.avatar = avatar;
    if (status !== undefined) updates.status = status;
    if (mood !== undefined) updates.mood = mood;
    if (energyLevel !== undefined) updates.energyLevel = Number(energyLevel);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        status: updatedUser.status,
        mood: updatedUser.mood,
        energyLevel: updatedUser.energyLevel
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};
