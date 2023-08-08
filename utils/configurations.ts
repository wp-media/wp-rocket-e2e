import {
    WP_ENV_TYPE,
    WP_USERNAME,
    WP_ROOT_DIR,
    WP_DOCKER_CONTAINER,
    WP_ADMIN_USER,
    WP_BASE_URL,
    WP_DOCKER_ROOT_DIR, WP_PASSWORD,
    WP_SSH_ADDRESS,
    WP_SSH_KEY,
    WP_SSH_USERNAME
} from "../config/wp.config";
import {match} from "ts-pattern";

export enum ServerType {
    Docker = 'docker',
    Local = 'localhost',
    External = 'external'
}

type GlobalConfigurations = {
  type: ServerType;
  username: string;
  password: string;
  baseUrl: string;
  rootDir: string;
};

type LocalConfigurations = GlobalConfigurations & {
    type: ServerType.Local;
};

type DockerConfigurations = GlobalConfigurations & {
    type: ServerType.Docker;
    docker: {
        container: string;
        rootDir: string;
    }
}

type ExternalConfigurations = GlobalConfigurations & {
    type: ServerType.External;
    ssh: {
        username: string,
        address: string,
        key: string,
    }
}

type Configurations = DockerConfigurations | LocalConfigurations | ExternalConfigurations;

export const configurations: Configurations = match(WP_ENV_TYPE)
    .when(ServerType.Docker, () => ({
        type: ServerType.Docker,
        username: WP_USERNAME,
        password: WP_PASSWORD,
        baseUrl: WP_BASE_URL,
        rootDir: WP_ROOT_DIR,
        docker: {
            container: WP_DOCKER_CONTAINER,
            rootDir: WP_DOCKER_ROOT_DIR,
        }
    }))
    .when(ServerType.External, () => ({
        type: ServerType.External,
        username: WP_USERNAME,
        password: WP_PASSWORD,
        baseUrl: WP_BASE_URL,
        rootDir: WP_ROOT_DIR,
        ssh: {
            username: WP_SSH_USERNAME,
            address: WP_SSH_ADDRESS,
            key: WP_SSH_KEY
        }
    }))
.otherwise(() => ({
    type: ServerType.Local,
    username: WP_USERNAME,
    password: WP_PASSWORD,
    baseUrl: WP_BASE_URL,
    rootDir: WP_ROOT_DIR,
}))