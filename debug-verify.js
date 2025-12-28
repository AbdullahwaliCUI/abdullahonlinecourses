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

async function debugVerify() {
    const requestId = '841d47fe-045a-4c7e-994a-971fb41475d6';
    const finalEmail = 'test.student@example.com'; // Use a test email
    const password = 'password123';

    console.log('Fetching request:', requestId);
    const { data: request, error: requestError } = await supabase
        .from('enrollment_requests')
        .select('*')
        .eq('id', requestId)
        .single();

    if (requestError) {
        console.error('Request Error:', requestError);
        return;
    }
    console.log('Request found:', request.full_name);

    console.log('Attempting to create user via Auth Admin...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: finalEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
            full_name: request.full_name,
            phone: request.phone,
            role: 'student'
        }
    });

    if (authError) {
        console.error('Auth Creation Error:', authError);
    } else {
        console.log('User created successfully:', authData.user.id);
        // Clean up - delete the test user
        console.log('Cleaning up test user...');
        await supabase.auth.admin.deleteUser(authData.user.id);
    }
}

debugVerify();
