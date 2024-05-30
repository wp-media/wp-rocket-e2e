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
 * Renames a file on the host.
 *
 * @function
 * @name rename
 * @async
 * @param {string} oldName - The current name of the file.
 * @param {string} newName - The new name for the file.
 * @returns {Promise<void>} - A Promise that resolves when the rename operation is completed.
 */
export async function rename(oldName: string, newName: string): Promise<void> {
    if(configurations.type === ServerType.docker) {
        await exec(`docker exec -T ${configurations.docker.container} mv ${oldName} ${newName}`, {
            cwd: configurations.rootDir,
            async: false
        });

        return;
    }

    if(configurations.type === ServerType.external) {
        await exec(`ssh -i ${configurations.ssh.key} ${configurations.ssh.username}@${configurations.ssh.address} "sudo mv ${oldName} ${newName}"`);
        return;
    }

    exec(`sudo mv ${oldName} ${newName}`, {
        cwd: configurations.rootDir,
        async: false
    });
}

/**
 * Checks if a file exists on the server.
 *
 * @function
 * @name exists
 * @async
 * @param {string} filePath - The path of the file to check.
 * @returns {Promise<boolean>} - A Promise that resolves with true if the file exists, false otherwise.
 */
export async function exists(filePath: string): Promise<boolean> {
    let command: string;

    if(configurations.type === ServerType.docker) {
        command = `docker exec -T ${configurations.docker.container} test -f ${filePath}; echo $?`;
    } else if(configurations.type === ServerType.external) {
        command = `ssh -i ${configurations.ssh.key} ${configurations.ssh.username}@${configurations.ssh.address} 'test -f ${filePath}; echo $?'`;
    } else {
        command = `test -f ${filePath}; echo $?`;
    }

    try {
        const result = await exec(command, {
            cwd: configurations.rootDir,
            async: false
        });
        return result.stdout.trim() === '0';
    } catch (error) {
        return false;
    }
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
    const command = wrapPrefix(`sudo rm -rf ${destination}`);
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
 * Install a WordPress plugin from a remote zip file using the WP-CLI command.
 *
 * @function
 * @name installRemotePlugin
 * @async
 * @param {string} url - The remote zip url of the plugin to be installed.
 * @returns {Promise<void>} - A Promise that resolves when the installation is completed.
 */
export async function installRemotePlugin(url: string): Promise<void>  {
    await wp(`plugin install ${url}`)
}

/**
 * Uninstalls one or more plugins.
 *
 * @function
 * @name uninstallPlugin
 * @async
 * @param {string} plugin - The plugin slug.
 * @returns {Promise<void>} - A Promise that resolves when the uninstallation is completed.
 */
export async function uninstallPlugin(plugin: string): Promise<void>  {
    await wp(`plugin uninstall --deactivate ${plugin}`);
}

/**
 * Executes a SQL query on the WordPress database using WP-CLI.
 *
 * @function
 * @name query
 * @async
 * @param {string} query - The SQL query to be executed.
 * @returns {Promise<void>} - A Promise that resolves when the query is executed.
 */
export async function query(query: string): Promise<void> {
    await wp(`db query "${query}"`)
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

/**
 * Wraps a command with the appropriate prefix for SSH.
 *
 * @param {string} command - The command to be wrapped.
 * @returns {string} - The wrapped command.
 */
function wrapSSHPrefix(command: string): string {
    const cwd = getWPDir(configurations);

    if(configurations.type === ServerType.external) {
        return `ssh ${configurations.ssh.username}@${configurations.ssh.address} -i ${configurations.ssh.key} -t "cd ${cwd} && ${command}"`;
    }
}

/**
 * Performs a sql query using wp cli.
 *
 * @param   {string}   sql  SQL Query.
 * @return  {Promise<string>}  A Promise that resolves when the query is executed.
 */
export async function dbQuery(sql: string): Promise<string> {
    sql = sql.replaceAll('"', '\\"');

    const command = wrapSSHPrefix(`wp db query '${sql}'`);
    const result = exec(command, { silent: true });

    if (result.code === 1) {
        return '';
    }

    return result.stdout;
}

/**
 * Gets the WordPress Table Prefix.
 *
 * @return  {Promise<string>}  A Promise that resolves when the query is executed.
 */
export async function getWPTablePrefix(): Promise<string> {
    const command = wrapSSHPrefix(`wp config get table_prefix`);
    const result = exec(command, { silent: true });

    if (result.code === 1) {
        return '';
    }

    let tablePrefix: string = result.stdout;
    tablePrefix = tablePrefix.replace(/\r?\n/g, "");

    return tablePrefix;
}

export default wp;