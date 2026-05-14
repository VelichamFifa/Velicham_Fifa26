import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { generateToken, hashPassword, comparePasswords } from '../utils/auth';
import { capitalizeProperNoun } from '../utils/stringUtils';
import { findExistingCommunityForRequest } from '../utils/communityLookup';

const client = new OAuth2Client();

const googleAudiences = Array.from(
  new Set(
    [
      process.env.GOOGLE_CLIENT_ID,
      ...(process.env.GOOGLE_CLIENT_IDS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ].filter(Boolean) as string[]
  )
);

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
      communityId1,
      communityId2,
      phoneNumber,
      requestedCommunity,
    } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    if (!phoneNumber || !String(phoneNumber).trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    let rc = requestedCommunity ? { ...requestedCommunity } : undefined;
    if (rc?.name && rc?.shortName) {
      const existingCommunity = await findExistingCommunityForRequest(rc.name, rc.shortName);
      if (existingCommunity) rc = { ...rc, existingCommunityId: existingCommunity.communityId };
    }

    if (!communityId1) {
      return res.status(400).json({ error: 'Community 1 is required' });
    }

    const c1 = await prisma.community.findUnique({ where: { communityId: communityId1 } });
    if (!c1) return res.status(400).json({ error: 'Community 1 not found' });
    if (communityId2) {
      if (communityId1 === communityId2) {
        return res.status(400).json({ error: 'Community 1 and Community 2 must be different' });
      }
      const c2 = await prisma.community.findUnique({ where: { communityId: communityId2 } });
      if (!c2) return res.status(400).json({ error: 'Community 2 not found' });
    }

    const hashedPassword = await hashPassword(password);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await prisma.user.create({
      data: {
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
        status: 'active',
        isActive: true,
        role: 'user',
        communityRequest:
          rc && rc.name
            ? {
                create: {
                  name: rc.name,
                  shortName: rc.shortName ?? '',
                  description: rc.description ?? '',
                  isOnline: !!rc.isOnline,
                  city: rc.city ?? '',
                  state: rc.state ?? '',
                  existingCommunityId: rc.existingCommunityId,
                },
              }
            : undefined,
      },
    });

    const token = generateToken(userId, email, 'user');
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
        role: 'user',
      },
    });
  } catch (error) {
    const errorDetails = logger.error('register', error, {
      method: req.method,
      path: req.path,
      email: req.body?.email,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await comparePasswords(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

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
    const errorDetails = logger.error('login', error, {
      method: req.method,
      path: req.path,
      email: req.body?.email,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Login failed' });
  }
};

export const googleLogin = async (req: AuthRequest, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing Google credential' });
    if (googleAudiences.length === 0) {
      return res.status(500).json({ error: 'Google auth is not configured on server' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleAudiences,
    });

    const payload = ticket.getPayload();
    if (!payload) return res.status(401).json({ error: 'Invalid Google token' });

    const { email, given_name, family_name, sub, picture } = payload;
    if (!email) return res.status(401).json({ error: 'Invalid Google token' });

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const hashedPassword = await hashPassword(Math.random().toString(36).slice(-10));
      user = await prisma.user.create({
        data: {
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
        },
      });
    } else {
      user = await prisma.user.update({
        where: { userId: user.userId },
        data: {
          googleId: user.googleId ?? sub,
          profileImage: user.profileImage ?? picture ?? undefined,
        },
      });
    }

    const token = generateToken(user.userId, user.email, user.role);
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
        role: user.role,
      },
    });
  } catch (error) {
    const errorDetails = logger.error('googleLogin', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({
      error: 'Google login failed',
      ...(process.env.NODE_ENV === 'development' ? { details: errorDetails.message } : {}),
    });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profileFetchStart = Date.now();
    logger.info('getUserProfile', 'Starting user profile DB fetch', {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });

    const user = await prisma.user.findUnique({
      where: { userId: req.user?.userId },
      include: { communityRequest: true },
    });

    logger.info('getUserProfile', 'Completed user profile DB fetch', {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
      durationMs: Date.now() - profileFetchStart,
      userFound: !!user,
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

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
      requestedCommunity: user.communityRequest
        ? {
            name: user.communityRequest.name,
            shortName: user.communityRequest.shortName,
            description: user.communityRequest.description,
            isOnline: user.communityRequest.isOnline,
            city: user.communityRequest.city,
            state: user.communityRequest.state,
            existingCommunityId: user.communityRequest.existingCommunityId ?? undefined,
          }
        : undefined,
      role: user.role,
      status: user.status,
      isActive: user.isActive,
    });
  } catch (error) {
    const errorDetails = logger.error('getUserProfile', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to get profile' });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const body = (req as any).validatedBody ?? req.body;
    const { communityId1, communityId2, requestedCommunity, phoneNumber, city, state, country } = body;

    if (phoneNumber !== undefined && !String(phoneNumber).trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const user = await prisma.user.findUnique({
      where: { userId: req.user?.userId },
      include: { communityRequest: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const data: Prisma.UserUpdateInput = {};
    if (phoneNumber !== undefined) data.phoneNumber = phoneNumber || null;
    if (city !== undefined) data.city = city ? capitalizeProperNoun(city) : '';
    if (state !== undefined) data.state = state ? capitalizeProperNoun(state) : '';
    if (country !== undefined) data.country = country ? capitalizeProperNoun(country) : '';
    if (communityId1 !== undefined) data.communityId1 = communityId1 || null;
    if (communityId2 !== undefined) data.communityId2 = communityId2 || null;

    if (requestedCommunity) {
      let rc = { ...requestedCommunity };
      if (rc.name && rc.shortName) {
        const existingCommunity = await findExistingCommunityForRequest(rc.name, rc.shortName);
        if (existingCommunity) rc = { ...rc, existingCommunityId: existingCommunity.communityId };
      }
      data.communityRequest = {
        upsert: {
          create: {
            name: rc.name,
            shortName: rc.shortName ?? '',
            description: rc.description ?? '',
            isOnline: !!rc.isOnline,
            city: rc.city ?? '',
            state: rc.state ?? '',
            existingCommunityId: rc.existingCommunityId,
          },
          update: {
            name: rc.name,
            shortName: rc.shortName ?? '',
            description: rc.description ?? '',
            isOnline: !!rc.isOnline,
            city: rc.city ?? '',
            state: rc.state ?? '',
            existingCommunityId: rc.existingCommunityId,
          },
        },
      };
    } else if (requestedCommunity === null) {
      data.communityRequest = user.communityRequest ? { delete: true } : undefined;
    }

    const nextC1 = communityId1 !== undefined ? communityId1 || null : user.communityId1;
    const nextC2 = communityId2 !== undefined ? communityId2 || null : user.communityId2;
    if (!nextC1) {
      return res.status(400).json({ error: 'Community 1 is required' });
    }
    if (nextC1 && nextC2 && nextC1 === nextC2) {
      return res.status(400).json({ error: 'Community 1 and Community 2 must be different' });
    }

    await prisma.user.update({ where: { userId: user.userId }, data });
    const updated = await prisma.user.findUnique({ where: { userId: user.userId } });

    res.json({
      message: 'Profile updated successfully',
      user: {
        userId: updated!.userId,
        email: updated!.email,
        firstName: updated!.firstName,
        lastName: updated!.lastName,
        phoneNumber: updated!.phoneNumber,
        city: updated!.city,
        state: updated!.state,
        country: updated!.country,
        communityId1: updated!.communityId1,
        communityId2: updated!.communityId2,
        role: updated!.role,
      },
    });
  } catch (error) {
    const errorDetails = logger.error('updateUserProfile', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to update profile' });
  }
};

