const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function test() {
    try {
        const envPath = path.join(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('.env.local file NOT FOUND');
            return;
        }

        const envContent = fs.readFileSync(envPath, 'utf8');

        const env = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                let value = match[2].trim();
                // Remove surrounding quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                env[match[1].trim()] = value;
            }
        });

        const url = env.NEXT_PUBLIC_SUPABASE_URL;
        const key = env.SUPABASE_SERVICE_ROLE_KEY;

        console.log('--------------------------------');
        console.log('URL Found:', !!url);
        console.log('Key Found:', !!key);
        console.log('Key Length:', key ? key.length : 0);
        console.log('--------------------------------');

        if (!url || !key) {
            console.error('Missing URL or Key in .env.local');
            return;
        }

        const supabase = createClient(url, key, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        console.log('Attempting to read "courses" table with SERVICE_ROLE key...');
        const { data, error } = await supabase.from('courses').select('id').limit(1);

        if (error) {
            console.error('FAILED. API Error:', error);
        } else {
            console.log('SUCCESS! Service Role Key is working.');
            console.log('Data sample:', data);
        }
    } catch (err) {
        console.error('Script Runtime Error:', err);
    }
}

test();
