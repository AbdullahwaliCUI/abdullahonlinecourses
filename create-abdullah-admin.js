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

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function createAdmin() {
    const email = 'abdullahwale@gmail.com';
    const password = 'admin123'; // Setting a default password
    const fullName = 'Abdullah Wali';

    console.log(`Creating admin user: ${email}...`);

    // 1. Create User
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            role: 'admin'
        }
    });

    if (createError) {
        console.error('Error creating user:', createError.message);
        // If user already exists, try to update password and role
        if (createError.message.includes('already has been registered')) {
            console.log('User exists, updating password and role...');
            // Find user ID
            const { data: users } = await supabase.auth.admin.listUsers();
            const user = users.users.find(u => u.email === email);

            if (user) {
                await supabase.auth.admin.updateUserById(user.id, { password: password, user_metadata: { role: 'admin' } });
                // Ensure profile
                await upsertProfile(user.id, email, fullName);
                console.log('User updated successfully.');
                return;
            }
        }
        return;
    }

    if (userData.user) {
        console.log('Auth user created. ID:', userData.user.id);
        await upsertProfile(userData.user.id, email, fullName);
    }
}

async function upsertProfile(userId, email, fullName) {
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            email: email,
            full_name: fullName,
            role: 'admin',
            created_at: new Date().toISOString()
        });

    if (profileError) {
        console.error('Error creating/updating profile:', profileError);
    } else {
        console.log('Profile created/updated with Admin role.');
    }
}

createAdmin();
