/**
 * The default WordPress admin user configuration for both local and live environments.
 * @constant
 * @type {{ username: string; password: string; localUsername: string; localPassword: string; local: string; live: string }}
 */
const WP_ADMIN_USER = {
	username: 'live_username',
	password: 'live_password',
	localUsername: 'admin',
	localPassword: 'password',
	local: 'http://localhost',
	live: 'https://example.org'
	
} as const;

/**
 * Extracted environment variables related to WordPress configuration.
 * Uses default values if environment variables are not set.
 * @constant
 * @type {{
 *   WP_USERNAME: string;
 *   WP_PASSWORD: string;
 *   WP_BASE_URL: string;
 *   WP_ROOT_DIR: string;
 *   WP_ENV_TYPE: ServerType;
 *   WP_DOCKER_CONTAINER: string;
 *   WP_DOCKER_ROOT_DIR: string;
 *   WP_SSH_USERNAME: string;
 *   WP_SSH_ADDRESS: string;
 *   WP_SSH_KEY: string;
 *   WP_SSH_ROOT_DIR: string;
 * }}
 */
const {
	WP_USERNAME = process.env.npm_config_env !== undefined ? WP_ADMIN_USER.localUsername : WP_ADMIN_USER.username,
	WP_PASSWORD = process.env.npm_config_env !== undefined ? WP_ADMIN_USER.localPassword : WP_ADMIN_USER.password,
	WP_BASE_URL = process.env.npm_config_env !== undefined ? WP_ADMIN_USER.local : WP_ADMIN_USER.live,
	WP_ROOT_DIR = '',
	WP_ENV_TYPE = '',
	WP_DOCKER_CONTAINER = '',
	WP_DOCKER_ROOT_DIR = '',
	WP_SSH_USERNAME = '',
	WP_SSH_ADDRESS = '',
	WP_SSH_KEY = '',
	WP_SSH_ROOT_DIR = ''
} = process.env;

/**
 * Lazy load template images
 */
const LL_BACKGROUND_IMAGES = {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	lazyload_css_background_images: {
		initialImages: [
			'https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/test.png',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/image-insidescript.jpeg',
			'https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/paper.jpeg',
			'https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/test_inline1.jpeg',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/test_inline2.jpeg',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/test_internal0.webp'
		],
		lazyLoadedImages: [
			'https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/image/test3.webp',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/image/file_example_JPG_100kB.jpg',
			'https://rocketlabsqa.ovh/wp-content/rocket-test-data/images/Spain.PNG',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/paper.jpeg',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/test_internal4.jpg',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/testnotExist.png',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/wp-rocket.svg',
			'https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/butterfly.avif',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/file_example_TIFF_1MB.tiff',
			'https://fastly.picsum.photos/id/976/200/300.jpg?hmac=s1Uz9fgJv32r8elfaIYn7pLpQXps7X9oYNwC5XirhO8',
			'https://rocketlabsqa.ovh/wp-content/rocket-test-data/images/fixtheissue.jpg',
			'https://mega.wp-rocket.me/avada/wp-content/rocket-test-data/prague-conference-center-1056491.jpg',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/butterfly%202.avif',
			'https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/paper%C3%A9quipesTest.jpeg',
			'https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/test_internal2.jpg',
			'https://e2e.rocketlabsqa.ovh/wp-content/plugins/revslidertest1/public/assets/assets/test_internal3.jpg',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/test.png',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/image/test3.gif',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/test_external1.jpeg',
			'https://e2e.rocketlabsqa.ovh/test.png',
			'https://upload.wikimedia.org/wikipedia/commons/1/11/Test-Logo.svg',
			'https://e2e.rocketlabsqa.ovh/kot%C5%82.png',
			'https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/styles/assets/images/relative1.jpeg',
			'https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/styles/assets/images/relative2.jpg',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/lcp/testsvg.svg',
			'https://new.rocketlabsqa.ovh//wp-content/rocket-test-data/images/wp-rocket.svg',
			'https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/wp-rocket2.svg',
			'https://e2e.rocketlabsqa.ovh/new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/test_internal2.jpg',
			'https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/nature.jpeg'
		]
	},
	// eslint-disable-next-line @typescript-eslint/naming-convention
	ll_bg_css_single_colon: {
		initialImages: [
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/fabio-sasso-UgpCjt4XLTY-unsplash.jpg',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/underline.png',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/maxime-lebrun-6g3Akg708E0-unsplash.jpg'
		],
		lazyLoadedImages: [
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/miguel-luis-6wxFtwSuXHQ-unsplash.jpg'
		]
	},
	// eslint-disable-next-line @typescript-eslint/naming-convention
	ll_bg_css_double_colon:{
		initialImages: [
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/fabio-sasso-UgpCjt4XLTY-unsplash.jpg',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/underline.png',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/maxime-lebrun-6g3Akg708E0-unsplash.jpg'
		],
		lazyLoadedImages: [
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/miguel-luis-6wxFtwSuXHQ-unsplash.jpg',
			'https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/Przechwytywanie.PNG'
		]
	}
};


/**
 * Exported Scenario urls to be used for visual regression testing with backstopjs
 * @exports
 * @type {{
 * [key: string]: {
 *	 path?: string,
 *	 disableJs?: boolean,
 *	 theme?: string,
 *	 mobile?: boolean
 *	}
 * }}
*/
const SCENARIO_URLS = {
	/**
	 * The value will hold the url paths
	 */
	home: {
		path: ''
	},
	llcss: {
		path: 'lazyload_css_background_images'
	},
	noJsLlcss: {
		path: 'lazyload_css_background_images',
		disableJs: true
	},
	elementorLlcss: {
		path: 'elementor-overlay'
	},
	delayJs: {
		path: ''
	},
	delayJsMobile: {
		path: '',
		mobile: true,
	},
}

/**
 * Exported WordPress environment configuration.
 * @exports
 * @type {{
 *   WP_USERNAME: string;
 *   WP_PASSWORD: string;
 *   WP_BASE_URL: string;
 *   WP_ROOT_DIR: string;
 *   WP_ENV_TYPE: ServerType;
 *   WP_DOCKER_CONTAINER: string;
 *   WP_DOCKER_ROOT_DIR: string;
 *   WP_SSH_USERNAME: string;
 *   WP_SSH_ADDRESS: string;
 *   WP_SSH_KEY: string;
 *   WP_SSH_ROOT_DIR: string;
 * 	 SCENARIO_URLS: {
 * 		home: string;
 * 		llcss: string;	
 * 		noJsLlcss: string;
 * 		elementorLlcss: string;
 * 	 }
 * }}
 */
export { 
	WP_USERNAME,
	WP_PASSWORD,
	WP_BASE_URL,
	WP_ROOT_DIR,
	WP_ENV_TYPE,
	WP_DOCKER_CONTAINER,
	WP_DOCKER_ROOT_DIR,
	WP_SSH_USERNAME,
	WP_SSH_ADDRESS,
	WP_SSH_KEY,
	WP_SSH_ROOT_DIR,
	SCENARIO_URLS,
	LL_BACKGROUND_IMAGES
};