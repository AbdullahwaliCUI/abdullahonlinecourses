-- Add topics to the existing course
INSERT INTO topics (course_id, title, order_index)
SELECT 
    id,
    'Introduction to Web Development',
    1
FROM courses 
WHERE title = 'Complete Web Development';

INSERT INTO topics (course_id, title, order_index)
SELECT 
    id,
    'HTML Fundamentals',
    2
FROM courses 
WHERE title = 'Complete Web Development';

INSERT INTO topics (course_id, title, order_index)
SELECT 
    id,
    'CSS Styling',
    3
FROM courses 
WHERE title = 'Complete Web Development';

-- Add videos to topics
INSERT INTO videos (topic_id, title, youtube_url, helper_material_url)
SELECT 
    t.id,
    'What is Web Development?',
    'https://www.youtube.com/watch?v=UB1O30fR-EE',
    'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web'
FROM topics t
JOIN courses c ON t.course_id = c.id
WHERE c.title = 'Complete Web Development' AND t.order_index = 1;

INSERT INTO videos (topic_id, title, youtube_url, helper_material_url)
SELECT 
    t.id,
    'HTML Basics Tutorial',
    'https://www.youtube.com/watch?v=UB1O30fR-EE',
    'https://developer.mozilla.org/en-US/docs/Web/HTML'
FROM topics t
JOIN courses c ON t.course_id = c.id
WHERE c.title = 'Complete Web Development' AND t.order_index = 2;

-- Verify complete structure
SELECT 
    c.title as course_title,
    t.title as topic_title,
    t.order_index,
    v.title as video_title
FROM courses c
LEFT JOIN topics t ON c.id = t.course_id
LEFT JOIN videos v ON t.id = v.topic_id
ORDER BY c.title, t.order_index;