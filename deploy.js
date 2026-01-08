#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Starting deployment to Vercel...');

try {
  // Set environment variables for Vercel
  const envVars = [
    'NEXT_PUBLIC_SUPABASE_URL=https://dgmbvpczmhqdtigcauru.supabase.co',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbWJ2cGN6bWhxZHRpZ2NhdXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NDI0MjMsImV4cCI6MjA4MjMxODQyM30.uGhNooJ_oWEFzGxnrULIzXmQohfo3bvmXHHUu93-yc4',
    'SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbWJ2cGN6bWhxZHRpZ2NhdXJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQyMywiZXhwIjoyMDgyMzE4NDIzfQ.DVMp5C0fKUNYALbving0zvYLwmmS3REQDqoWR3lpR34',
    'NEXT_PUBLIC_JAZZCASH_NUMBER=+923046983794'
  ];

  console.log('📦 Building project...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('🌐 Deploying to Vercel...');
  
  // Deploy with environment variables
  const deployCmd = `vercel --prod --yes --env ${envVars.join(' --env ')}`;
  const result = execSync(deployCmd, { stdio: 'inherit', encoding: 'utf8' });
  
  console.log('✅ Deployment successful!');
  console.log('🔗 Your app is now live at the URL shown above');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}