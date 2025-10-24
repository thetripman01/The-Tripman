import { verifyBasicAuth } from '../auth'
import { db } from '../db'
import bcrypt from 'bcryptjs'

// Mock NextRequest
const mockNextRequest = (headers: Record<string, string>) => ({
  headers: {
    get: jest.fn((key: string) => headers[key] || null),
  },
}) as unknown as NextRequest

// Mock the database
jest.mock('../db', () => ({
  db: {
    adminUser: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}))

describe.skip('Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('verifyBasicAuth', () => {
    it('should return true for valid credentials', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'admin@test.com',
        password: 'hashed-password',
      }

      const request = mockNextRequest({
        authorization: 'Basic YWRtaW5AdGVzdC5jb206Y29ycmVjdC1wYXNzd29yZA==', // admin@test.com:correct-password
      })

      ;(db.adminUser.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const result = await verifyBasicAuth(request)

      expect(result).toBe(mockUser)
      expect(db.adminUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@test.com' },
      })
      expect(bcrypt.compare).toHaveBeenCalledWith('correct-password', 'hashed-password')
    })

    it('should return false for invalid email', async () => {
      const request = mockNextRequest({
        authorization: 'Basic bm9uZXhpc3RlbnRAdGVzdC5jb206cGFzc3dvcmQ=', // nonexistent@test.com:password
      })

      ;(db.adminUser.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await verifyBasicAuth(request)

      expect(result).toBe(null)
      expect(db.adminUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@test.com' },
      })
      expect(bcrypt.compare).not.toHaveBeenCalled()
    })

    it('should return false for invalid password', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'admin@test.com',
        password: 'hashed-password',
      }

      const request = mockNextRequest({
        authorization: 'Basic YWRtaW5AdGVzdC5jb206d3JvbmctcGFzc3dvcmQ=', // admin@test.com:wrong-password
      })

      ;(db.adminUser.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const result = await verifyBasicAuth(request)

      expect(result).toBe(null)
      expect(db.adminUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@test.com' },
      })
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password')
    })

    it('should handle database errors gracefully', async () => {
      const request = mockNextRequest({
        authorization: 'Basic YWRtaW5AdGVzdC5jb206cGFzc3dvcmQ=', // admin@test.com:password
      })

      ;(db.adminUser.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const result = await verifyBasicAuth(request)

      expect(result).toBe(null)
    })
  })
})
