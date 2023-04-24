const WP_ADMIN_USER = {
	username: 'mike',
	password: '4:[&I1QY^We$M',
	local_username: 'admin',
	local_password: 'password'
} as const;

const {
	WP_USERNAME = process.env.CI ? WP_ADMIN_USER.local_username : WP_ADMIN_USER.username,
	WP_PASSWORD = process.env.CI ? WP_ADMIN_USER.local_password : WP_ADMIN_USER.password,
	WP_BASE_URL = 'https://boyetechnology.com/test'
} = process.env;

export { WP_USERNAME, WP_PASSWORD, WP_BASE_URL };