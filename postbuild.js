const fs = require('fs');
const path = require('path');

const distFolder = path.join(__dirname, 'dist');
const filesToCopy = ['package.json', 'firebase.json', 'firebaseAdmin.json'];

for (const file of filesToCopy) {
  const sourcePath = path.join(__dirname, file);
  const destinationPath = path.join(distFolder, file);

  try {
    fs.copyFileSync(sourcePath, destinationPath);
    console.log(`Copied ${sourcePath} to ${destinationPath}`);
  } catch (error) {
    console.error(`Error copying ${sourcePath} to ${destinationPath}`);
    console.error(error);
  }
}

// Copy src/static folder to dist/static recursively
const srcStaticPath = path.join(__dirname, 'src', 'static');
const destStaticPath = path.join(distFolder, 'static');
try {
  // create if not exists
  fs.mkdirSync(destStaticPath);
} catch (error) {}

const copyRecursive = (src, dest) => {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      try {
        fs.mkdirSync(destPath);
      } catch (error) {}
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(srcStaticPath, destStaticPath);