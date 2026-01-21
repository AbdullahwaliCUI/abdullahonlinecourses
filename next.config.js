/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'img.youtube.com',
      'raw.githubusercontent.com',
      'encrypted-tbn0.gstatic.com',
      'drive.google.com',
      'lh3.googleusercontent.com',
      'docs.googleusercontent.com',
      'googleusercontent.com'
    ],
  },
}

module.exports = nextConfig