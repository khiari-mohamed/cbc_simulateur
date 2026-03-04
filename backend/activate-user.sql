-- Activate the user account
UPDATE users 
SET "isActive" = true, "otpSecret" = NULL
WHERE email = 'poxata2222@muhaos.com';

-- Check the result
SELECT id, email, "firstName", "lastName", "isActive", "otpEnabled", "organizationId" 
FROM users 
WHERE email = 'poxata2222@muhaos.com';
