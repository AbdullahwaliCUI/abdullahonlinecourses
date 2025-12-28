-- Create a test enrollment request
INSERT INTO enrollment_requests (
  course_id,
  full_name,
  phone,
  email,
  transaction_id,
  receipt_url,
  status
) VALUES (
  (SELECT id FROM courses LIMIT 1),
  'Test Student',
  '+923001234567',
  'test.student@example.com',
  'JC123456789',
  'https://example.com/receipt.jpg',
  'pending'
);

-- Check if it was created
SELECT 
  er.id,
  er.full_name,
  er.email,
  er.phone,
  er.transaction_id,
  er.status,
  c.title as course_title
FROM enrollment_requests er
JOIN courses c ON er.course_id = c.id
WHERE er.status = 'pending'
ORDER BY er.created_at DESC;