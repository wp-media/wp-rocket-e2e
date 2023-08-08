import {exec} from "shelljs";
import {configurations, ServerType} from "./configurations";

function wrap_prefix(command: string) {
    if(configurations.type === ServerType.Docker) {
        return `docker-compose exec -T ${configurations.docker.container} ${command}`;
    }
    if(configurations.type === ServerType.External) {
        return `ssh ${configurations.ssh.username}@${configurations.ssh.address} -i ${configurations.ssh.key} ${command}`;
    }
    return command;
}

async function wp(args: string) {
    const root = configurations.type === ServerType.Docker ? ' --allow-root': '';
    const cwd = configurations.type === ServerType.Docker ? configurations.docker.rootDir: configurations.rootDir;
    const command = wrap_prefix(`wp ${args}${root}`);
    const output = exec(command, {
        cwd: cwd,
        async: false
    });
    return output.stdout.trim();
}

export function resetWP(): void {
    wp('db reset --yes');
    wp(`core install --url=${configurations.baseUrl} --title="test" --admin_user=${configurations.username} --admin_password=${configurations.password} --admin_email="admin@test.com" --skip-email`);
}

export async function cp(origin: string, destination: string) {
    if(configurations.type === ServerType.Docker) {
        await exec(`docker cp ${origin} $(docker-compose ps -q wp):${destination}`, {
            cwd: configurations.docker.rootDir,
            async: false
        });
        return;
    }

    if(configurations.type === ServerType.External) {
        await exec(`scp -i ${configurations.ssh.key} ${origin} ${configurations.ssh.username}@${configurations.ssh.address}:${destination}`);
        return;
    }

    exec(`cp ${origin} ${destination}`, {
        cwd: configurations.rootDir,
        async: false
    });
}

export async function rm(destination: string) {
    const cwd = configurations.type === ServerType.Docker ? configurations.docker.rootDir: configurations.rootDir;
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

export async function generateUsers(users: Array<{email: string, role: string}>) {
    users.map(async user => {
        await wp(`user create ${user.role} ${user.email} --role=${user.role} --user_pass=password`)
    })
}

export default wp;