-- Create a test enrollment request
DELETE FROM enrollment_requests WHERE email = 'test_request@example.com';

INSERT INTO enrollment_requests (
  id,
  full_name,
  phone,
  email,
  course_id,
  transaction_id,
  status,
  created_at
) VALUES (
  gen_random_uuid(),
  'Test Student',
  '+923331234567',
  'test_request@example.com',
  (SELECT id FROM courses LIMIT 1),
  'TEST_TRX_123',
  'pending',
  NOW()
);
