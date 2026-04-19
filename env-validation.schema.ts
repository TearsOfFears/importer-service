import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().port().default(3000),

  GOOGLE_SPREADSHEET_ID: Joi.string().required().min(10).messages({
    'any.required': 'GOOGLE_SPREADSHEET_ID is required',
  }),

  GOOGLE_CATS_SHEET_NAME: Joi.string().default('CatsData'),

  BASE_URL: Joi.string().required(),
});
