import Joi from 'joi';

export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().min(2).required(),
    lastName: Joi.string().min(2).required(),
    password: Joi.string().min(6).required(),
    phoneNumber: Joi.string().trim().required(),
    city: Joi.string().allow('', null),
    state: Joi.string().allow('', null),
    country: Joi.string().allow('', null),
    communityId1: Joi.string().required(),
    communityId2: Joi.string().allow('', null),
    requestedCommunity: Joi.object({
      name: Joi.string().required(),
      shortName: Joi.string().required(),
      description: Joi.string().allow('', null),
      isOnline: Joi.boolean().default(false),
      city: Joi.string().allow('', null),
      state: Joi.string().allow('', null),
    }).allow(null),
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(2).optional(),
    lastName: Joi.string().min(2).optional(),
    phoneNumber: Joi.string().trim().optional(),
    city: Joi.string().allow('', null).optional(),
    state: Joi.string().allow('', null).optional(),
    country: Joi.string().allow('', null).optional(),
    communityId1: Joi.string().allow('', null).optional(),
    communityId2: Joi.string().allow('', null).optional(),
    requestedCommunity: Joi.object({
      name: Joi.string().required(),
      shortName: Joi.string().required(),
      description: Joi.string().allow('', null),
      isOnline: Joi.boolean().default(false),
      city: Joi.string().allow('', null),
      state: Joi.string().allow('', null),
    }).allow(null).optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  googleLogin: Joi.object({
    credential: Joi.string().required(),
  }),


  prediction: Joi.object({
    matchId: Joi.string().required(),
    team1Score: Joi.number().min(0).required(),
    team2Score: Joi.number().min(0).required(),
    comment: Joi.string().allow('', null).optional(),
  }),

  match: Joi.object({
    matchId: Joi.string().required(),
    sequence: Joi.number().required(),
    team1: Joi.string().required(),
    team2: Joi.string().required(),
    matchTime: Joi.date().required(),
    predictionsEndingTime: Joi.date().required(),
    round: Joi.number().required(),
    matchTag: Joi.string().required(),
  }),
};

export const validateRequest = (schema: Joi.Schema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      console.error('Validation error:', error.details);
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      });
    }

    req.validatedBody = value;
    next();
  };
};
