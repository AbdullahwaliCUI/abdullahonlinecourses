-- Add topics to the test course
INSERT INTO topics (course_id, title, order_index)
SELECT 
    c.id,
    'Introduction to Programming',
    1
FROM courses c
WHERE c.title = 'Test Course';

INSERT INTO topics (course_id, title, order_index)
SELECT 
    c.id,
    'Variables and Data Types',
    2
FROM courses c
WHERE c.title = 'Test Course';

INSERT INTO topics (course_id, title, order_index)
SELECT 
    c.id,
    'Functions and Methods',
    3
FROM courses c
WHERE c.title = 'Test Course';

-- Verify topics
SELECT 
    c.title as course_title,
    t.title as topic_title,
    t.order_index
FROM courses c
JOIN topics t ON c.id = t.course_id
ORDER BY c.title, t.order_index;