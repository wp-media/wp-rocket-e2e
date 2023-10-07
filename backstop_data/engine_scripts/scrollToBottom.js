module.exports = async (page, scenario) => {
    // Calculate the total height of the page
    const bodyHandle = await page.$('body');
    const { height } = await bodyHandle.boundingBox();
    await bodyHandle.dispose();

    // Scroll to the bottom of the page
    await page.evaluate((scrollHeight) => {
      window.scrollTo(0, scrollHeight);
    }, height);

    // Wait for a moment to ensure the scroll completes
    await page.waitForTimeout(3000); 
  };