-- Add videos to topics
-- Video for Topic 1: Introduction to Programming
INSERT INTO videos (topic_id, title, youtube_url, helper_material_url)
SELECT 
    t.id,
    'What is Programming?',
    'https://www.youtube.com/watch?v=zOjov-2OZ0E',
    'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web'
FROM topics t
JOIN courses c ON t.course_id = c.id
WHERE c.title = 'Test Course' AND t.order_index = 1;

-- Video for Topic 2: Variables and Data Types
INSERT INTO videos (topic_id, title, youtube_url, helper_material_url)
SELECT 
    t.id,
    'Understanding Variables',
    'https://www.youtube.com/watch?v=XgSfTdTkDw8',
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types'
FROM topics t
JOIN courses c ON t.course_id = c.id
WHERE c.title = 'Test Course' AND t.order_index = 2;

-- Video for Topic 3: Functions and Methods
INSERT INTO videos (topic_id, title, youtube_url, helper_material_url)
SELECT 
    t.id,
    'Introduction to Functions',
    'https://www.youtube.com/watch?v=N8ap4k_1QEQ',
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions'
FROM topics t
JOIN courses c ON t.course_id = c.id
WHERE c.title = 'Test Course' AND t.order_index = 3;

-- Verify complete structure
SELECT 
    c.title as course_title,
    t.title as topic_title,
    t.order_index,
    v.title as video_title,
    v.youtube_url
FROM courses c
JOIN topics t ON c.id = t.course_id
JOIN videos v ON t.id = v.topic_id
ORDER BY c.title, t.order_index;