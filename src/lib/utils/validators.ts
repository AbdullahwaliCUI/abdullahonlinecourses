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
 * Check if URL is HTTPS
 */
export function isHttpsUrl(url: string): boolean {
  return isValidUrl(url) // isValidUrl already checks for HTTPS
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
    .refine(isValidReceiptUrl, 'Receipt URL must be a valid HTTPS link from GitHub, Google Drive, or other supported CDN')
    .optional()
    .or(z.literal('')),
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal(''))
})

export type EnrollmentRequestData = z.infer<typeof enrollmentRequestSchema>

// Zod schema for admin verify modal
export const adminVerifySchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(50, 'Password must be less than 50 characters'),
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal(''))
})

export type AdminVerifyData = z.infer<typeof adminVerifySchema>

// Zod schema for admin reject modal
export const adminRejectSchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
  reason: z.string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must be less than 500 characters')
    .trim()
})

export type AdminRejectData = z.infer<typeof adminRejectSchema>

// Zod schema for course creation/editing
export const courseSchema = z.object({
  title: z.string()
    .min(3, 'Course title must be at least 3 characters')
    .max(200, 'Course title must be less than 200 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Course description must be less than 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  image_url: z.string()
    .url('Invalid image URL format')
    .refine(isHttpsUrl, 'Image URL must be HTTPS')
    .optional()
    .or(z.literal(''))
})

export type CourseData = z.infer<typeof courseSchema>

// Zod schema for topic creation/editing
export const topicSchema = z.object({
  title: z.string()
    .min(3, 'Topic title must be at least 3 characters')
    .max(200, 'Topic title must be less than 200 characters')
    .trim(),
  course_id: z.string().uuid('Invalid course ID'),
  order_index: z.number()
    .int('Order index must be an integer')
    .min(1, 'Order index must be at least 1')
})

export type TopicData = z.infer<typeof topicSchema>

// Zod schema for video creation/editing
export const videoSchema = z.object({
  title: z.string()
    .min(3, 'Video title must be at least 3 characters')
    .max(200, 'Video title must be less than 200 characters')
    .trim(),
  youtube_url: z.string()
    .url('Invalid YouTube URL format')
    .refine(isYouTubeUrl, 'Must be a valid YouTube URL')
    .optional()
    .or(z.literal('')),
  admin_video_url: z.string()
    .url('Invalid Video URL format')
    .refine(isHttpsUrl, 'Video URL must be HTTPS')
    .optional()
    .or(z.literal('')),
  helper_material_url: z.string()
    .url('Invalid helper material URL format')
    .refine(isHttpsUrl, 'Helper material URL must be HTTPS')
    .refine(isGitHubRawUrl, 'Helper material URL must be from GitHub raw')
    .optional()
    .or(z.literal('')),
  document_url: z.string()
    .url('Invalid document URL format')
    .refine(isHttpsUrl, 'Document URL must be HTTPS')
    .optional()
    .or(z.literal('')),
  topic_id: z.string().uuid('Invalid topic ID')
}).refine(data => data.youtube_url || data.admin_video_url, {
  message: "Either YouTube URL or Admin Video URL must be provided",
  path: ["youtube_url"]
})

export type VideoData = z.infer<typeof videoSchema>