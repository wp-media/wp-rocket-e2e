const WP_ADMIN_USER = {
	username: 'live_username',
	password: 'live_password',
	localUsername: 'admin',
	localPassword: 'password'
} as const;

const {
	WP_USERNAME = process.env.CI ? WP_ADMIN_USER.localUsername : WP_ADMIN_USER.username,
	WP_PASSWORD = process.env.CI ? WP_ADMIN_USER.localPassword : WP_ADMIN_USER.password,
	WP_BASE_URL = 'https://example.org',
	WP_ROOT_DIR = '',
	WP_DOCKER = false,
	WP_DOCKER_CONTAINER = '',
} = process.env;

export { WP_USERNAME, WP_PASSWORD, WP_BASE_URL, WP_ROOT_DIR, WP_DOCKER, WP_DOCKER_CONTAINER };