module.exports = async (page, scenario) => {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
            var scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if(totalHeight >= scrollHeight){
                clearInterval(timer);
                resolve();
            }
            }, 500);
        });
    });
    await page.waitForTimeout(5000); 
  };