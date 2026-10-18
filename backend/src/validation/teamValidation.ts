import { body, query } from 'express-validator';

export const validateCreateTeam = [
  body('name').notEmpty().withMessage('Team name is required').isString().trim(),
  body('hackathon').notEmpty().withMessage('Hackathon ID is required').isMongoId(),
  body('maxMembers').notEmpty().withMessage('maxMembers is required').isInt({ min: 1, max: 20 }),
  body('description').optional().isString(),
  body('projectIdea').optional().isString(),
  body('visibility').optional().isIn(['Public', 'Private']),
  body('status').optional().isIn(['Open', 'Full', 'Closed']),
];

export const validateUpdateTeam = [
  body('name').optional().isString().trim(),
  body('description').optional().isString(),
  body('maxMembers').optional().isInt({ min: 1, max: 20 }),
  body('visibility').optional().isIn(['Public', 'Private']),
  body('status').optional().isIn(['Open', 'Full', 'Closed']),
];

export const validateSearchTeam = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['createdAt', 'active', 'openPositions']),
];
