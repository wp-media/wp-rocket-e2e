/**
 * @fileoverview This module defines configuration settings for the WordPress environment.
 * It includes default values and environment variable overrides for various parameters.
 * @module wp.config.sample
 * @see {@link ServerType} for possible values of WP_ENV_TYPE.
 */
import {ServerType} from "../utils/configurations";

/**
 * The default WordPress admin user configuration for both local and live environments.
 * @constant
 * @type {{ username: string; password: string; localUsername: string; localPassword: string }}
 */
const WP_ADMIN_USER = {
	username: 'live_username',
	password: 'live_password',
	localUsername: 'admin',
	localPassword: 'password'
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
	WP_USERNAME = process.env.CI ? WP_ADMIN_USER.localUsername : WP_ADMIN_USER.username,
	WP_PASSWORD = process.env.CI ? WP_ADMIN_USER.localPassword : WP_ADMIN_USER.password,
	WP_BASE_URL = 'https://example.org',
	WP_ROOT_DIR = '',
	WP_ENV_TYPE = ServerType.localhost,
	WP_DOCKER_CONTAINER = '',
	WP_DOCKER_ROOT_DIR = '',
	WP_SSH_USERNAME = '',
	WP_SSH_ADDRESS = '',
	WP_SSH_KEY = '',
	WP_SSH_ROOT_DIR = ''
} = process.env;

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
};