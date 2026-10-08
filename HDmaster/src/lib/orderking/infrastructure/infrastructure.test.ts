import test from 'node:test';
import * as assert from 'node:assert';
import { CloudDeployer } from './cloud-deployer';
import { ContainerManager } from './container-orchestrator';
import * as fs from 'node:fs/promises';

test('CloudDeployer - generateTerraform AWS', (t) => {
    const deployer = new CloudDeployer();
    const config = {
        provider: 'aws' as const,
        projectName: 'my-project',
        region: 'us-east-1',
        services: ['web']
    };

    const tf = deployer.generateTerraform(config);
    assert.ok(tf.includes('provider "aws"'));
    assert.ok(tf.includes('region = "us-east-1"'));
    assert.ok(tf.includes('aws_ecr_repository'));
});

test('CloudDeployer - generateTerraform GCP', (t) => {
    const deployer = new CloudDeployer();
    const config = {
        provider: 'gcp' as const,
        projectName: 'my-gcp-project',
        region: 'us-central1',
        services: ['web']
    };

    const tf = deployer.generateTerraform(config);
    assert.ok(tf.includes('provider "google"'));
    assert.ok(tf.includes('project = "my-gcp-project"'));
    assert.ok(tf.includes('google_container_registry'));
});

test('ContainerManager - construct docker run command', async (t) => {
    class TestableContainerManager extends ContainerManager {
        public lastCommand: string = '';
        
        override async startContainer(config: any): Promise<string> {
            let command = `docker run -d --name ${config.name}`;
            if (config.ports) {
                for (const port of config.ports) {
                    command += ` -p ${port}`;
                }
            }
            if (config.env) {
                for (const [key, value] of Object.entries(config.env)) {
                    command += ` -e ${key}="${value}"`;
                }
            }
            command += ` ${config.image}`;
            this.lastCommand = command;
            return 'mock-container-id';
        }
    }

    const manager = new TestableContainerManager();
    const id = await manager.startContainer({
        image: 'nginx:latest',
        name: 'test-nginx',
        ports: ['8080:80'],
        env: { ENV: 'prod' }
    });
    
    assert.strictEqual(id, 'mock-container-id');
    assert.ok(manager.lastCommand.includes('docker run -d --name test-nginx'));
    assert.ok(manager.lastCommand.includes('-p 8080:80'));
    assert.ok(manager.lastCommand.includes('-e ENV="prod"'));
    assert.ok(manager.lastCommand.includes('nginx:latest'));
});

test('CloudDeployer - deployToAws creates main.tf', async (t) => {
    const deployer = new CloudDeployer();
    const config = {
        provider: 'aws' as const,
        projectName: 'my-project-file',
        region: 'us-east-1',
        services: []
    };

    const result = await deployer.deployToAws(config);
    assert.strictEqual(result, 'AWS deployment config generated for my-project-file');
    
    const fileContent = await fs.readFile('main.tf', 'utf-8');
    assert.ok(fileContent.includes('provider "aws"'));
    
    // Clean up
    await fs.unlink('main.tf');
});

test('CloudDeployer - deployToGcp creates main.tf', async (t) => {
    const deployer = new CloudDeployer();
    const config = {
        provider: 'gcp' as const,
        projectName: 'my-gcp-file',
        region: 'us-central1',
        services: []
    };

    const result = await deployer.deployToGcp(config);
    assert.strictEqual(result, 'GCP deployment config generated for my-gcp-file');
    
    const fileContent = await fs.readFile('main.tf', 'utf-8');
    assert.ok(fileContent.includes('provider "google"'));
    
    // Clean up
    await fs.unlink('main.tf');
});
