module.exports = async (page) => {
    let target;

    const theme = process.env.THEME ? process.env.THEME : '';

    if (theme === '') {
        return;
    }

    switch (theme) {
        case 'genesis-sample-develop':
            target = '#genesis-mobile-nav-primary';
            break;
        case 'flatsome':
            target = '[data-open="#main-menu"]';
            break;
        case 'Divi':
            target = '#et_mobile_nav_menu';
            break;
        case 'astra':
            target = '.ast-mobile-menu-trigger-minimal';
            break;
    }

    await page.click(target);
    await page.waitForTimeout(2000); 
};

