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

    let rc = requestedCommunity ? { ...requestedCommunity } : undefined;
    if (rc?.name && rc?.shortName) {
      const existingCommunity = await findExistingCommunityForRequest(rc.name, rc.shortName);
      if (existingCommunity) rc = { ...rc, existingCommunityId: existingCommunity.communityId };
    }

    let normalizedCommunityId1: number | null = null;
    if (communityId1) {
      const c1IdNum = Number(communityId1);
      if (!Number.isInteger(c1IdNum) || c1IdNum <= 0) {
        return res.status(400).json({ error: 'Community 1 not found' });
      }
      const c1 = await prisma.community.findUnique({ where: { id: c1IdNum } });
      if (!c1) return res.status(400).json({ error: 'Community 1 not found' });
      normalizedCommunityId1 = c1.id;
    }
    if (communityId2) {
      if (communityId1 && communityId1 === communityId2) {
        return res.status(400).json({ error: 'Community 1 and Community 2 must be different' });
      }
      const c2IdNum = Number(communityId2);
      if (!Number.isInteger(c2IdNum) || c2IdNum <= 0) {
        return res.status(400).json({ error: 'Community 2 not found' });
      }
      const c2 = await prisma.community.findUnique({ where: { id: c2IdNum } });
      if (!c2) return res.status(400).json({ error: 'Community 2 not found' });
    }

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
        communityRequests:
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
                  status: 'pending',
                  statusComment: rc.statusComment,
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
        phoneNumber,
        communityId1: normalizedCommunityId1 ? String(normalizedCommunityId1) : undefined,
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
        phoneNumber: user.phoneNumber,
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
    });

    logger.info('getUserProfile', 'Completed user profile DB fetch', {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
      durationMs: Date.now() - profileFetchStart,
      userFound: !!user,
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const profileData = {
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
      role: user.role,
      status: user.status,
      isActive: user.isActive,
    };

    res.json(profileData);
  } catch (error) {
    const errorDetails = logger.error('getUserProfile', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ 
      error: 'Failed to get profile',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined 
    });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const body = (req as any).validatedBody ?? req.body;
    const { communityId1, communityId2, requestedCommunity, phoneNumber, city, state, country } = body;

    const reqUserIdNum = Number(req.user?.userId);
    if (!Number.isInteger(reqUserIdNum) || reqUserIdNum <= 0) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: reqUserIdNum },
      include: { communityRequests: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const data: Prisma.UserUncheckedUpdateInput = {};
    if (phoneNumber !== undefined) data.phoneNumber = phoneNumber || null;
    if (city !== undefined) data.city = city ? capitalizeProperNoun(city) : '';
    if (state !== undefined) data.state = state ? capitalizeProperNoun(state) : '';
    if (country !== undefined) data.country = country ? capitalizeProperNoun(country) : '';

    let normalizedC1: number | null =
      communityId1 !== undefined ? (Number(communityId1) > 0 ? Number(communityId1) : null) : user.communityId1;
    let normalizedC2: number | null =
      communityId2 !== undefined ? (Number(communityId2) > 0 ? Number(communityId2) : null) : user.communityId2;

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
      if (user.communityRequests && user.communityRequests.some((r: any) => r.status === 'pending')) {
        return res.status(400).json({ error: 'You already have a pending community request.' });
      }

      let rc = { ...requestedCommunity };
      if (!rc.name || !rc.shortName) {
        return res.status(400).json({ error: 'Both Full Name and Short Name are required for a community request' });
      }
      if (!rc.isOnline && (!rc.city || !rc.state)) {
        return res.status(400).json({ error: 'City and State are required for local communities' });
      }

      if (rc.name && rc.shortName) {
        const existingCommunity = await findExistingCommunityForRequest(rc.name, rc.shortName);
        if (existingCommunity) rc = { ...rc, existingCommunityId: existingCommunity.communityId };
      }
      data.communityRequests = {
        create: {
          name: rc.name,
          shortName: rc.shortName ?? '',
          description: rc.description ?? '',
          isOnline: !!rc.isOnline,
          city: rc.city ?? '',
          state: rc.state ?? '',
          existingCommunityId: rc.existingCommunityId,
          status: 'pending',
          statusComment: rc.statusComment,
        }
      };
    } else if (requestedCommunity === null) {
      data.communityRequests = user.communityRequests && user.communityRequests.length > 0 ? {
        updateMany: {
          where: { status: 'pending' },
          data: { status: 'User Deleted' }
        }
      } : undefined;
    }

    const nextC1 = normalizedC1;
    const nextC2 = normalizedC2;
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
export const addUserCommunityRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { name, shortName, description, isOnline, city, state } = req.body;
    const reqUserIdNum = Number(req.user?.userId);

    if (!Number.isInteger(reqUserIdNum) || reqUserIdNum <= 0) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: reqUserIdNum }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });


    if (!Number.isInteger(reqUserIdNum) || reqUserIdNum <= 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    
    if (!name || !shortName) {
      return res.status(400).json({ error: 'Both Full Name and Short Name are required' });
    }
    if (!isOnline && (!city || !state)) {
      return res.status(400).json({ error: 'City and State are required for local communities' });
    }

    let existingCommunityId: string | undefined = undefined;
    const existingCommunity = await findExistingCommunityForRequest(name, shortName);
    if (existingCommunity) {
      existingCommunityId = existingCommunity.communityId;
    }

    const newRequest = await prisma.userCommunityRequest.create({
      data: {
        userId: reqUserIdNum,
        name: name,
        shortName: shortName,
        description: description || '',
        isOnline: !!isOnline,
        city: city || '',
        state: state || '',
        existingCommunityId,
        status: 'pending'
      }
    }); 

    res.status(201).json({ message: 'User community request added successfully', request: newRequest });
  } catch (error) {
    const errorDetails = logger.error('addUserCommunityRequest', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to add user community request' });
  }
};

export const submitCommunityRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { name, shortName, description, isOnline, city, state } = req.body;
    const reqUserIdNum = Number(req.user?.userId);

    if (!Number.isInteger(reqUserIdNum) || reqUserIdNum <= 0) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: reqUserIdNum },
      include: { communityRequests: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

   

    if (!name || !shortName) {
      return res.status(400).json({ error: 'Both Full Name and Short Name are required' });
    }
    if (!isOnline && (!city || !state)) {
      return res.status(400).json({ error: 'City and State are required for local communities' });
    }

    let existingCommunityId: string | undefined = undefined;
    const existingCommunity = await findExistingCommunityForRequest(name, shortName);
    if (existingCommunity) {
      existingCommunityId = existingCommunity.communityId;
    }

    const newRequest = await prisma.userCommunityRequest.create({
      data: {
        userId: reqUserIdNum,
        name: name,
        shortName: shortName,
        description: description || '',
        isOnline: !!isOnline,
        city: city || '',
        state: state || '',
        existingCommunityId,
        status: 'pending'
      }
    });

    res.status(201).json({ message: 'Community request submitted successfully', request: newRequest });
  } catch (error) {
    const errorDetails = logger.error('submitCommunityRequest', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to submit community request' });
  }
};

export const getUserCommunityRequests = async (req: AuthRequest, res: Response) => {
  try {
    const reqUserIdNum = Number(req.user?.userId);

    if (!Number.isInteger(reqUserIdNum) || reqUserIdNum <= 0) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: reqUserIdNum },
      include: { communityRequests: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      requests: user.communityRequests.map((req: any) => ({
        id: req.id,
        name: req.name || '',
        shortName: req.shortName || '',
        description: req.description || '',
        isOnline: !!req.isOnline,
        city: req.city || '',
        state: req.state || '',
        existingCommunityId: req.existingCommunityId || undefined,
        status: req.status || 'pending',
        statusComment: req.statusComment || undefined,
      }))
    });
  } catch (error) {
    const errorDetails = logger.error('getUserCommunityRequests', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch user community requests' });
  }
};

export const deleteUserCommunityRequest = async (req: AuthRequest, res: Response) => {
  try {
    const reqUserIdNum = Number(req.user?.userId);
    const requestId = Number(req.params.id);

    if (!Number.isInteger(reqUserIdNum) || reqUserIdNum <= 0) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    const request = await prisma.userCommunityRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.userId !== reqUserIdNum) return res.status(403).json({ error: 'Unauthorized to delete this request' });

    if (request.status !== 'pending' && request.status !== 'Admin Rejected') {
      return res.status(400).json({ error: 'Only pending or rejected requests can be deleted/dismissed' });
    }

    await prisma.userCommunityRequest.update({
      where: { id: requestId },
      data: { status: 'User Deleted' }
    });

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    const errorDetails = logger.error('deleteUserCommunityRequest', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to delete community request' });
  }
};

export const updateUserCommunityRequest = async (req: AuthRequest, res: Response) => {
  try {
    const reqUserIdNum = Number(req.user?.userId);
    const requestId = Number(req.params.id);

    if (!Number.isInteger(reqUserIdNum) || reqUserIdNum <= 0) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    const request = await prisma.userCommunityRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.userId !== reqUserIdNum) return res.status(403).json({ error: 'Unauthorized to update this request' });
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can be edited' });
    }

    const { name, shortName, description, isOnline, city, state } = req.body;
    if (!name || !shortName) {
      return res.status(400).json({ error: 'Both Full Name and Short Name are required' });
    }
    if (!isOnline && (!city || !state)) {
      return res.status(400).json({ error: 'City and State are required for local communities' });
    }

    let existingCommunityId: string | undefined = undefined;
    const existingCommunity = await findExistingCommunityForRequest(name, shortName);
    if (existingCommunity) {
      existingCommunityId = existingCommunity.communityId;
    }

    const updatedRequest = await prisma.userCommunityRequest.update({
      where: { id: requestId },
      data: {
        name: name,
        shortName: shortName,
        description: description || '',
        isOnline: !!isOnline,
        city: city || '',
        state: state || '',
        existingCommunityId,
      }
    });

    res.json({ message: 'Request updated successfully', request: updatedRequest });
  } catch (error) {
    const errorDetails = logger.error('updateUserCommunityRequest', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to update community request' });
  }
};

export const submitContactMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;
    const userId = req.user?.userId ? Number(req.user.userId) : null;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required' });
    }

    const contact = await prisma.contactMessage.create({
      data: { userId, name, email, subject, message }
    });

    res.status(201).json({ message: 'Message sent successfully', contact });
  } catch (error) {
    const errorDetails = logger.error('submitContactMessage', error, {
      method: req.method,
      path: req.path,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to submit message' });
  }
};
