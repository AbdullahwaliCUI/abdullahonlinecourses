const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function checkUser() {
    const email = 'abdullahwale@gmail.com';
    console.log(`Checking user: ${email}...`);

    // 1. Get User from Auth
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === email);

    if (!user) {
        console.log('User not found in Auth!');
        return;
    }

    console.log('Auth User ID:', user.id);
    console.log('Auth Metadata:', user.user_metadata);

    // 2. Get Profile
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.log('Error fetching profile:', error.message);
    } else {
        console.log('Profile Data:', profile);
    }
}

checkUser();
