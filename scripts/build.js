const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('--- Starting Smart Vercel Build ---');
const rootDir = process.cwd();

if (fs.existsSync(path.join(rootDir, 'frontend'))) {
  console.log('Detected root directory. Building frontend subfolder...');
  execSync('npm --prefix frontend install', { stdio: 'inherit' });
  execSync('npm --prefix frontend run build', { stdio: 'inherit' });
  
  const frontendDist = path.join(rootDir, 'frontend', 'dist');
  const rootDist = path.join(rootDir, 'dist');
  if (fs.existsSync(frontendDist)) {
    fs.cpSync(frontendDist, rootDist, { recursive: true });
    console.log('Copied build artifacts to root dist folder for Vercel deployment');
  }
} else {
  console.log('Building in current directory...');
  execSync('npm install', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });
}

console.log('--- Smart Vercel Build Successful ---');
