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
    const password = 'admin123';
    const fullName = 'Abdullah Wali';

    console.log(`Processing admin user: ${email}...`);

    // 1. Check if user exists
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const existingUser = users.users.find(u => u.email === email);
    let userId;

    if (existingUser) {
        console.log(`User already exists (ID: ${existingUser.id}). Updating password and role...`);
        userId = existingUser.id;

        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: 'admin'
            }
        });

        if (updateError) {
            console.error('Error updating user:', updateError.message);
            return;
        }
        console.log('User auth updated successfully.');
    } else {
        console.log('User does not exist. Creating new user...');
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
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
            return;
        }
        userId = createData.user.id;
        console.log(`User created successfully (ID: ${userId}).`);
    }

    // 2. Ensure profile exists
    if (userId) {
        await upsertProfile(userId, email, fullName);
    }
}

async function upsertProfile(userId, email, fullName) {
    console.log('Updating profile for:', userId);
    const payload = {
        full_name: fullName,
        role: 'admin',
        updated_at: new Date().toISOString()
    };
    console.log('Update payload:', payload);

    const { error: profileError } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId);

    if (profileError) {
        console.error('Error updating profile:', profileError);
    } else {
        console.log('Profile updated with Admin role.');
    }
}

createAdmin();
