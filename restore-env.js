const fs = require('fs');
const path = require('path');

const content = [
    'NEXT_PUBLIC_SUPABASE_URL=https://hcytnbnyxpjtxdqvrxyz.supabase.co',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjeXRuYm55eHBqdHhkcXZyeHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NTY4ODcsImV4cCI6MjA4MjMzMjg4N30.ofbHufsZSU2P-J4i0NCwrzlZp4_gz9R4RG3MRJnJZlM',
    'SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjeXRuYm55eHBqdHhkcXZyeHl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc1Njg4NywiZXhwIjoyMDgyMzMyODg3fQ.tvlbj23XDuBbj0wOCzmYvEZ-w5N5eK9mx0rBbnukJa8'
].join('\n');

fs.writeFileSync('.env.local', content, 'utf8');
console.log('.env.local updated successfully');
