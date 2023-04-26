import path from 'path';
import { defineConfig } from '@playwright/test';
import { devices } from '@playwright/test';

// Internal dependencies
import { WP_BASE_URL } from './config/wp.config';

export default defineConfig({
	testMatch: 'test.list.ts',
	globalTeardown: require.resolve('./config/global-teardown'),
	/* Maximum time one test can run for. */
	timeout: 200000,
	globalTimeout: 900000,
	reportSlowTests: null,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Opt out of parallel tests on CI. */
	workers: 1,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: [
		['list'],
		['html', { outputFolder: path.join( process.cwd(), 'reports' ) }]
	],
	outputDir: path.join( process.cwd(), 'artifacts' ),
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		baseURL: WP_BASE_URL,
		headless: true,
		viewport: {
			width: 960,
			height: 700,
		},
		ignoreHTTPSErrors: true,
		locale: 'en-US',
		contextOptions: {
			reducedMotion: 'reduce',
			strictSelectors: true,
		},
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		actionTimeout: 10_000, // 10 seconds.
	},
	// webServer: {
    //     command: 'npm run wp-env start\nnpm run wp-env run cli wp theme activate twentytwentytwo\nnpm run wp-env run cli wp plugin install classic-editor',
    //     port: 8888,
    //     timeout: 120 * 1000,
    //     reuseExistingServer: true,
    // },

	/* Configure projects for major browsers */
	projects: [
		// Setup project
		{ name: 'setup', testMatch: 'auth.setup.ts' },
		{
			name: 'chrome',
			use: {
				...devices['Desktop Chrome'],
				// Use prepared auth state.
				storageState: './config/storageState.json',
			},
		},

		/* Test against mobile viewports. */
		// {
		//   name: 'Mobile Chrome',
		//   use: {
		//     ...devices['Pixel 5'],
		//   },
		// },
		// {
		//   name: 'Mobile Safari',
		//   use: {
		//     ...devices['iPhone 12'],
		//   },
		// },

		/* Test against branded browsers. */
		// {
		//   name: 'Microsoft Edge',
		//   use: {
		//     channel: 'msedge',
		//   },
		// },
		// {
		//   name: 'Google Chrome',
		//   use: {
		//     channel: 'chrome',
		//   },
		// },
	],
});
