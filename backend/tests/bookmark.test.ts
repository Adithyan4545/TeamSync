import { addHackathonBookmark, removeHackathonBookmark } from '../src/services/bookmarkService';
import { Types } from 'mongoose';

jest.mock('../src/models/Bookmark', () => {
  const mockBookmark = {
    _id: '507f1f77bcf86cd799439011',
    user: '507f1f77bcf86cd799439022',
    hackathon: '507f1f77bcf86cd799439033',
    save: jest.fn().mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      user: '507f1f77bcf86cd799439022',
      hackathon: '507f1f77bcf86cd799439033',
    }),
  };

  return {
    Bookmark: jest.fn().mockImplementation(() => mockBookmark),
  };
});

// Avoid actually calling external models
jest.mock('../src/models/Hackathon', () => ({
  Hackathon: {
    exists: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('../src/models/ExternalHackathon', () => ({
  ExternalHackathon: {
    exists: jest.fn().mockResolvedValue(false)
  }
}));

describe('Bookmark Service', () => {
  it('creates a new hackathon bookmark', async () => {
    // Override Bookmark.findOne to simulate no existing bookmark
    const mockFindOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    require('../src/models/Bookmark').Bookmark.findOne = mockFindOne;
    
    const userId = new Types.ObjectId('507f1f77bcf86cd799439022');
    const hackathonId = new Types.ObjectId('507f1f77bcf86cd799439033');
    
    const result = await addHackathonBookmark(userId, hackathonId);
    expect(result).toHaveProperty('_id');
  });
});
