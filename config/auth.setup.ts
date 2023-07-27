import { test as setup } from '../src/common/fixtures';

setup('authenticate', async ({ utils }) => {
  await utils.auth();
});