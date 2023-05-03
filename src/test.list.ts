import { test } from '@playwright/test';

/**
 * Local deps.
 */
// import rocketLicense from './admin/rocket.license.auth.spec';
// import configFile from './admin/configs/rocket.config.spec';
// import Preload from './admin/preload/index.spec';
// import miscellaneous from './admin/miscellaneous.spec';
// import DeactivationModal from './admin/rocket.deactivation.modal.spec';
// import safeMode from './admin/rocket.safe.mode.spec';
// import deferJs from './admin/file_optimization/deferjs.spec';
// import delayJs from './admin/file_optimization/delayjs.spec';
// import AdvancedRules from './admin/advanced_rules/index.spec';

// import deactivation from './admin/rocket.deactivation.spec';
// import wpCache from './admin/wp.cache.constant.spec';
import enableAllFeatures from './smoke/enable.all.features.spec';
import deletePlugin from './smoke/delete.plugin.spec';
import upgradingPlugin from './smoke/upgrading.plugin.spec';
import rollBack from './smoke/roll.back.spec';

// Test list.
// test.describe('Rocket License', rocketLicense);
// test.describe('Rocket Config File', configFile);
// test.describe('Preload', Preload);
// test.describe('Miscellaneous', miscellaneous);
// test.describe('WPR Deactivation Modal', DeactivationModal);
// test.describe('Safe Mode', safeMode);
// test.describe('Defer JS', deferJs);
// test.describe('Delay JS', delayJs);
// test.describe('Advanced Rules', AdvancedRules);

// test.describe('WPR Deactivation', deactivation);
// test.describe('WP Cache Constant', wpCache);

// Smoke Tests
test.describe('Enable all features', enableAllFeatures);
test.describe('Delete Plugin', deletePlugin);
test.describe('Upgrading Plugin', upgradingPlugin);
test.describe('Roll Back Plugin', rollBack);