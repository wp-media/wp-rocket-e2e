import {exec} from "shelljs";
import {configurations, getWPDir, ServerType} from "./configurations";

const {NodeSSH} = require('node-ssh')
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

export async function resetWP(): Promise<void> {
    await wp('db reset --yes');
    await wp(`core install --url=${configurations.baseUrl} --title="test" --admin_user="${configurations.username}" --admin_password="${configurations.password}" --admin_email="admin@test.com" --skip-email`);

}

export async function cp(origin: string, destination: string): Promise<void> {
    if(configurations.type === ServerType.docker) {
        await exec(`docker cp ${origin} $(docker-compose ps -q ${configurations.docker.container}):${destination}`, {
            cwd: configurations.rootDir,
            async: false
        });

        return;
    }

    if(configurations.type === ServerType.external) {
        await exec(`zip -q -r ../rocket.zip .`, {
            cwd: origin
        })
        await exec(wrapPrefix(`mkdir -p ${destination}`))
        await exec(`scp -r -i ${configurations.ssh.key} ${origin}/../rocket.zip ${configurations.ssh.username}@${configurations.ssh.address}:${destination}/..`);
        await exec(wrapPrefix(`unzip -q -o ${destination}/../rocket.zip -d ${destination}`))
        await rm(`${destination}/../rocket.zip`)
        return;
    }

    exec(`cp ${origin} ${destination}`, {
        cwd: configurations.rootDir,
        async: false
    });
}

export async function rm(destination: string): Promise<void> {
    const cwd = configurations.rootDir;
    const command = wrapPrefix(`rm -rf ${destination}`);
    await exec(command, {
        cwd: cwd,
        async: false
    });
}



export async function activatePlugin(name: string): Promise<void>  {
     await wp(`plugin activate ${name}`)
}

export async function deactivatePlugin(name: string): Promise<void> {
    await wp(`plugin deactivate ${name}`)
}

export async function setOption(name:string, value: string): Promise<void> {
    await wp(`option update ${name} ${value}`)
}

export async function deleteOption(name: string): Promise<void> {
    await wp(`option delete ${name}`)
}

export async function setTransient(name:string, value: string): Promise<void> {
    await wp(`transient set ${name} ${value}`)
}

export async function deleteTransient(name: string): Promise<void> {
    await wp(`transient delete ${name}`)
}

export async function generateUsers(users: Array<{name: string, email: string, role: string}>): Promise<void> {
    users.map(async user => {
        await wp(`user create ${user.name} ${user.email} --role=${user.role} --user_pass=password`)
    })
}

export default wp;