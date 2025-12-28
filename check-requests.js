const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim().replace(/(^"|"$)/g, '');
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRequests() {
    const { data, error } = await supabase
        .from('enrollment_requests')
        .select('*')
        .eq('status', 'pending');

    if (error) {
        console.error('Error fetching requests:', error);
        return;
    }

    console.log('Pending Requests:', data.length);
    data.forEach(req => {
        console.log('--- Request ---');
        console.log('ID:', req.id);
        console.log('Name:', req.full_name);
        console.log('Receipt URL:', req.receipt_url);
    });
}

checkRequests();
