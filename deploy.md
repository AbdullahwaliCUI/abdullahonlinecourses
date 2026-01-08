# LMS Platform Deployment Guide

## Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Have your Supabase credentials ready

## Environment Variables
Set these in Vercel dashboard or via CLI:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://dgmbvpczmhqdtigcauru.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbWJ2cGN6bWhxZHRpZ2NhdXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NDI0MjMsImV4cCI6MjA4MjMxODQyM30.uGhNooJ_oWEFzGxnrULIzXmQohfo3bvmXHHUu93-yc4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbWJ2cGN6bWhxZHRpZ2NhdXJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQyMywiZXhwIjoyMDgyMzE4NDIzfQ.DVMp5C0fKUNYALbving0zvYLwmmS3REQDqoWR3lpR34

# Payment Configuration
NEXT_PUBLIC_JAZZCASH_NUMBER=+923046983794
```

## Quick Deploy Commands

### Option 1: Automatic Deployment
```bash
# Login to Vercel
vercel login

# Deploy with environment variables
vercel --prod
```

### Option 2: Manual Environment Setup
```bash
# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY  
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_JAZZCASH_NUMBER

# Deploy
vercel --prod
```

## Post-Deployment Steps

1. **Verify Supabase Connection**
   - Test login functionality
   - Check admin panel access

2. **Database Setup** (if not done)
   - Run the SQL schema in Supabase
   - Create admin user
   - Add test courses

3. **Test Key Features**
   - Course enrollment requests
   - Admin student creation
   - Student portal access

## Troubleshooting

### Common Issues:
1. **Build Errors**: Check TypeScript errors with `npm run build`
2. **Environment Variables**: Ensure all variables are set in Vercel dashboard
3. **Supabase Connection**: Verify project URL and API keys

### Build Command Issues:
If build fails, try:
```bash
npm run build
```
Fix any TypeScript/ESLint errors before deploying.

## Domain Configuration
After deployment, you can:
1. Use the provided `.vercel.app` domain
2. Add a custom domain in Vercel dashboard
3. Configure DNS settings for your domain

## Security Notes
- Service role key is only used server-side
- All API routes are protected by middleware
- RLS policies are enforced in Supabase