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