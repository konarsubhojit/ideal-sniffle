-- SQL script to create initial groups
-- Run this script to populate the database with the required groups

-- Insert or update groups (using UPSERT pattern)
-- If a group with the same ID exists, it will be updated; otherwise, it will be inserted

-- Group 1: OtherFam (External Family)
INSERT INTO groups (id, name, count, type, created_at, updated_at)
VALUES (1, 'OtherFam', 3, 'External', NOW(), NOW())
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, count = EXCLUDED.count, type = EXCLUDED.type, updated_at = NOW();

-- Group 2: Subhojit
INSERT INTO groups (id, name, count, type, created_at, updated_at)
VALUES (2, 'Subhojit', 3, 'Internal', NOW(), NOW())
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, count = EXCLUDED.count, type = EXCLUDED.type, updated_at = NOW();

-- Group 3: Ravi
INSERT INTO groups (id, name, count, type, created_at, updated_at)
VALUES (3, 'Ravi', 3, 'Internal', NOW(), NOW())
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, count = EXCLUDED.count, type = EXCLUDED.type, updated_at = NOW();

-- Group 4: Abhijit
INSERT INTO groups (id, name, count, type, created_at, updated_at)
VALUES (4, 'Abhijit', 2, 'Internal', NOW(), NOW())
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, count = EXCLUDED.count, type = EXCLUDED.type, updated_at = NOW();

-- Group 5: Apurba
INSERT INTO groups (id, name, count, type, created_at, updated_at)
VALUES (5, 'Apurba', 2, 'Internal', NOW(), NOW())
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, count = EXCLUDED.count, type = EXCLUDED.type, updated_at = NOW();

-- Group 6: Gopal
INSERT INTO groups (id, name, count, type, created_at, updated_at)
VALUES (6, 'Gopal', 2, 'Internal', NOW(), NOW())
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, count = EXCLUDED.count, type = EXCLUDED.type, updated_at = NOW();

-- Group 7: Anupam
INSERT INTO groups (id, name, count, type, created_at, updated_at)
VALUES (7, 'Anupam', 2, 'Internal', NOW(), NOW())
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, count = EXCLUDED.count, type = EXCLUDED.type, updated_at = NOW();

-- Group 8: Arindra
INSERT INTO groups (id, name, count, type, created_at, updated_at)
VALUES (8, 'Arindra', 2, 'Internal', NOW(), NOW())
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, count = EXCLUDED.count, type = EXCLUDED.type, updated_at = NOW();

-- Group 9: Nupur
INSERT INTO groups (id, name, count, type, created_at, updated_at)
VALUES (9, 'Nupur', 2, 'Internal', NOW(), NOW())
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, count = EXCLUDED.count, type = EXCLUDED.type, updated_at = NOW();

-- Update the sequence to continue from the last group ID
SELECT setval('groups_id_seq', (SELECT MAX(id) FROM groups));

-- Verify the groups were created
SELECT id, name, count, type FROM groups ORDER BY id;
