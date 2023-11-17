/**
 * @fileoverview
 * This module provides configurations for interacting with a WordPress instance based on the server type.
 * It includes global configurations and functions for determining the WordPress directory and selecting configurations.
 *
 * @requires {@link ../config/wp.config}
 * @requires {@link ts-pattern}
 */
import {
    WP_ENV_TYPE,
    WP_USERNAME,
    WP_ROOT_DIR,
    WP_DOCKER_CONTAINER,
    WP_BASE_URL,
    WP_DOCKER_ROOT_DIR, WP_PASSWORD,
    WP_SSH_ADDRESS,
    WP_SSH_KEY,
    WP_SSH_USERNAME, WP_SSH_ROOT_DIR,
} from "../config/wp.config";

import {match} from "ts-pattern";

/**
 * Enumeration of possible server types.
 *
 * @enum {string}
 */
export enum ServerType {
    docker = 'docker',
    localhost = 'localhost',
    external = 'external'
}

/**
 * Global configurations shared across different server types.
 *
 * @typedef {Object} GlobalConfigurations
 * @property {ServerType} type - The type of the server.
 * @property {string} username - The username for authentication.
 * @property {string} password - The password for authentication.
 * @property {string} baseUrl - The base URL of the WordPress instance.
 * @property {string} rootDir - The root directory of the WordPress instance.
 */
type GlobalConfigurations = {
  type: ServerType;
  username: string;
  password: string;
  baseUrl: string;
  rootDir: string;
};

/**
 * Local server configurations extending global configurations for localhost.
 *
 * @typedef {GlobalConfigurations} LocalConfigurations
 * @property {ServerType.localhost} type - The server type set to localhost.
 */
type LocalConfigurations = GlobalConfigurations & {
    type: ServerType.localhost;
};

/**
 * Docker server configurations extending global configurations for Docker.
 *
 * @typedef {GlobalConfigurations} DockerConfigurations
 * @property {ServerType.docker} type - The server type set to docker.
 * @property {Object} docker - Docker-specific configurations.
 * @property {string} docker.container - The Docker container name.
 * @property {string} docker.rootDir - The root directory of the WordPress instance within Docker.
 */
type DockerConfigurations = GlobalConfigurations & {
    type: ServerType.docker;
    docker: {
        container: string;
        rootDir: string;
    }
}

/**
 * External server configurations extending global configurations for an external server.
 *
 * @typedef {GlobalConfigurations} ExternalConfigurations
 * @property {ServerType.external} type - The server type set to external.
 * @property {Object} ssh - SSH-specific configurations.
 * @property {string} ssh.username - The SSH username.
 * @property {string} ssh.address - The SSH address.
 * @property {string} ssh.key - The SSH key for authentication.
 * @property {string} ssh.rootDir - The root directory of the WordPress instance on the external server.
 */
type ExternalConfigurations = GlobalConfigurations & {
    type: ServerType.external;
    ssh: {
        username: string,
        address: string,
        key: string,
        rootDir: string;
    }
}

/**
 * Union type representing different server configurations.
 *
 * @typedef {LocalConfigurations | DockerConfigurations | ExternalConfigurations} Configurations
 */
type Configurations = DockerConfigurations | LocalConfigurations | ExternalConfigurations;

/**
 * Configurations object based on the WP_ENV_TYPE, selecting the appropriate server type.
 *
 * @type {Configurations}
 */
export const configurations: Configurations = match(WP_ENV_TYPE)
    .with(ServerType.docker, () => ({
        type: ServerType.docker,
        username: WP_USERNAME,
        password: WP_PASSWORD,
        baseUrl: WP_BASE_URL,
        rootDir: WP_ROOT_DIR,
        docker: {
            container: WP_DOCKER_CONTAINER,
            rootDir: WP_DOCKER_ROOT_DIR,
        }
    }) as DockerConfigurations)
    .with(ServerType.external, () => ({
        type: ServerType.external,
        username: WP_USERNAME,
        password: WP_PASSWORD,
        baseUrl: WP_BASE_URL,
        rootDir: WP_ROOT_DIR,
        ssh: {
            username: WP_SSH_USERNAME,
            address: WP_SSH_ADDRESS,
            key: WP_SSH_KEY,
            rootDir: WP_SSH_ROOT_DIR,
        }
    }) as ExternalConfigurations)
.otherwise(() => ({
    type: ServerType.localhost,
    username: WP_USERNAME,
    password: WP_PASSWORD,
    baseUrl: WP_BASE_URL,
    rootDir: WP_ROOT_DIR,
}) as LocalConfigurations)

/**
 * Retrieves the WordPress directory based on the server type.
 *
 * @function
 * @name getWPDir
 * @param {Configurations} configurations - The server configurations.
 * @returns {string} - The WordPress directory.
 */
export const getWPDir = (configurations: Configurations) => match(configurations)
    .with({type: ServerType.docker}, (selections) => selections.docker.rootDir)
    .with({type: ServerType.external}, (selections) => selections.ssh.rootDir)
    .with({type: ServerType.localhost}, (selections) => selections.rootDir)
    .exhaustive();

