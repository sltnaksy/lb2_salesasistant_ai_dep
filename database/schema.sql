DROP TABLE IF EXISTS message_knowledge_entries CASCADE;
DROP TABLE IF EXISTS ai_responses CASCADE;
DROP TABLE IF EXISTS knowledge_entries CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active'
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    customer_name VARCHAR(255),
    customer_company VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_responses (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    generated_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'generated',
    request_type VARCHAR(100),
    priority VARCHAR(50),
    intents TEXT[],
    confidence NUMERIC(4,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE knowledge_entries (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    content TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    used_in_responses INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE message_knowledge_entries (
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    knowledge_entry_id INTEGER NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
    PRIMARY KEY (message_id, knowledge_entry_id)
);

INSERT INTO users (username, email, password_hash)
VALUES ('Sultan', 'sultan@test.com', '123456');

INSERT INTO chat_sessions (user_id, status)
VALUES (1, 'active');

INSERT INTO knowledge_entries (
    title,
    category,
    content,
    file_type,
    file_size,
    usage_count,
    used_in_responses
)
VALUES
(
    'pricing_model_v3.pdf',
    'Pricing',
    'Enterprise-Lösungen werden individuell kalkuliert. Der Preis hängt von Anzahl der Mitarbeitenden, Support-Level und Integrationsaufwand ab.',
    'PDF',
    245,
    3,
    2
),
(
    'enterprise_onboarding.doc',
    'Onboarding',
    'Die Implementierung einer Enterprise-Lösung dauert typischerweise 4 bis 8 Wochen. Die genaue Dauer hängt von Datenmigration, Integration und Schulung ab.',
    'DOC',
    180,
    2,
    1
),
(
    'sales_playbook_q2.pdf',
    'Sales',
    'Bei Enterprise-Anfragen sollen Preisrahmen, Implementierungszeit und ein nächster Beratungstermin angeboten werden.',
    'PDF',
    320,
    5,
    3
);