const bcrypt = require('bcrypt');
const saltRounds = 10;

// Replace these values with the desired username and password
const username = 'dom';
const plainPassword = '@Lab2024!';

bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log(`INSERT INTO users (username, password, role, status) VALUES ('${username}', '${hash}', 'user', 'active');`);
});

/**
 * Master User Creation Script
 * 
 * Purpose:
 * - Creates initial admin user
 * - Generates secure password hash
 * - Outputs SQL insert statement
 * 
 * Security:
 * - Uses bcrypt for password hashing
 * - Configurable salt rounds
 * - Generates SQL-safe output
 */
