const { computeIsOverdue, normalizeDueDate, todayDateString } = require('../src/app');

describe('Task date helpers', () => {
  describe('todayDateString', () => {
    it('formats date values as YYYY-MM-DD', () => {
      const date = new Date('2026-05-16T13:45:00Z');
      expect(todayDateString(date)).toBe('2026-05-16');
    });
  });

  describe('normalizeDueDate', () => {
    it('accepts valid due date values', () => {
      expect(normalizeDueDate('2026-05-18')).toBe('2026-05-18');
    });

    it('rejects invalid due date formats', () => {
      expect(normalizeDueDate('05-18-2026')).toBeNull();
      expect(normalizeDueDate('2026/05/18')).toBeNull();
      expect(normalizeDueDate('not-a-date')).toBeNull();
    });
  });

  describe('computeIsOverdue', () => {
    it('returns true for incomplete tasks with past due dates', () => {
      const task = { dueDate: '2026-05-10', completed: false };
      const now = new Date('2026-05-16T08:00:00Z');
      expect(computeIsOverdue(task, now)).toBe(true);
    });

    it('returns false for completed tasks even if due date is in the past', () => {
      const task = { dueDate: '2026-05-10', completed: true };
      const now = new Date('2026-05-16T08:00:00Z');
      expect(computeIsOverdue(task, now)).toBe(false);
    });

    it('returns false when due date is today or in the future', () => {
      const now = new Date('2026-05-16T08:00:00Z');
      expect(computeIsOverdue({ dueDate: '2026-05-16', completed: false }, now)).toBe(false);
      expect(computeIsOverdue({ dueDate: '2026-05-20', completed: false }, now)).toBe(false);
    });
  });
});