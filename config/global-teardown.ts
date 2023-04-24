async function globalTeardown() {
  // Delete 'storageState.json'.
  const fs = require('fs');
  fs.unlink('./config/storageState.json', err => {
    if (err) {
        console.log('Unable to clear storage.')
    }
  });
}

export default globalTeardown;