/**
 * @fileoverview
 * This module provides functions for interacting with a WordPress instance using WP-CLI commands and server-specific prefixes.
 * It includes functions for resetting WordPress, copying files, unzipping files, removing files/directories, activating/deactivating plugins,
 * updating/deleting options and transients, and generating users.
 *
 * @requires {@link shelljs}
 * @requires {@link ./configurations}
 * @requires {@link node-ssh}
 */
import {exec} from "shelljs";
import {configurations, getWPDir, ServerType} from "./configurations";

const {NodeSSH} = require('node-ssh')

/**
 * Wraps a command with the appropriate prefix based on the server type.
 *
 * @param {string} command - The command to be wrapped.
 * @returns {string} - The wrapped command.
 */
function wrapPrefix(command: string): string {
    if(configurations.type === ServerType.docker) {
        return `docker-compose exec -T ${configurations.docker.container} ${command}`;
    }
    if(configurations.type === ServerType.external) {
        return `ssh ${configurations.ssh.username}@${configurations.ssh.address} -i ${configurations.ssh.key} ${command}`
            .replaceAll('"', '"\\"')
            .replaceAll('}', '\\}')
            .replaceAll('{', '\\{')
            .replaceAll(',', '\\,');
    }
    return command;
}

/**
 * Executes a WP-CLI command on the specified WordPress instance.
 *
 * @function
 * @name wp
 * @async
 * @param {string} args - Arguments to be passed to the WP-CLI command.
 * @returns {Promise<void>} - A Promise that resolves when the command is executed.
 */
async function wp(args: string): Promise<void> {
    const root = configurations.type === ServerType.docker ? ' --allow-root': '';
    const cwd = getWPDir(configurations);

    if(configurations.type === ServerType.external) {
        const client = new NodeSSH();
        await client.connect({
            host: configurations.ssh.address,
            username: configurations.ssh.username,
            privateKeyPath: configurations.ssh.key
        })
        const res = await client.execCommand(`wp ${args}${root} --path=${cwd}`);
        return ;
    }
    const command = wrapPrefix(`wp ${args}${root} --path=${cwd}`);

    await exec(command, {
        cwd: configurations.rootDir,
        async: false
    });

   }

/**
 * Resets the WordPress instance by performing a database reset and reinstallation.
 *
 * @function
 * @name resetWP
 * @async
 * @returns {Promise<void>} - A Promise that resolves when the reset is completed.
 */
export async function resetWP(): Promise<void> {
    await wp('db reset --yes');
    await wp(`core install --url=${configurations.baseUrl} --title="test" --admin_user="${configurations.username}" --admin_password="${configurations.password}" --admin_email="admin@test.com" --skip-email`);

}

/**
 * Copies files from the origin to the destination on the server.
 *
 * @function
 * @name cp
 * @async
 * @param {string} origin - The path of the source files.
 * @param {string} destination - The destination path on the server.
 * @returns {Promise<void>} - A Promise that resolves when the copy operation is completed.
 */
export async function cp(origin: string, destination: string): Promise<void> {
    if(configurations.type === ServerType.docker) {
        await exec(`docker cp ${origin} $(docker-compose ps -q ${configurations.docker.container}):${destination}`, {
            cwd: configurations.rootDir,
            async: false
        });

        return;
    }

    if(configurations.type === ServerType.external) {
        await exec(`scp -r -i ${configurations.ssh.key} ${origin} ${configurations.ssh.username}@${configurations.ssh.address}:${destination}`);
        return;
    }

    exec(`cp ${origin} ${destination}`, {
        cwd: configurations.rootDir,
        async: false
    });
}

/**
 * Unzips a compressed file to the specified destination on the server.
 *
 * @function
 * @name unzip
 * @async
 * @param {string} file - The path to the compressed file.
 * @param {string} destination - The destination path for the unzip operation.
 * @returns {Promise<void>} - A Promise that resolves when the unzip operation is completed.
 */
export async function unzip(file: string, destination: string): Promise<void> {
    const cwd = configurations.rootDir;
    const command = wrapPrefix(`unzip ${file} -q -d ${destination}`);
    await exec(command, {
        cwd: cwd,
        async: false
    });
}

/**
 * Removes a file or directory from the server.
 *
 * @function
 * @name rm
 * @async
 * @param {string} destination - The path to the file or directory to be removed.
 * @returns {Promise<void>} - A Promise that resolves when the removal is completed.
 */
export async function rm(destination: string): Promise<void> {
    const cwd = configurations.rootDir;
    const command = wrapPrefix(`rm -rf ${destination}`);
    await exec(command, {
        cwd: cwd,
        async: false
    });
}


/**
 * Activates a WordPress plugin using the WP-CLI command.
 *
 * @function
 * @name activatePlugin
 * @async
 * @param {string} name - The name of the plugin to be activated.
 * @returns {Promise<void>} - A Promise that resolves when the activation is completed.
 */
export async function activatePlugin(name: string): Promise<void>  {
     await wp(`plugin activate ${name}`)
}

/**
 * Deactivates a WordPress plugin using the WP-CLI command.
 *
 * @function
 * @name deactivatePlugin
 * @async
 * @param {string} name - The name of the plugin to be deactivated.
 * @returns {Promise<void>} - A Promise that resolves when the deactivation is completed.
 */
export async function deactivatePlugin(name: string): Promise<void> {
    await wp(`plugin deactivate ${name}`)
}

/**
 * Sets a WordPress option to the specified value using the WP-CLI command.
 *
 * @function
 * @name setOption
 * @async
 * @param {string} name - The name of the option.
 * @param {string} value - The value to be set for the option.
 * @returns {Promise<void>} - A Promise that resolves when the option is updated.
 */
export async function setOption(name:string, value: string): Promise<void> {
    await wp(`option update ${name} ${value}`)
}

/**
 * Deletes a WordPress option using the WP-CLI command.
 *
 * @function
 * @name deleteOption
 * @async
 * @param {string} name - The name of the option to be deleted.
 * @returns {Promise<void>} - A Promise that resolves when the option is deleted.
 */
export async function deleteOption(name: string): Promise<void> {
    await wp(`option delete ${name}`)
}

/**
 * Deletes a WordPress option using the WP-CLI command.
 *
 * @function
 * @name deleteOption
 * @async
 * @param {string} name - The name of the option to be deleted.
 * @returns {Promise<void>} - A Promise that resolves when the option is deleted.
 */
export async function setTransient(name:string, value: string): Promise<void> {
    await wp(`transient set ${name} ${value}`)
}

/**
 * Deletes a WordPress transient using the WP-CLI command.
 *
 * @function
 * @name deleteTransient
 * @async
 * @param {string} name - The name of the transient to be deleted.
 * @returns {Promise<void>} - A Promise that resolves when the transient is deleted.
 */
export async function deleteTransient(name: string): Promise<void> {
    await wp(`transient delete ${name}`)
}

/**
 * Generates WordPress user accounts using the WP-CLI command.
 *
 * @function
 * @name generateUsers
 * @async
 * @param {Array<{name: string, email: string, role: string}>} users - An array of user objects with name, email, and role.
 * @returns {Promise<void>} - A Promise that resolves when the user accounts are created.
 */
export async function generateUsers(users: Array<{name: string, email: string, role: string}>): Promise<void> {
    users.map(async user => {
        await wp(`user create ${user.name} ${user.email} --role=${user.role} --user_pass=password`)
    })
}

export default wp;