import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User, Community } from '../models';
import { generateToken, hashPassword, comparePasswords } from '../utils/auth';
import { OAuth2Client } from 'google-auth-library';
import { capitalizeProperNoun } from '../utils/stringUtils';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getAllowedGoogleAudiences = (): string[] => {
  const clientIdsEnv = process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || '';
  return clientIdsEnv
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
};

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const {
      email,
      firstName,
      lastName,
      password,
      city,
      state,
      country,
      communityId,
      phoneNumber,
      googleId,
      profileImage
    } = req.body;

    const existingUser = await User.findOne({ Email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Validate community exists if provided
    if (communityId) {
      const community = await Community.findOne({ Community_ID: communityId.toString() });
      if (!community) {
        return res.status(400).json({ success: false, message: 'Community not found' });
      }
    }

    const hashedPassword = password ? await hashPassword(password) : undefined;
    // Autoincrement User_ID or use a unique string
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const user = new User({
      User_ID: userId,
      Email: email.toLowerCase(),
      First_Name: capitalizeProperNoun(firstName),
      Last_Name: capitalizeProperNoun(lastName),
      password: hashedPassword,
      googleId,
      profileImage,
      WhatsApp_Number: phoneNumber,
      City: city ? capitalizeProperNoun(city) : 'Not Set',
      State: state ? capitalizeProperNoun(state) : 'Not Set',
      Country: country || 'Not Set',
      Community_ID: communityId || undefined,
      Status: 'Active',
      role: 'user'
    });

    await user.save();

    const token = generateToken(user.User_ID, user.Email, user.role || 'user');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        User_ID: user.User_ID,
        Email: user.Email,
        First_Name: user.First_Name,
        Last_Name: user.Last_Name,
        City: user.City,
        State: user.State,
        Country: user.Country,
        Community_ID: user.Community_ID,
        role: user.role
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ Email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.Status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Account is not active' });
    }

    const passwordMatch = await comparePasswords(password, user.password || '');
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user.User_ID, user.Email, user.role || 'user');

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        User_ID: user.User_ID,
        Email: user.Email,
        First_Name: user.First_Name,
        Last_Name: user.Last_Name,
        City: user.City,
        State: user.State,
        Country: user.Country,
        Community_ID: user.Community_ID,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const googleLogin = async (req: AuthRequest, res: Response) => {
  try {
    const allowedAudiences = getAllowedGoogleAudiences();
    if (allowedAudiences.length === 0) {
      return res.status(500).json({ success: false, message: 'Google auth is not configured on server' });
    }

    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: allowedAudiences,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Invalid Google token' });
    }

    const { email, given_name, family_name, sub, picture } = payload;

    if (!email) {
      return res.status(401).json({ success: false, message: 'Email not found in Google token' });
    }

    let user = await User.findOne({ Email: email.toLowerCase() });

    if (!user) {
      return res.json({
        success: true,
        isNewUser: true,
        googleData: {
          email: email.toLowerCase(),
          firstName: given_name || 'Google',
          lastName: family_name || 'User',
          googleId: sub,
          profileImage: picture
        }
      });
    }

    // Existing user flow
    // Update googleId if not linked
    if (!user.googleId) {
      user.googleId = sub;
    }
    if (!user.profileImage && picture) {
      user.profileImage = picture;
    }
    await user.save();

    const token = generateToken(user.User_ID, user.Email, user.role || 'user');

    res.json({
      success: true,
      isNewUser: false,
      message: 'Google login successful',
      token,
      user: {
        User_ID: user.User_ID,
        Email: user.Email,
        First_Name: user.First_Name,
        Last_Name: user.Last_Name,
        City: user.City,
        State: user.State,
        Country: user.Country,
        profileImage: user.profileImage,
        Community_ID: user.Community_ID,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Google login failed';
    res.status(500).json({ success: false, message: errorMessage });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ User_ID: req.user?.userId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      User_ID: user.User_ID,
      Email: user.Email,
      First_Name: user.First_Name,
      Last_Name: user.Last_Name,
      City: user.City,
      State: user.State,
      Country: user.Country,
      Community_ID: user.Community_ID,
      WhatsApp_Number: user.WhatsApp_Number,
      role: user.role,
      Status: user.Status,
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
};

export const verifyToken = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  res.json({
    success: true,
    data: { user: req.user }
  });
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { communityId, city, state, country, phoneNumber } = req.body;

    const user = await User.findOne({ User_ID: req.user?.userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update basic fields
    if (communityId !== undefined) {
      if (communityId) {
        const community = await Community.findOne({ Community_ID: communityId });
        if (!community) {
          return res.status(400).json({ success: false, message: 'Community not found' });
        }
      }
      user.Community_ID = communityId;
    }

    if (city !== undefined) user.City = city ? capitalizeProperNoun(city) : 'Not Set';
    if (state !== undefined) user.State = state ? capitalizeProperNoun(state) : 'Not Set';
    if (country !== undefined) user.Country = country || 'Not Set';
    if (phoneNumber !== undefined) user.WhatsApp_Number = phoneNumber;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      User_ID: user.User_ID,
      Email: user.Email,
      First_Name: user.First_Name,
      Last_Name: user.Last_Name,
      City: user.City,
      State: user.State,
      Country: user.Country,
      Community_ID: user.Community_ID,
      WhatsApp_Number: user.WhatsApp_Number,
      role: user.role
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};
