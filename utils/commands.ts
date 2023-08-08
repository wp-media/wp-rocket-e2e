import {exec} from "shelljs";
import {configurations, ServerType} from "./configurations";

function wrapPrefix(command: string): string {
    if(configurations.type === ServerType.docker) {
        return `docker-compose exec -T ${configurations.docker.container} ${command}`;
    }
    if(configurations.type === ServerType.external) {
        return `ssh ${configurations.ssh.username}@${configurations.ssh.address} -i ${configurations.ssh.key} ${command}`;
    }
    return command;
}

async function wp(args: string): Promise<void> {
    const root = configurations.type === ServerType.docker ? ' --allow-root': '';
    const cwd = configurations.type === ServerType.docker ? configurations.docker.rootDir: configurations.rootDir;
    const command = wrapPrefix(`wp ${args}${root}`);
    exec(command, {
        cwd: cwd,
        async: false
    });
}

export function resetWP(): void {
    wp('db reset --yes');
    wp(`core install --url=${configurations.baseUrl} --title="test" --admin_user=${configurations.username} --admin_password=${configurations.password} --admin_email="admin@test.com" --skip-email`);
}

export async function cp(origin: string, destination: string): Promise<void> {
    if(configurations.type === ServerType.docker) {
        await exec(`docker cp ${origin} $(docker-compose ps -q wp):${destination}`, {
            cwd: configurations.docker.rootDir,
            async: false
        });
        return;
    }

    if(configurations.type === ServerType.external) {
        await exec(`scp -i ${configurations.ssh.key} ${origin} ${configurations.ssh.username}@${configurations.ssh.address}:${destination}`);
        return;
    }

    exec(`cp ${origin} ${destination}`, {
        cwd: configurations.rootDir,
        async: false
    });
}

export async function rm(destination: string): Promise<void> {
    const cwd = configurations.type === ServerType.docker ? configurations.docker.rootDir: configurations.rootDir;
    const command = wrapPrefix(`rm -rf ${destination}`);
    exec(command, {
        cwd: cwd,
        async: false
    });
}



export async function activatePlugin(name: string): Promise<void>  {
    wp(`plugin activate ${name}`)
}

export async function deactivatePlugin(name: string): Promise<void> {
    wp(`plugin deactivate ${name}`)
}

export async function setTransient(name:string, value: string): Promise<void> {
    wp( `transient set ${name} ${value}`)
}

export async function deleteTransient(name: string): Promise<void> {
    wp(`transient delete ${name}`)
}

export async function generateUsers(users: Array<{email: string, role: string}>): Promise<void> {
    users.map(async user => {
        await wp(`user create ${user.role} ${user.email} --role=${user.role} --user_pass=password`)
    })
}

export default wp;