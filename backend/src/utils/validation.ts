import Joi from 'joi';

export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().min(2).required(),
    lastName: Joi.string().min(2).required(),
    password: Joi.string().min(6).required(),
    whatsappNumber: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    country: Joi.string(),
    communityId1: Joi.string(),
    communityId2: Joi.string(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  googleLogin: Joi.object({
    credential: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    city: Joi.string().allow(''),
    state: Joi.string().allow(''),
    country: Joi.string().allow(''),
    whatsappNumber: Joi.string().allow(''),
    communityId1: Joi.string().allow(''),
    communityId2: Joi.string().allow(''),
    firstName: Joi.string().allow(''),
    lastName: Joi.string().allow(''),
  }),

  prediction: Joi.object({
    matchId: Joi.string().required(),
    team1Score: Joi.number().min(0).required(),
    team2Score: Joi.number().min(0).required(),
    comment: Joi.string(),
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
