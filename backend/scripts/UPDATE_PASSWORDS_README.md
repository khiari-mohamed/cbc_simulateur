# Update All User Passwords Script

This script updates all user passwords to `Azerty123@` and displays all user emails and roles.

## How to Run

1. Navigate to the backend directory:
```bash
cd d:\house_md\cbc\backend
```

2. Run the script:
```bash
npx ts-node update-all-passwords.ts  
```

## What the Script Does

1. Retrieves all users from the database
2. Displays a list of all users with their emails and roles
3. Updates all user passwords to `Azerty123@` (hashed with bcrypt)
4. Shows the total number of users updated

## Output Example

```
PS D:\house_md\cbc> cd backend
PS D:\house_md\cbc\backend> npx ts-node update-all-passwords.ts                   

📋 User List (Before Update):                                                     
================================                                                  
1. Email: ramiabd2023@gmail.com | Role: CLIENT_ADHERENT                           
2. Email: rami.abdmouleh@gmail.com | Role: CLIENT_ADHERENT                        
3. Email: rami.abdmouleh@arstunisie.com | Role: ADMINISTRATEUR_ARS
4. Email: jimiko2749@fengnu.com | Role: CLIENT_ADHERENT
5. Email: xewiy45043@flownue.com | Role: GESTIONNAIRE_VALIDATION_ARS

✅ All passwords updated to: Azerty123@

📊 Total users updated: 5
PS D:\house_md\cbc\backend> 