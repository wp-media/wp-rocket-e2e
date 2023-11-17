/**
 * @fileoverview
 * This file defines Playwright test cases for the deactivation modal in WP Rocket settings.
 *
 * @typedef {import('@playwright/test').Page} Page - Playwright Page type.
 * @typedef {import('@playwright/test').TestArgs} TestArgs - Playwright TestArgs type.
 *
 * @function
 * @name DeactivationModal
 * @description Test case to ensure that the deactivation modal pops up.
 */

import { test } from '@playwright/test';

/**
 * Local dependencies.
 */
import { deactivationModal } from '../common/deactivation.modal';

/**
 * Test case: Should pop up deactivation modal.
 */
const DeactivationModal = () => {
    /**
     * @function
     * @name DeactivationModal.ShouldPopUpDeactivationModal
     * @description Test case to ensure that the deactivation modal pops up.
     */
    test('should pop up deactivation modal', async ({ page }) => {
        await deactivationModal(page);
    });
}

export default DeactivationModal;