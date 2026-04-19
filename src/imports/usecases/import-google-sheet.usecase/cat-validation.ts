import * as Joi from 'joi';
import {
  CAT_ID_PATTERN,
  NOT_ALLOWED_BREEDS,
  NOT_ALLOWED_COLORS,
} from '../../constants/cat-validaion.constants';

export interface CatRowParsed {
  catId: string;
  name: string;
  breed: string;
  ageYears: string;
  weightKg: string;
  color: string;
  vaccinated: string;
  notes: string;
}

export interface CatRow {
  catId: string;
  name: string;
  breed: string;
  ageYears: number;
  weightKg: number;
  color: string;
  vaccinated: 'YES' | 'NO';
  notes: string;
}

export const catRowSchema = Joi.object({
  catId: Joi.string().trim().pattern(CAT_ID_PATTERN).required(),
  name: Joi.string().trim().min(1).required(),
  breed: Joi.string()
    .trim()
    .min(1)
    .invalid(...NOT_ALLOWED_BREEDS)
    .required(),
  ageYears: Joi.string()
    .required()
    .custom((raw, helpers) => {
      const trimmed = String(raw).trim();
      if (trimmed === '') {
        return helpers.error('any.invalid');
      }
      const n = Number(trimmed);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0 || n > 17) {
        return helpers.error('any.invalid');
      }
      return n;
    }),
  weightKg: Joi.string()
    .required()
    .custom((raw, helpers) => {
      const trimmed = String(raw).trim();
      if (trimmed === '') {
        return helpers.error('any.invalid');
      }
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 2.0 || n > 10.0) {
        return helpers.error('any.invalid');
      }
      return n;
    }),
  color: Joi.string()
    .trim()
    .min(1)
    .invalid(...NOT_ALLOWED_COLORS)
    .required(),
  vaccinated: Joi.string()
    .required()
    .custom((raw, helpers) => {
      const u = String(raw).trim().toUpperCase();
      if (u !== 'YES' && u !== 'NO') {
        return helpers.error('any.invalid');
      }
      return u as 'YES' | 'NO';
    }),
  notes: Joi.string().trim().allow('').default(''),
}).unknown(false);

export function validateCatRow(
  rec: CatRowParsed,
  claimedCatIds: Set<string>,
): { valid: false } | { valid: true; row: CatRow } {
  const { error, value } = catRowSchema.validate(rec, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return { valid: false };
  }

  const row = value as CatRow;

  if (claimedCatIds.has(row.catId)) {
    return { valid: false };
  }

  claimedCatIds.add(row.catId);
  return { valid: true, row };
}
