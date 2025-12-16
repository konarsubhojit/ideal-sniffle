#!/usr/bin/env node
/**
 * User Role Management Script
 * 
 * Usage:
 *   node backend/scripts/manage-roles.js list
 *   node backend/scripts/manage-roles.js assign <email> <role>
 *   node backend/scripts/manage-roles.js remove <email>
 * 
 * Examples:
 *   node backend/scripts/manage-roles.js list
 *   node backend/scripts/manage-roles.js assign user@example.com admin
 *   node backend/scripts/manage-roles.js assign user@example.com contributor
 *   node backend/scripts/manage-roles.js assign user@example.com reader
 *   node backend/scripts/manage-roles.js remove user@example.com
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend directory
dotenv.config({ path: join(__dirname, '../.env') });

const VALID_ROLES = ['admin', 'contributor', 'reader'];

async function listUsers() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('\n📋 User List:\n');
  
  const users = await sql`
    SELECT id, email, name, role, created_at as "createdAt", last_login as "lastLogin"
    FROM users
    ORDER BY created_at DESC
  `;
  
  if (users.length === 0) {
    console.log('No users found.');
    return;
  }
  
  console.table(users.map(u => ({
    ID: u.id,
    Email: u.email,
    Name: u.name,
    Role: u.role || '(no role)',
    'Last Login': u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'
  })));
  
  console.log(`\nTotal users: ${users.length}`);
  console.log(`Admins: ${users.filter(u => u.role === 'admin').length}`);
  console.log(`Contributors: ${users.filter(u => u.role === 'contributor').length}`);
  console.log(`Readers: ${users.filter(u => u.role === 'reader').length}`);
  console.log(`No role: ${users.filter(u => !u.role).length}\n`);
}

async function assignRole(email, role) {
  if (!VALID_ROLES.includes(role)) {
    console.error(`❌ Invalid role: ${role}`);
    console.error(`Valid roles: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }
  
  const sql = neon(process.env.DATABASE_URL);
  
  const users = await sql`
    SELECT id, email, name, role
    FROM users
    WHERE email = ${email}
  `;
  
  if (users.length === 0) {
    console.error(`❌ User not found: ${email}`);
    process.exit(1);
  }
  
  const user = users[0];
  const oldRole = user.role || '(no role)';
  
  await sql`
    UPDATE users
    SET role = ${role}
    WHERE email = ${email}
  `;
  
  console.log(`✅ Successfully updated role for ${user.name} (${email})`);
  console.log(`   Old role: ${oldRole}`);
  console.log(`   New role: ${role}`);
  console.log('\n⚠️  User must log out and log back in for changes to take effect.\n');
}

async function removeRole(email) {
  const sql = neon(process.env.DATABASE_URL);
  
  const users = await sql`
    SELECT id, email, name, role
    FROM users
    WHERE email = ${email}
  `;
  
  if (users.length === 0) {
    console.error(`❌ User not found: ${email}`);
    process.exit(1);
  }
  
  const user = users[0];
  const oldRole = user.role || '(no role)';
  
  await sql`
    UPDATE users
    SET role = NULL
    WHERE email = ${email}
  `;
  
  console.log(`✅ Successfully removed role from ${user.name} (${email})`);
  console.log(`   Previous role: ${oldRole}`);
  console.log(`   New role: (no role) - User will see 403 Forbidden\n`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('   Make sure backend/.env file exists with DATABASE_URL');
    process.exit(1);
  }
  
  try {
    switch (command) {
      case 'list':
        await listUsers();
        break;
      
      case 'assign':
        if (args.length !== 3) {
          console.error('Usage: node manage-roles.js assign <email> <role>');
          process.exit(1);
        }
        await assignRole(args[1], args[2]);
        break;
      
      case 'remove':
        if (args.length !== 2) {
          console.error('Usage: node manage-roles.js remove <email>');
          process.exit(1);
        }
        await removeRole(args[1]);
        break;
      
      default:
        console.log('User Role Management Script');
        console.log('\nUsage:');
        console.log('  node manage-roles.js list');
        console.log('  node manage-roles.js assign <email> <role>');
        console.log('  node manage-roles.js remove <email>');
        console.log('\nRoles:');
        console.log('  admin       - Full access to everything');
        console.log('  contributor - Can create/edit/delete expenses and groups');
        console.log('  reader      - Read-only access');
        console.log('\nExamples:');
        console.log('  node manage-roles.js list');
        console.log('  node manage-roles.js assign user@example.com admin');
        console.log('  node manage-roles.js remove user@example.com');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
