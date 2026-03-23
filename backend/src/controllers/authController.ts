import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User, Community } from '../models';
import { generateToken, hashPassword, comparePasswords } from '../utils/auth';
import { OAuth2Client } from 'google-auth-library';
import { capitalizeProperNoun } from '../utils/stringUtils';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { email, firstName, lastName, password, city, state, country, communityId1, communityId2, phoneNumber, requestedCommunity } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Registration is allowed with no community

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
      firstName: capitalizeProperNoun(firstName),
      lastName: capitalizeProperNoun(lastName),
      password: hashedPassword,
      city: capitalizeProperNoun(city),
      state: capitalizeProperNoun(state),
      country: capitalizeProperNoun(country),
      communityId1,
      communityId2,
      phoneNumber,
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

    // Community requirement removed

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

export const googleLogin = async (req: AuthRequest, res: Response) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const { email, given_name, family_name, sub, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Generate a placeholder user for missing required fields.
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const hashedPassword = await hashPassword(Math.random().toString(36).slice(-10)); // dummy password

      user = new User({
        userId,
        email,
        firstName: given_name || 'Google',
        lastName: family_name || 'User',
        password: hashedPassword,
        googleId: sub,
        profileImage: picture,
        status: 'active',
        isActive: true,
        city: 'Not Set',
        state: 'Not Set',
        country: 'Not Set',
      });
      await user.save();
    } else {
      // If user exists but hasn't linked googleId, update it
      if (!user.googleId) {
        user.googleId = sub;
      }
      if (!user.profileImage && picture) {
        user.profileImage = picture;
      }
      await user.save();
    }

    const token = generateToken(user.userId, user.email);

    res.json({
      message: 'Google login successful',
      token,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        city: user.city,
        state: user.state,
        country: user.country,
        profileImage: user.profileImage,
        communityId1: user.communityId1,
        communityId2: user.communityId2,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Google login failed' });
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
      phoneNumber: user.phoneNumber,
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
    const { firstName, lastName, city, state, country, phoneNumber, communityId1, communityId2, requestedCommunity } = req.body;

    const user = await User.findOne({ userId: req.user?.userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (firstName) user.firstName = capitalizeProperNoun(firstName);
    if (lastName) user.lastName = capitalizeProperNoun(lastName);
    if (city) user.city = capitalizeProperNoun(city);
    if (state) user.state = capitalizeProperNoun(state);
    if (country) user.country = capitalizeProperNoun(country);
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (communityId1) user.communityId1 = communityId1;
    if (communityId2) user.communityId2 = communityId2;
    if (requestedCommunity !== undefined) user.requestedCommunity = requestedCommunity;

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
