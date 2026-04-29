import Joi from 'joi';

export const schemas = {
  // Registration validation
  register: Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().max(50).required(),
    lastName: Joi.string().max(50).optional(),
    password: Joi.string().min(6).allow('', null).optional(),
    googleId: Joi.string().allow('', null).optional(),
    profileImage: Joi.string().allow('', null).optional(),
    phoneNumber: Joi.string().allow('', null).optional(),
    city: Joi.string().allow('', null).optional(),
    state: Joi.string().allow('', null).optional(),
    country: Joi.string().allow('', null).optional(),
    communityId: Joi.string().allow('', null).optional(),
  }),

  // Profile update validation
  updateProfile: Joi.object({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    phoneNumber: Joi.string().allow('', null).optional(),
    city: Joi.string().allow('', null).optional(),
    state: Joi.string().allow('', null).optional(),
    country: Joi.string().allow('', null).optional(),
    communityId: Joi.string().allow('', null).optional(),
  }),

  // Login validation
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Google OAuth validation
  googleLogin: Joi.object({
    credential: Joi.string().required(),
  }),

  // Prediction submission validation
  prediction: Joi.object({
    Email: Joi.string().email().required(),
    matchId: Joi.string().required(),
    UDF_Score: Joi.number().min(0).max(140).required(),
    LDF_Score: Joi.number().min(0).max(140).required(),
    NDA_Score: Joi.number().min(0).max(140).required(),
  }),

  // Match finalization validation
  matchFinalize: Joi.object({
    matchId: Joi.string().required(),
    official_UDF: Joi.number().min(0).max(140).required(),
    official_LDF: Joi.number().min(0).max(140).required(),
    official_NDA: Joi.number().min(0).max(140).required(),
  }),


};

export const validateScoreSum = (scores: number[]): boolean => {
  const sum = scores.reduce((acc, score) => acc + (score || 0), 0);
  return sum === 140;
};

export const validateRequest = (schema: Joi.Schema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      console.error('Validation error:', error.details);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      });
    }

    req.validatedBody = value;
    next();
  };
};
