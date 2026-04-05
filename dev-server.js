#!/usr/bin/env node
/**
 * Development server launcher
 * Starts the app and keeps it running
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Finance Backend Server...');
console.log('Environment: development');
console.log('Database: SQLite (finance.db)');
console.log('Port: 3000\n');

const app = spawn('node', [path.join(__dirname, 'src', 'app.js')], {
  stdio: 'inherit',
  detached: false,
});

app.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

app.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Handle signals
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  app.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  app.kill('SIGTERM');
});

