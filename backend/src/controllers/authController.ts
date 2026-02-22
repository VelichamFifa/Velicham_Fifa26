import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User, Community } from '../models';
import { generateToken, hashPassword, comparePasswords } from '../utils/auth';

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { email, firstName, lastName, password, city, state, country, communityId1, communityId2, whatsappNumber, requestedCommunity } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Enforce mandatory community: either select one or request one
    if (!communityId1 && !requestedCommunity) {
      return res.status(400).json({ error: 'Please select a community or request a new one' });
    }

    // Validate communities exist if provided
    if (communityId1) {
      const community1 = await Community.findOne({ communityId: communityId1 });
      if (!community1) {
        return res.status(400).json({ error: 'Community 1 not found' });
      }
    }

    if (communityId2) {
      if (communityId1 === communityId2) {
        return res.status(400).json({ error: 'Community 1 and Community 2 must be different' });
      }
      const community2 = await Community.findOne({ communityId: communityId2 });
      if (!community2) {
        return res.status(400).json({ error: 'Community 2 not found' });
      }
    }

    const hashedPassword = await hashPassword(password);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const user = new User({
      userId,
      email,
      firstName,
      lastName,
      password: hashedPassword,
      city,
      state,
      country,
      communityId1,
      communityId2,
      whatsappNumber,
      requestedCommunity,
      status: 'active',
      isActive: true,
      role: 'user', // Default role
    });

    await user.save();

    const token = generateToken(userId, email, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        userId,
        email,
        firstName,
        lastName,
        city,
        state,
        country,
        communityId1,
        communityId2,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = await comparePasswords(password, user.password || '');
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Block login if the first community is pending approval (except for admins)
    if (user.role !== 'admin' && !user.communityId1) {
      return res.status(403).json({
        error: 'Your community request is pending approval. You will be able to log in once it is approved.'
      });
    }

    const token = generateToken(user.userId, user.email, user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        city: user.city,
        state: user.state,
        country: user.country,
        communityId1: user.communityId1,
        communityId2: user.communityId2,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ userId: req.user?.userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      city: user.city,
      state: user.state,
      country: user.country,
      communityId1: user.communityId1,
      communityId2: user.communityId2,
      whatsappNumber: user.whatsappNumber,
      requestedCommunity: user.requestedCommunity,
      role: user.role,
      status: user.status,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, city, state, country, whatsappNumber, communityId1, communityId2 } = req.body;

    const user = await User.findOne({ userId: req.user?.userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (city) user.city = city;
    if (state) user.state = state;
    if (country) user.country = country;
    if (whatsappNumber) user.whatsappNumber = whatsappNumber;
    if (communityId1) user.communityId1 = communityId1;
    if (communityId2) user.communityId2 = communityId2;

    if (user.communityId1 && user.communityId2 && user.communityId1 === user.communityId2) {
      return res.status(400).json({ error: 'Community 1 and Community 2 must be different' });
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        city: user.city,
        state: user.state,
        country: user.country,
        communityId1: user.communityId1,
        communityId2: user.communityId2,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
