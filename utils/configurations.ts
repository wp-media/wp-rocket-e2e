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

export enum ServerType {
    docker = 'docker',
    localhost = 'localhost',
    external = 'external'
}

type GlobalConfigurations = {
  type: ServerType;
  username: string;
  password: string;
  baseUrl: string;
  rootDir: string;
};

type LocalConfigurations = GlobalConfigurations & {
    type: ServerType.localhost;
};

type DockerConfigurations = GlobalConfigurations & {
    type: ServerType.docker;
    docker: {
        container: string;
        rootDir: string;
    }
}

type ExternalConfigurations = GlobalConfigurations & {
    type: ServerType.external;
    ssh: {
        username: string,
        address: string,
        key: string,
        rootDir: string;
    }
}

type Configurations = DockerConfigurations | LocalConfigurations | ExternalConfigurations;

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

export const getWPDir = (configurations: Configurations) => match(configurations)
    .with({type: ServerType.docker}, (selections) => selections.docker.rootDir)
    .with({type: ServerType.external}, (selections) => selections.ssh.rootDir)
    .with({type: ServerType.localhost}, (selections) => selections.rootDir)
    .exhaustive();

