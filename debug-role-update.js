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

async function debugRole() {
    const email = 'abdullahwale@gmail.com';
    console.log(`Debugging role for: ${email}`);

    // 1. Get User ID (Hardcoded from previous successful checks)
    const userId = '4ebf0ab4-bec2-4933-86f4-b29d47698e0d';
    console.log(`Using User ID: ${userId}`);

    // Skip listUsers check as we have the ID

    // 2. Initial State
    let { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
    console.log('Initial Profile Role:', profile?.role);

    // 3. Update Role
    console.log('Attempting UPDATE to admin...');
    const { error: updateError, data: updatedData } = await supabase
        .from('profiles')
        .update({ role: 'admin', updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select();

    if (updateError) {
        console.error('Update Error:', updateError);
    } else {
        console.log('Update Success. Returned Data:', updatedData);
    }

    // 4. Check Immediately
    const { data: profileImmediate } = await supabase.from('profiles').select('role').eq('id', userId).single();
    console.log('Immediate Profile Role Check:', profileImmediate?.role);

    // 5. Wait 2 seconds and check again (to catch triggers)
    console.log('Waiting 2 seconds...');
    await new Promise(r => setTimeout(r, 2000));

    const { data: profileDelayed } = await supabase.from('profiles').select('role').eq('id', userId).single();
    console.log('Delayed Profile Role Check:', profileDelayed?.role);
}

debugRole();
