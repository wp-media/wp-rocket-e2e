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
	doubleColon: {
		path: 'll_bg_css_double_colon'
	},
	singleColon: {
		path: 'll_bg_css_single_colon'
	},
	delayJs13Live: {
		path: 'delayjs_1_3_live_template',
	},
	delayJs68Live: {
		path: 'delayjs_68_live_template',
	},
	lcp6647Live: {
		path: 'lcp_6647_live',
	},
	lcpLive4Template: {
		path: 'lcp_live_4_template',
	},
	lcpLiveTestSpan: {
		path: 'lcp_live_test_span',
	},
	rucss5213Template: {
		path: 'rucss_5213_template',
	},
	template4787: {
		path: '4787_template',
	},
	lrcWillSite: {
		path: 'lrc_will_site',
	}
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
	SCENARIO_URLS
};