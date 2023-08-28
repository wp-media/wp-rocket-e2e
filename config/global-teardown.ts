import * as fs from 'fs';

const globalTeardown = async (): Promise<void> => {
   // Delete 'storageState.json'.
   fs.unlink('./config/storageState.json', err => {
     if (err) {
         console.log('Unable to clear storage.')
     }
   });
}

export default globalTeardown;