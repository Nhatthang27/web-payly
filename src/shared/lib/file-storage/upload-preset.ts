import type { UploadOptions } from './storage.type'

export const UPLOAD_PRESETS = {
  settlementEvidence: {
    bucket: 'private-assets',
    upsert: false,
    cacheControl: '84600',
    maxSizeMB: 5,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  },
  expenseEvidence: {
    bucket: 'private-assets',
    upsert: false,
    cacheControl: '84600',
    maxSizeMB: 5,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  },
} satisfies Record<string, UploadOptions>

export type UploadPresetKey = keyof typeof UPLOAD_PRESETS
