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

// Check API directory contents before build
const apiDir = path.join(process.cwd(), 'pages/api');
console.log('🔍 Checking API directory contents before build:');
if (fs.existsSync(apiDir)) {
  const apiFiles = fs.readdirSync(apiDir);
  console.log('📁 API directory files:', apiFiles);
  
  // Specifically check for airtable-sync.ts
  const airtableSyncPath = path.join(apiDir, 'airtable-sync.ts');
  if (fs.existsSync(airtableSyncPath)) {
    console.log('✅ airtable-sync.ts exists before build');
    
    // Make a backup copy of the file to ensure it's not lost during the build process
    const backupPath = path.join(process.cwd(), 'airtable-sync.ts.backup');
    try {
      fs.copyFileSync(airtableSyncPath, backupPath);
      console.log('✅ Created backup of airtable-sync.ts');
    } catch (error) {
      console.error('❌ Error creating backup of airtable-sync.ts:', error.message);
    }
  } else {
    console.log('❌ airtable-sync.ts does not exist before build');
  }
} else {
  console.log('❌ API directory does not exist');
}

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

// We're using .vercelignore instead of .nowignore
console.log('✅ Using .vercelignore file instead of .nowignore');

console.log('✅ Custom build script completed');

// Check API directory contents after build
console.log('🔍 Checking API directory contents after build:');
if (fs.existsSync(apiDir)) {
  const apiFiles = fs.readdirSync(apiDir);
  console.log('📁 API directory files after build:', apiFiles);
  
  // Specifically check for airtable-sync.ts
  const airtableSyncPath = path.join(apiDir, 'airtable-sync.ts');
  const backupPath = path.join(process.cwd(), 'airtable-sync.ts.backup');
  
  if (fs.existsSync(airtableSyncPath)) {
    console.log('✅ airtable-sync.ts exists after build');
  } else {
    console.log('❌ airtable-sync.ts does not exist after build');
    
    // If the file doesn't exist but we have a backup, restore it
    if (fs.existsSync(backupPath)) {
      try {
        // Ensure the api directory exists
        if (!fs.existsSync(apiDir)) {
          fs.mkdirSync(apiDir, { recursive: true });
        }
        
        // Restore the file from backup
        fs.copyFileSync(backupPath, airtableSyncPath);
        console.log('✅ Restored airtable-sync.ts from backup');
      } catch (error) {
        console.error('❌ Error restoring airtable-sync.ts from backup:', error.message);
      }
    }
  }
  
  // Clean up the backup file
  if (fs.existsSync(backupPath)) {
    try {
      fs.unlinkSync(backupPath);
      console.log('✅ Removed backup file');
    } catch (error) {
      console.error('❌ Error removing backup file:', error.message);
    }
  }
} else {
  console.log('❌ API directory does not exist after build');
  
  // If the API directory doesn't exist, create it and restore the file from backup if available
  const backupPath = path.join(process.cwd(), 'airtable-sync.ts.backup');
  if (fs.existsSync(backupPath)) {
    try {
      // Create the API directory
      fs.mkdirSync(apiDir, { recursive: true });
      console.log('✅ Created API directory');
      
      // Restore the file from backup
      const airtableSyncPath = path.join(apiDir, 'airtable-sync.ts');
      fs.copyFileSync(backupPath, airtableSyncPath);
      console.log('✅ Restored airtable-sync.ts from backup');
      
      // Clean up the backup file
      fs.unlinkSync(backupPath);
      console.log('✅ Removed backup file');
    } catch (error) {
      console.error('❌ Error restoring API directory and files:', error.message);
    }
  }
}
