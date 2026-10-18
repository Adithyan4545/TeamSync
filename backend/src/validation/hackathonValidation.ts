import { body, query } from 'express-validator';

export const validateCreateHackathon = [
  body('title').notEmpty().withMessage('Title is required').isString().trim(),
  body('description').optional().isString(),
  body('organizer').optional().isString(),
  body('theme').optional().isString(),
  body('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'All Levels']),
  body('mode').optional().isIn(['Online', 'Offline', 'Hybrid']),
  body('minTeamSize').optional().isInt({ min: 1 }),
  body('maxTeamSize').optional().isInt({ min: 1 }),
  body('prize').optional().isNumeric(),
  body('registrationDeadline').optional().isISO8601(),
  body('eventDate').optional().isISO8601(),
  body('contactEmail').optional().isEmail(),
];

export const validateUpdateHackathon = [
  body('title').optional().isString().trim(),
  body('description').optional().isString(),
  body('organizer').optional().isString(),
  body('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'All Levels']),
  body('mode').optional().isIn(['Online', 'Offline', 'Hybrid']),
  body('contactEmail').optional().isEmail(),
];

export const validateSearchHackathon = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['createdAt', 'deadline', 'prize', 'popularity']),
];
