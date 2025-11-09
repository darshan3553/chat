import { generateToken } from '../lib/utils.js';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
export const signup = async (req, res) => {
  const { fullname, email, password } = req.body;

  try {
    // Basic validations
    if (!fullname || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters long' });
    }

    // Simple email check
    if (!email.includes('@')) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    // Unique email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Hash password & create user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullname,
      email,
      password: hashedPassword,
    });

    // Issue token (optional, if you use JWT cookies)
    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();
    
       res.status(201).json({
      _id: newUser._id,
      fullname: newUser.fullname,
      email: newUser.email,
      profilepic: newUser.profilepic,
    });

    //send a welcome email 
    
    } 
    else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
