CREATE TABLE IF NOT EXISTS sys_user (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  username    VARCHAR(64)  NOT NULL UNIQUE,
  email       VARCHAR(128) NOT NULL UNIQUE,
  password    VARCHAR(256) NOT NULL,
  nickname    VARCHAR(64),
  avatar      VARCHAR(256),
  status      TINYINT DEFAULT 1,
  del_flag    TINYINT DEFAULT 0,
  login_ip    VARCHAR(128),
  login_date  DATETIME,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subject (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(128) NOT NULL,
  sort_order  INT DEFAULT 0,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topic (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  subject_id  BIGINT NOT NULL,
  parent_id   BIGINT,
  name        VARCHAR(256) NOT NULL,
  sort_order  INT DEFAULT 0,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subject(id),
  FOREIGN KEY (parent_id) REFERENCES topic(id)
);

CREATE TABLE IF NOT EXISTS question (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  subject_id  BIGINT NOT NULL,
  topic_id    BIGINT NOT NULL,
  type        VARCHAR(32) NOT NULL,
  stem        TEXT NOT NULL,
  explanation TEXT,
  difficulty  TINYINT DEFAULT 1,
  source      VARCHAR(128),
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subject(id),
  FOREIGN KEY (topic_id) REFERENCES topic(id)
);

CREATE TABLE IF NOT EXISTS question_option (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  question_id BIGINT NOT NULL,
  option_key  VARCHAR(8) NOT NULL,
  content     TEXT NOT NULL,
  is_correct  TINYINT DEFAULT 0,
  sort_order  INT DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES question(id)
);

CREATE TABLE IF NOT EXISTS practice_session (
  id             VARCHAR(64) PRIMARY KEY,
  user_id        BIGINT NOT NULL,
  mode           VARCHAR(32) NOT NULL,
  subject_id     BIGINT NOT NULL,
  topic_id       BIGINT,
  scope_title    VARCHAR(256) NOT NULL,
  question_count INT NOT NULL DEFAULT 0,
  correct_count  INT NOT NULL DEFAULT 0,
  started_at     DATETIME NOT NULL,
  finished_at    DATETIME,
  create_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES sys_user(id),
  FOREIGN KEY (subject_id) REFERENCES subject(id),
  FOREIGN KEY (topic_id) REFERENCES topic(id)
);

CREATE TABLE IF NOT EXISTS practice_session_question (
  id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id     VARCHAR(64) NOT NULL,
  question_id    BIGINT NOT NULL,
  position_index INT NOT NULL,
  create_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES practice_session(id),
  FOREIGN KEY (question_id) REFERENCES question(id),
  CONSTRAINT uk_session_question UNIQUE (session_id, question_id),
  CONSTRAINT uk_session_position UNIQUE (session_id, position_index)
);

CREATE TABLE IF NOT EXISTS user_answer (
  id                   VARCHAR(64) PRIMARY KEY,
  session_id           VARCHAR(64) NOT NULL,
  user_id              BIGINT NOT NULL,
  question_id          BIGINT NOT NULL,
  selected_option_keys CLOB NOT NULL,
  is_correct           TINYINT NOT NULL DEFAULT 0,
  answered_at          DATETIME NOT NULL,
  create_time          DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time          DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES practice_session(id),
  FOREIGN KEY (user_id) REFERENCES sys_user(id),
  FOREIGN KEY (question_id) REFERENCES question(id),
  CONSTRAINT uk_user_answer_session_question UNIQUE (session_id, question_id)
);

CREATE TABLE IF NOT EXISTS wrong_book_item (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id         BIGINT NOT NULL,
  question_id     BIGINT NOT NULL,
  subject_id      BIGINT NOT NULL,
  topic_id        BIGINT NOT NULL,
  correct_option_keys CLOB,
  first_wrong_at  DATETIME NOT NULL,
  last_wrong_at   DATETIME NOT NULL,
  wrong_count     INT NOT NULL DEFAULT 1,
  last_session_id VARCHAR(64),
  resolved        TINYINT NOT NULL DEFAULT 0,
  create_time     DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES sys_user(id),
  FOREIGN KEY (question_id) REFERENCES question(id),
  FOREIGN KEY (subject_id) REFERENCES subject(id),
  FOREIGN KEY (topic_id) REFERENCES topic(id),
  CONSTRAINT uk_wrong_book_user_question UNIQUE (user_id, question_id)
);

CREATE INDEX idx_practice_session_user_started
  ON practice_session(user_id, started_at);
CREATE INDEX idx_practice_session_topic
  ON practice_session(topic_id);
CREATE INDEX idx_practice_session_question_session_position
  ON practice_session_question(session_id, position_index);
CREATE INDEX idx_user_answer_user_question
  ON user_answer(user_id, question_id);
CREATE INDEX idx_user_answer_user_answered
  ON user_answer(user_id, answered_at);
CREATE INDEX idx_wrong_book_user_subject_topic
  ON wrong_book_item(user_id, subject_id, topic_id);
CREATE INDEX idx_wrong_book_user_resolved_last_wrong
  ON wrong_book_item(user_id, resolved, last_wrong_at);
