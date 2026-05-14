import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { generateToken } from '../utils/auth';
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

    const c1IdNum = Number(communityId1);
    if (!Number.isInteger(c1IdNum) || c1IdNum <= 0) {
      return res.status(400).json({ error: 'Community 1 not found' });
    }
    const c1 = await prisma.community.findUnique({ where: { id: c1IdNum } });
    if (!c1) return res.status(400).json({ error: 'Community 1 not found' });
    if (communityId2) {
      if (communityId1 === communityId2) {
        return res.status(400).json({ error: 'Community 1 and Community 2 must be different' });
      }
      const c2IdNum = Number(communityId2);
      if (!Number.isInteger(c2IdNum) || c2IdNum <= 0) {
        return res.status(400).json({ error: 'Community 2 not found' });
      }
      const c2 = await prisma.community.findUnique({ where: { id: c2IdNum } });
      if (!c2) return res.status(400).json({ error: 'Community 2 not found' });
    }

    const normalizedCommunityId1 = c1.id;
    const normalizedCommunityId2 = communityId2 ? Number(communityId2) : null;

    const createdUser = await prisma.user.create({
      data: {
        email,
        firstName: capitalizeProperNoun(firstName),
        lastName: capitalizeProperNoun(lastName),
        city: capitalizeProperNoun(city),
        state: capitalizeProperNoun(state),
        country: capitalizeProperNoun(country),
        communityId1: normalizedCommunityId1,
        communityId2: normalizedCommunityId2,
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

    const userId = String(createdUser.id);

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
        communityId1: String(normalizedCommunityId1),
        communityId2: normalizedCommunityId2 ? String(normalizedCommunityId2) : undefined,
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
    res.status(400).json({ error: 'Password login is disabled. Please use Google login.' });
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
      user = await prisma.user.create({
        data: {
          email,
          firstName: given_name || 'Google',
          lastName: family_name || 'User',
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
        where: { id: user.id },
        data: {
          googleId: user.googleId ?? sub,
          profileImage: user.profileImage ?? picture ?? undefined,
        },
      });
    }

    const token = generateToken(String(user.id), user.email, user.role);
    res.json({
      message: 'Google login successful',
      token,
      user: {
        userId: String(user.id),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        city: user.city,
        state: user.state,
        country: user.country,
        profileImage: user.profileImage,
        communityId1: user.communityId1 ? String(user.communityId1) : undefined,
        communityId2: user.communityId2 ? String(user.communityId2) : undefined,
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

    const reqUserIdNum = Number(req.user?.userId);
    if (!Number.isInteger(reqUserIdNum) || reqUserIdNum <= 0) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: reqUserIdNum },
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
      userId: String(user.id),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      city: user.city,
      state: user.state,
      country: user.country,
      communityId1: user.communityId1 ? String(user.communityId1) : undefined,
      communityId2: user.communityId2 ? String(user.communityId2) : undefined,
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

    const reqUserIdNum = Number(req.user?.userId);
    if (!Number.isInteger(reqUserIdNum) || reqUserIdNum <= 0) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: reqUserIdNum },
      include: { communityRequest: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const data: Prisma.UserUncheckedUpdateInput = {};
    if (phoneNumber !== undefined) data.phoneNumber = phoneNumber || null;
    if (city !== undefined) data.city = city ? capitalizeProperNoun(city) : '';
    if (state !== undefined) data.state = state ? capitalizeProperNoun(state) : '';
    if (country !== undefined) data.country = country ? capitalizeProperNoun(country) : '';

    let normalizedC1: number | null =
      communityId1 !== undefined ? (communityId1 ? Number(communityId1) : null) : user.communityId1;
    let normalizedC2: number | null =
      communityId2 !== undefined ? (communityId2 ? Number(communityId2) : null) : user.communityId2;

    if (normalizedC1) {
      if (!Number.isInteger(normalizedC1) || normalizedC1 <= 0) {
        return res.status(400).json({ error: 'Community 1 not found' });
      }
      const c1 = await prisma.community.findUnique({ where: { id: normalizedC1 } });
      if (!c1) return res.status(400).json({ error: 'Community 1 not found' });
      normalizedC1 = c1.id;
    }
    if (normalizedC2) {
      if (!Number.isInteger(normalizedC2) || normalizedC2 <= 0) {
        return res.status(400).json({ error: 'Community 2 not found' });
      }
      const c2 = await prisma.community.findUnique({ where: { id: normalizedC2 } });
      if (!c2) return res.status(400).json({ error: 'Community 2 not found' });
      normalizedC2 = c2.id;
    }

    if (communityId1 !== undefined) data.communityId1 = normalizedC1;
    if (communityId2 !== undefined) data.communityId2 = normalizedC2;

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

    const nextC1 = normalizedC1;
    const nextC2 = normalizedC2;
    if (!nextC1) {
      return res.status(400).json({ error: 'Community 1 is required' });
    }
    if (nextC1 && nextC2 && nextC1 === nextC2) {
      return res.status(400).json({ error: 'Community 1 and Community 2 must be different' });
    }

    await prisma.user.update({ where: { id: user.id }, data });
    const updated = await prisma.user.findUnique({ where: { id: user.id } });

    res.json({
      message: 'Profile updated successfully',
      user: {
        userId: String(updated!.id),
        email: updated!.email,
        firstName: updated!.firstName,
        lastName: updated!.lastName,
        phoneNumber: updated!.phoneNumber,
        city: updated!.city,
        state: updated!.state,
        country: updated!.country,
        communityId1: updated!.communityId1 ? String(updated!.communityId1) : undefined,
        communityId2: updated!.communityId2 ? String(updated!.communityId2) : undefined,
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

