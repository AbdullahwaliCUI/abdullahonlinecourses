import { z } from 'zod'

/**
 * Check if a URL is valid HTTPS URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Check if URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  if (!isValidUrl(url)) return false
  
  const youtubePatterns = [
    /^https:\/\/(www\.)?youtube\.com\//,
    /^https:\/\/youtu\.be\//,
    /^https:\/\/m\.youtube\.com\//
  ]
  
  return youtubePatterns.some(pattern => pattern.test(url))
}

/**
 * Check if URL is a GitHub raw URL
 */
export function isGitHubRawUrl(url: string): boolean {
  if (!isValidUrl(url)) return false
  
  const githubRawPatterns = [
    /^https:\/\/raw\.githubusercontent\.com\//,
    /^https:\/\/github\.com\/.*\/raw\//
  ]
  
  return githubRawPatterns.some(pattern => pattern.test(url))
}

/**
 * Check if URL is a Google Drive public link
 */
export function isGoogleDriveUrl(url: string): boolean {
  if (!isValidUrl(url)) return false
  
  const drivePatterns = [
    /^https:\/\/drive\.google\.com\/file\/d\/.*\/view/,
    /^https:\/\/drive\.google\.com\/open\?id=/,
    /^https:\/\/docs\.google\.com\/.*\/d\/.*\//
  ]
  
  return drivePatterns.some(pattern => pattern.test(url))
}

/**
 * Check if URL is acceptable for receipt uploads
 */
export function isValidReceiptUrl(url: string): boolean {
  if (!isValidUrl(url)) return false
  
  // Allow GitHub raw, Google Drive, and other common CDN patterns
  const allowedPatterns = [
    /^https:\/\/raw\.githubusercontent\.com\//,
    /^https:\/\/github\.com\/.*\/raw\//,
    /^https:\/\/drive\.google\.com\//,
    /^https:\/\/docs\.google\.com\//,
    /^https:\/\/.*\.amazonaws\.com\//,
    /^https:\/\/.*\.cloudfront\.net\//,
    /^https:\/\/.*\.googleapis\.com\//,
    /^https:\/\/imgur\.com\//,
    /^https:\/\/i\.imgur\.com\//,
    /^https:\/\/.*\.dropbox\.com\//,
    /^https:\/\/.*\.dropboxusercontent\.com\//
  ]
  
  return allowedPatterns.some(pattern => pattern.test(url))
}

// Zod schema for enrollment request validation
export const enrollmentRequestSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
  full_name: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .trim(),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be less than 15 digits')
    .regex(/^[\+]?[0-9\-\s\(\)]+$/, 'Invalid phone number format')
    .trim(),
  email: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  transaction_id: z.string()
    .min(5, 'Transaction ID must be at least 5 characters')
    .max(50, 'Transaction ID must be less than 50 characters')
    .trim(),
  receipt_url: z.string()
    .url('Invalid URL format')
    .refine(isValidReceiptUrl, 'Receipt URL must be a valid HTTPS link from GitHub, Google Drive, or other supported CDN'),
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal(''))
})

export type EnrollmentRequestData = z.infer<typeof enrollmentRequestSchema>