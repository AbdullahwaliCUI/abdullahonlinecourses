-- Check enrollment requests
SELECT 
  er.id,
  er.full_name,
  er.email,
  er.phone,
  er.transaction_id,
  er.status,
  er.created_at,
  c.title as course_title
FROM enrollment_requests er
JOIN courses c ON er.course_id = c.id
ORDER BY er.created_at DESC
LIMIT 10;