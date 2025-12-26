/**
 * Extract video ID from various YouTube URL formats
 */
export function getVideoIdFromUrl(url: string): string | null {
  if (!url) return null;

  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Get YouTube thumbnail URL from video ID
 */
export function getThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'maxres'): string {
  if (!videoId) return '';
  
  // Use maxresdefault for best quality, fallback to hqdefault if needed
  const qualityMap = {
    'default': 'default',
    'medium': 'mqdefault', 
    'high': 'hqdefault',
    'standard': 'sddefault',
    'maxres': 'maxresdefault'
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}