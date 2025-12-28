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
    const email = 'wali.muhammad@student.lms.com';
    console.log('Checking for user:', email);

    // List users (filtering by email isn't direct in listUsers usually, need to fetch list)
    // admin.listUsers returns a list.
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const found = users.find(u => u.email === email);
    if (found) {
        console.log('User ALREADY EXISTS:', found.id);
    } else {
        console.log('User does NOT exist.');
    }
}

checkUser();
