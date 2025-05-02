/**
 * Simple server script to start the Next.js development server
 * 
 * This script is a convenience wrapper around the Next.js development server.
 * It can be used to start the server with a single command: node server.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting Next.js development server...');

// Start the Next.js development server
const nextDev = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  cwd: __dirname
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('Stopping Next.js development server...');
  nextDev.kill('SIGINT');
  process.exit(0);
});

nextDev.on('close', (code) => {
  console.log(`Next.js development server exited with code ${code}`);
  process.exit(code);
});
