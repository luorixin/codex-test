-- ========== sys_user ==========
INSERT INTO sys_user (id, username, email, password, nickname, status)
VALUES (1, 'admin', 'admin@example.com', '$2a$10$dyQXiE5/8ReGrdMDJp3d/O4h9F/BmEy5WK.3W/FdcwTIjVoMYKS4C', '管理员', 1);

-- ========== subject ==========
INSERT INTO subject (id, name, sort_order) VALUES (1, '数学', 1);
INSERT INTO subject (id, name, sort_order) VALUES (2, '英语', 2);

-- ========== topic ==========
INSERT INTO topic (id, subject_id, parent_id, name, sort_order)
VALUES (1, 1, NULL, '代数基础', 1);
INSERT INTO topic (id, subject_id, parent_id, name, sort_order)
VALUES (2, 1, 1, '一元一次方程', 1);
INSERT INTO topic (id, subject_id, parent_id, name, sort_order)
VALUES (3, 1, NULL, '平面几何', 2);
INSERT INTO topic (id, subject_id, parent_id, name, sort_order)
VALUES (4, 1, 3, '三角形', 1);
INSERT INTO topic (id, subject_id, parent_id, name, sort_order)
VALUES (5, 2, NULL, '语法基础', 1);
INSERT INTO topic (id, subject_id, parent_id, name, sort_order)
VALUES (6, 2, 5, '一般现在时', 1);

-- ========== question ==========
INSERT INTO question (id, subject_id, topic_id, type, stem, explanation, difficulty, source)
VALUES (1, 1, 2, 'single_choice', '方程 2x + 3 = 11 的解是多少？',
        '先移项得到 2x = 8，再两边同时除以 2，得到 x = 4。', 1, 'phase1-demo');
INSERT INTO question (id, subject_id, topic_id, type, stem, explanation, difficulty, source)
VALUES (2, 1, 2, 'true_false', '方程 x - 7 = 0 的解是 x = 7。',
        '将 7 移到等号右侧得到 x = 7，因此命题正确。', 1, 'phase1-demo');
INSERT INTO question (id, subject_id, topic_id, type, stem, explanation, difficulty, source)
VALUES (3, 1, 4, 'single_choice', '三角形三个内角和等于多少度？',
        '任意三角形的内角和恒等于 180 度。', 1, 'phase1-demo');
INSERT INTO question (id, subject_id, topic_id, type, stem, explanation, difficulty, source)
VALUES (4, 1, 4, 'multiple_choice', '下面哪些说法正确？',
        '等边三角形一定是锐角三角形；直角三角形一定有一个角是 90 度。', 2, 'phase1-demo');
INSERT INTO question (id, subject_id, topic_id, type, stem, explanation, difficulty, source)
VALUES (5, 2, 6, 'single_choice', 'She ____ to school every day.',
        '主语是第三人称单数，动词用 goes。', 1, 'phase1-demo');
INSERT INTO question (id, subject_id, topic_id, type, stem, explanation, difficulty, source)
VALUES (6, 2, 6, 'true_false', '一般现在时可以表示经常发生的动作。',
        '一般现在时常用于习惯、经常发生的动作或客观事实，因此命题正确。', 1, 'phase1-demo');

-- ========== question_option (math-q1) ==========
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (1, 1, 'A', '3', 0, 1);
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (2, 1, 'B', '4', 1, 2);
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (3, 1, 'C', '5', 0, 3);
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (4, 1, 'D', '6', 0, 4);

-- math-q2
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (5, 2, 'A', '正确', 1, 1);
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (6, 2, 'B', '错误', 0, 2);

-- math-q3
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (7, 3, 'A', '90', 0, 1);
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (8, 3, 'B', '180', 1, 2);
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (9, 3, 'C', '270', 0, 3);
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (10, 3, 'D', '360', 0, 4);

-- math-q4
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (11, 4, 'A', '等边三角形一定是锐角三角形', 1, 1);
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (12, 4, 'B', '直角三角形一定有一个角是 90 度', 1, 2);
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (13, 4, 'C', '任意三角形三个外角和等于 90 度', 0, 3);
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (14, 4, 'D', '钝角三角形一定有两个钝角', 0, 4);

-- english-q1
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (15, 5, 'A', 'go', 0, 1);
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (16, 5, 'B', 'goes', 1, 2);
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (17, 5, 'C', 'going', 0, 3);
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (18, 5, 'D', 'gone', 0, 4);

-- english-q2
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (19, 6, 'A', '正确', 1, 1);
INSERT INTO question_option (id, question_id, option_key, content, is_correct, sort_order)
VALUES (20, 6, 'B', '错误', 0, 2);
