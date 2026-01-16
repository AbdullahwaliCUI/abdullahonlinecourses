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

async function createRequest() {
    const courseId = 'd89b3f3e-8b1a-4b0e-9b0a-9b8b7b6b5b4b'; // Need a valid course ID. Using one found in logs or fetching one.

    // Better: fetch a course first
    const { data: courses } = await supabase.from('courses').select('id').limit(1);
    const validCourseId = courses[0].id;

    console.log('Creating request for course:', validCourseId);

    const { error } = await supabase.from('enrollment_requests').insert({
        full_name: 'Test Verify Student',
        phone: '+923000000000',
        email: 'verify.bug@test.com',
        course_id: validCourseId,
        transaction_id: 'BUG_VERIFY_123',
        status: 'pending'
    });

    if (error) console.error('Error:', error);
    else console.log('Test request created.');
}

createRequest();
