import { getWorkingHours, generateTimeSlots } from '../calendar'

describe('Calendar Utilities', () => {
  describe('getWorkingHours', () => {
    it('should return default working hours for weekdays', () => {
      const workingHours = getWorkingHours()
      
      expect(workingHours).toEqual({
        start: 9,
        end: 18,
        daysOfWeek: [1, 2, 3, 4, 5],
      })
    })
  })

  describe('generateTimeSlots', () => {
    it('should generate time slots for a weekday', () => {
      const date = new Date('2024-01-15') // Monday
      const durationMin = 60
      
      const slots = generateTimeSlots(date, durationMin)
      
      expect(slots.length).toBeGreaterThan(0)
      expect(slots[0]).toBeInstanceOf(Date)
    })

    it('should generate slots with buffer time', () => {
      const date = new Date('2024-01-15') // Monday
      const durationMin = 60
      const bufferMin = 30
      
      const slots = generateTimeSlots(date, durationMin, bufferMin)
      
      expect(slots.length).toBeGreaterThan(0)
      
      // Check that slots are properly spaced with buffer
      if (slots.length > 1) {
        const timeDiff = slots[1].getTime() - slots[0].getTime()
        const expectedDiff = (durationMin + bufferMin) * 60 * 1000
        expect(timeDiff).toBe(expectedDiff)
      }
    })

    it('should respect working hours', () => {
      const date = new Date('2024-01-15') // Monday
      const durationMin = 60
      
      const slots = generateTimeSlots(date, durationMin)
      
      // All slots should be within working hours (9 AM to 6 PM)
      slots.forEach(slot => {
        const hour = slot.getHours()
        expect(hour).toBeGreaterThanOrEqual(9)
        expect(hour).toBeLessThan(18)
      })
    })
  })
})
