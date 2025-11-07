-- Run this in Supabase SQL Editor to verify the table was created

-- 1. Check if api_clients table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'api_clients';

-- 2. Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'api_clients'
ORDER BY ordinal_position;

-- 3. Try to select from the table
SELECT COUNT(*) as row_count FROM api_clients;

-- 4. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'api_clients';



