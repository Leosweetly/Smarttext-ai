#!/usr/bin/env node

/**
 * Custom build script for Vercel deployment
 * This script runs before the Next.js build to ensure that test files are not included
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to check and remove if they exist
const filesToRemove = [
  'api/test.js',
  'pages/api/test.ts',
  'pages/api/auth/[...auth0].ts'
];

// Directories to check and remove if they exist
const dirsToRemove = [
  'pages/api/auth'
];

console.log('🔍 Running custom Vercel build script...');

// Check and remove files
filesToRemove.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  Removing ${filePath}...`);
    try {
      fs.unlinkSync(fullPath);
      console.log(`✅ Successfully removed ${filePath}`);
    } catch (error) {
      console.error(`❌ Error removing ${filePath}:`, error.message);
    }
  } else {
    console.log(`✅ ${filePath} does not exist, skipping`);
  }
});

// Check and remove directories
dirsToRemove.forEach(dirPath => {
  const fullPath = path.join(process.cwd(), dirPath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  Removing directory ${dirPath}...`);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Successfully removed directory ${dirPath}`);
    } catch (error) {
      console.error(`❌ Error removing directory ${dirPath}:`, error.message);
    }
  } else {
    console.log(`✅ Directory ${dirPath} does not exist, skipping`);
  }
});

// Create a .nowignore file to ensure test files are ignored
const nowIgnorePath = path.join(process.cwd(), '.nowignore');
const ignoreContent = `
# Ignore test files
**/test.ts
**/test.js
api/test.js
pages/api/test.ts

# Ignore old auth directory to prevent conflicts
pages/api/auth
`;

try {
  fs.writeFileSync(nowIgnorePath, ignoreContent);
  console.log('✅ Created .nowignore file');
} catch (error) {
  console.error('❌ Error creating .nowignore file:', error.message);
}

console.log('✅ Custom build script completed');
