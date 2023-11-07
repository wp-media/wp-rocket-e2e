const WP_ADMIN_USER = {
	username: 'live_username',
	password: 'live_password',
	localUsername: 'admin',
	localPassword: 'password',
	local: 'http://localhost',
	live: 'https://example.org'
	
} as const;

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

const SCENARIO_URLS = {
	/**
	 * The value will hold the url paths
	 */
	home: '',
	llcss: '',
	noJsLlcss: '',
	elementorLlcss: ''
}

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