import {
    WP_DOCKER,
    WP_ROOT_DIR,
    WP_DOCKER_CONTAINER,
    WP_ADMIN_USER,
    WP_BASE_URL,
    WP_DOCKER_ROOT_DIR
} from "../config/wp.config";

import { exec } from "shelljs";
import * as stream from "stream";
function wrap_prefix(command: string) {
    if(WP_DOCKER) {
        return `docker-compose exec -T ${WP_DOCKER_CONTAINER} ${command}`;
    }
    return command;
}

async function wp(args: string) {
    const root = WP_DOCKER ? ' --allow-root': '';
    const cwd = WP_DOCKER ? WP_DOCKER_ROOT_DIR: WP_ROOT_DIR;
    const command = wrap_prefix(`wp ${args}${root}`);
    const output = exec(command, {
        cwd: cwd,
        async: false
    });
    return output.stdout.trim();
}

export function resetWP(): void {
    wp('db reset --yes');
    wp(`core install --url=${WP_BASE_URL} --title="test" --admin_user=${WP_ADMIN_USER.username} --admin_password=${WP_ADMIN_USER.password} --admin_email="admin@test.com" --skip-email`);
}

export async function cp(origin: string, destination: string) {
    if(WP_DOCKER) {
        await exec(`docker cp ${origin} $(docker-compose ps -q wp):${destination}`, {
            cwd: WP_DOCKER_ROOT_DIR,
            async: false
        });
        return;
    }
    exec(`cp ${origin} ${destination}`, {
        cwd: WP_ROOT_DIR,
        async: false
    });
}

export async function rm(destination: string) {
    const cwd = WP_DOCKER ? WP_DOCKER_ROOT_DIR: WP_ROOT_DIR;
    const command = wrap_prefix(`rm -rf ${destination}`);
    const output = exec(command, {
        cwd: cwd,
        async: false
    });
    return output.stdout.trim();
}



export async function activatePlugin(name: string)  {
    wp(`plugin activate ${name}`)
}

export async function deactivatePlugin(name: string) {
    wp(`plugin deactivate ${name}`)
}

export async function setTransient(name:string, value: string) {
    wp( `transient set ${name} ${value}`)
}

export async function deleteTransient(name: string) {
    wp(`transient delete ${name}`)
}

export async function generateUsers(users: Array<{name: string,email: string, role: string}>) {
    users.map(async user => {
        await wp(`user create ${user.name} ${user.email} --role=${user.role} --user_pass=password`)
    })
}

export default wp;