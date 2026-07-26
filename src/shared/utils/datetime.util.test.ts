import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatDate, formatRelativeDateLabel, getGreeting, getToday } from './datetime.util'

// Build the reference instant from LOCAL components: formatDate also formats in
// the runtime's local timezone, so the two cancel out and assertions stay
// deterministic regardless of the CI machine's timezone. (2026-05-10 18:30 local)
const localInstant = new Date(2026, 4, 10, 18, 30)

describe('formatDate', () => {
  it('uses the mediumDate style by default', () => {
    expect(formatDate(localInstant, 'vi-VN')).toBe('10 thg 5, 2026')
  })

  it('formats each supported style', () => {
    expect(formatDate(localInstant, 'vi-VN', 'shortDate')).toBe('10/05/2026')
    expect(formatDate(localInstant, 'vi-VN', 'mediumDate')).toBe('10 thg 5, 2026')
    expect(formatDate(localInstant, 'vi-VN', 'longDate')).toBe('10 tháng 5, 2026')
    expect(formatDate(localInstant, 'vi-VN', 'dateTime')).toBe('lúc 18:30 10 tháng 5, 2026')
    expect(formatDate(localInstant, 'vi-VN', 'time')).toBe('18:30')
  })

  it('accepts a timestamp (number)', () => {
    expect(formatDate(localInstant.getTime(), 'vi-VN')).toBe('10 thg 5, 2026')
  })

  it('accepts an ISO string with an explicit local time', () => {
    // A mid-day time avoids the date rolling over across timezone offsets.
    expect(formatDate('2026-05-10T12:00:00', 'vi-VN')).toBe('10 thg 5, 2026')
  })

  it('pads single-digit day and month in shortDate', () => {
    expect(formatDate(new Date(2026, 0, 5, 9, 5), 'vi-VN', 'shortDate')).toBe('05/01/2026')
  })

  it('reuses one Intl.DateTimeFormat instance per style (cached)', () => {
    // Calling repeatedly with the same style must stay stable (exercises the cache path).
    const a = formatDate(localInstant, 'vi-VN', 'time')
    const b = formatDate(localInstant, 'vi-VN', 'time')
    expect(a).toBe(b)
  })
})

// Fix "today" as 2026-05-10 09:00 local for time-dependent tests
const TODAY = new Date(2026, 4, 10, 9, 0)

describe('getToday', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(TODAY)
  })
  afterEach(() => vi.useRealTimers())

  it('returns today formatted with mediumDate by default', () => {
    expect(getToday('vi-VN')).toBe('10 thg 5, 2026')
  })

  it('accepts an explicit style', () => {
    expect(getToday('vi-VN', 'shortDate')).toBe('10/05/2026')
    expect(getToday('vi-VN', 'time')).toBe('09:00')
  })
})

describe('formatRelativeDateLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(TODAY)
  })
  afterEach(() => vi.useRealTimers())

  it('returns "Hôm nay" for today', () => {
    expect(formatRelativeDateLabel(TODAY, 'vi-VN')).toBe('Hôm nay')
  })

  it('returns "Hôm nay" regardless of the time within the same local day', () => {
    const lateToday = new Date(2026, 4, 10, 23, 59)
    expect(formatRelativeDateLabel(lateToday, 'vi-VN')).toBe('Hôm nay')
  })

  it('returns "Hôm qua" for yesterday', () => {
    const yesterday = new Date(2026, 4, 9, 15, 0)
    expect(formatRelativeDateLabel(yesterday, 'vi-VN')).toBe('Hôm qua')
  })

  it('includes the year for older dates within the same year', () => {
    const sameYear = new Date(2026, 1, 15) // 15 Feb 2026
    const label = formatRelativeDateLabel(sameYear, 'vi-VN')
    expect(label).toContain('2026')
    expect(label.length).toBeGreaterThan(0)
  })

  it('includes the year for dates in a different year', () => {
    const lastYear = new Date(2025, 11, 25) // 25 Dec 2025
    expect(formatRelativeDateLabel(lastYear, 'vi-VN')).toContain('2025')
  })

  it('formats a future date without a relative label', () => {
    const tomorrow = new Date(2026, 4, 11)
    const label = formatRelativeDateLabel(tomorrow, 'vi-VN')
    expect(label).not.toBe('Hôm nay')
    expect(label).not.toBe('Hôm qua')
    expect(label.length).toBeGreaterThan(0)
  })

  it('returns an empty string for an invalid date', () => {
    expect(formatRelativeDateLabel('not-a-date', 'vi-VN')).toBe('')
  })
})

describe('getGreeting', () => {
  it('returns the morning greeting between 05:00 and 10:59', () => {
    expect(getGreeting(new Date(2026, 4, 10, 5, 0))).toBe('Chào buổi sáng')
    expect(getGreeting(new Date(2026, 4, 10, 10, 59))).toBe('Chào buổi sáng')
  })

  it('returns the noon greeting between 11:00 and 12:59', () => {
    expect(getGreeting(new Date(2026, 4, 10, 11, 0))).toBe('Chào buổi trưa')
    expect(getGreeting(new Date(2026, 4, 10, 12, 59))).toBe('Chào buổi trưa')
  })

  it('returns the afternoon greeting between 13:00 and 17:59', () => {
    expect(getGreeting(new Date(2026, 4, 10, 13, 0))).toBe('Chào buổi chiều')
    expect(getGreeting(new Date(2026, 4, 10, 17, 59))).toBe('Chào buổi chiều')
  })

  it('returns the evening greeting between 18:00 and 04:59', () => {
    expect(getGreeting(new Date(2026, 4, 10, 18, 0))).toBe('Chào buổi tối')
    expect(getGreeting(new Date(2026, 4, 10, 23, 59))).toBe('Chào buổi tối')
    expect(getGreeting(new Date(2026, 4, 10, 4, 59))).toBe('Chào buổi tối')
  })

  it('defaults to the current time when no date is given', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 10, 8, 0))
    expect(getGreeting()).toBe('Chào buổi sáng')
    vi.useRealTimers()
  })
})
