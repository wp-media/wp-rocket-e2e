import {WP_DOCKER, WP_ROOT_DIR, WP_DOCKER_CONTAINER} from "../config/wp.config";

import { exec } from "shelljs";
function wrap_prefix(command: string) {
    if(WP_DOCKER) {
        return `docker-compose exec -T ${WP_DOCKER_CONTAINER} ${command}`;
    }
    return command;
}

async function wp(args: string) {
    const root = WP_DOCKER ? ' --allow-root': '';
    const command = wrap_prefix(`wp ${args}${root}`);
    const output = exec(command, {
        cwd: WP_ROOT_DIR,
        async: false
    });
    return output.stdout.trim();
}

export default wp;