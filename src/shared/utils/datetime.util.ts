import type { SupportedLocale } from '@/shared/types/app-setting.type'
import { createCachedInstance } from './cached-instance-factory.util'

type DateTimeFormatOptions = Intl.DateTimeFormatOptions & { locale: SupportedLocale }
const getDateTimeFormat = createCachedInstance(
  (options: DateTimeFormatOptions) => new Intl.DateTimeFormat(options.locale, options),
)
type DateInput = string | number | Date

export type DateFormatStyle = 'shortDate' | 'mediumDate' | 'longDate' | 'dateTime' | 'time'

const DATE_FORMAT_OPTIONS: Record<DateFormatStyle, Intl.DateTimeFormatOptions> = {
  shortDate: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  },

  mediumDate: {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  },

  longDate: {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  },

  dateTime: {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },

  time: {
    hour: '2-digit',
    minute: '2-digit',
  },
}

export function formatDate(value: DateInput, locale: SupportedLocale, style: DateFormatStyle = 'mediumDate'): string {
  const date = new Date(value)
  if (isInvalidDate(date)) return ''

  return `${getDateTimeFormat({ locale, ...DATE_FORMAT_OPTIONS[style] }).format(date)}`
}

export function getToday(locale: SupportedLocale, style: DateFormatStyle = 'mediumDate'): string {
  return `${getDateTimeFormat({ locale, ...DATE_FORMAT_OPTIONS[style] }).format(new Date())}`
}

export function formatRelativeDateLabel(value: DateInput, locale: SupportedLocale): string {
  const date = new Date(value)

  if (isInvalidDate(date)) return ''

  const today = new Date()
  const diffDays = getLocalDayDiff(date, today)

  if (diffDays === 0) return 'Hôm nay'
  if (diffDays === 1) return 'Hôm qua'

  const label = getDateTimeFormat({
    locale,
    ...DATE_FORMAT_OPTIONS.shortDate,
  }).format(date)

  return label
}

export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours()

  if (hour < 5) return 'Chào buổi tối'
  if (hour < 11) return 'Chào buổi sáng'
  if (hour < 13) return 'Chào buổi trưa'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

function getLocalDayDiff(from: Date, to: Date): number {
  const fromStart = startOfLocalDay(from)
  const toStart = startOfLocalDay(to)

  return Math.round((toStart.getTime() - fromStart.getTime()) / MS_PER_DAY)
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isInvalidDate(date: Date): boolean {
  return Number.isNaN(date.getTime())
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
