-- Migration to hash existing plain text PINs
-- This migration should be run AFTER bcrypt is implemented in the application
--
-- IMPORTANT: This is a template migration. Before running:
-- 1. Hash each PIN using bcrypt with salt rounds = 10
-- 2. Replace the plain text PINs below with their hashed values
--
-- Example using Node.js:
-- const bcrypt = require('bcryptjs');
-- const hashedPin = await bcrypt.hash('1234', 10);
--
-- For now, this migration is commented out to prevent accidental execution
-- Uncomment and update the hashed PINs before running

/*
-- Parent PIN: 1234
-- Hashed: Generate using: bcrypt.hash('1234', 10)
UPDATE profiles
SET pin_code = '$2a$10$...' -- Replace with actual hashed PIN
WHERE name = '엄마' AND pin_code = '1234';

-- Child 1 PIN: 0000
-- Hashed: Generate using: bcrypt.hash('0000', 10)
UPDATE profiles
SET pin_code = '$2a$10$...' -- Replace with actual hashed PIN
WHERE name = '큰아이' AND pin_code = '0000';

-- Child 2 PIN: 1111
-- Hashed: Generate using: bcrypt.hash('1111', 10)
UPDATE profiles
SET pin_code = '$2a$10$...' -- Replace with actual hashed PIN
WHERE name = '작은아이' AND pin_code = '1111';
*/

-- Add comment to pin_code column to indicate it should be hashed
COMMENT ON COLUMN profiles.pin_code IS 'Hashed PIN code using bcrypt (salt rounds: 10). Format: $2a$10$...';
