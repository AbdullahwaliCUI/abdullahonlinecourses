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

async function fullVerify() {
    const requestId = '841d47fe-045a-4c7e-994a-971fb41475d6';
    const finalEmail = 'wali.muhammad@student.lms.com';
    const password = 'password123';
    const adminId = '12345678-1234-1234-1234-123456789012'; // Placeholder admin ID if needed, but we can verify who processes it. Actually, update uses adminId.

    console.log(`=== STARTING VERIFICATION FOR ${requestId} ===`);

    try {
        // 1. Get request
        console.log('1. Fetching request...');
        const { data: request, error: requestError } = await supabase
            .from('enrollment_requests')
            .select('*')
            .eq('id', requestId)
            .eq('status', 'pending')
            .single();

        if (requestError || !request) {
            console.error('Request fetch failed:', requestError);
            return;
        }
        console.log('Request found:', request.full_name);

        // 2. Create Auth User
        console.log('2. Creating Auth User...');
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
            console.error('Auth User Creation Failed:', authError);
            return;
        }
        console.log('User created:', authData.user.id);

        // 3. Create Enrollment
        console.log('3. Creating Enrollment...');
        const { error: enrollmentError } = await supabase
            .from('enrollments')
            .insert({
                user_id: authData.user.id,
                course_id: request.course_id,
                status: 'active'
            });

        if (enrollmentError) {
            console.error('Enrollment Creation Failed:', enrollmentError);
            // Cleanup user? No, complicated.
            return;
        }
        console.log('Enrollment created.');

        // 4. Initialize Progress
        console.log('4. Initializing Progress...');
        const { data: firstTopic, error: topicError } = await supabase
            .from('topics')
            .select('id, order_index')
            .eq('course_id', request.course_id)
            .order('order_index', { ascending: true })
            .limit(1)
            .single();

        if (topicError) {
            console.error('Topic fetch failed:', topicError);
            // Not fatal
        } else if (firstTopic) {
            const { error: progressError } = await supabase
                .from('progress')
                .upsert({
                    user_id: authData.user.id,
                    course_id: request.course_id,
                    topic_id: firstTopic.id,
                    is_unlocked: true,
                    is_completed: false,
                    updated_at: new Date().toISOString()
                });
            if (progressError) console.error('Progress Init Failed:', progressError);
            else console.log('Progress initialized.');
        } else {
            console.log('No topics found for course.');
        }

        // 5. Update Request Status
        console.log('5. Updating Request Status...');
        const { error: updateError } = await supabase
            .from('enrollment_requests')
            .update({
                status: 'verified',
                processed_at: new Date().toISOString(),
                created_user_id: authData.user.id,
                notes: 'Verified via script'
            })
            .eq('id', requestId);

        if (updateError) {
            console.error('Request Update Failed:', updateError);
            return;
        }
        console.log('Request updated to verified.');

        console.log('=== VERIFICATION SUCCESSFUL ===');
        console.log(`Email: ${finalEmail}`);
        console.log(`Password: ${password}`);

    } catch (err) {
        console.error('Script Error:', err);
    }
}

fullVerify();
