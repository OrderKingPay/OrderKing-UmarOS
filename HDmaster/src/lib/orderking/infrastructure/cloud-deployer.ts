import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';

const execAsync = promisify(exec);

export interface DeploymentConfig {
    provider: 'aws' | 'gcp';
    projectName: string;
    region: string;
    services: string[];
}

export class CloudDeployer {
    async deployToAws(config: DeploymentConfig): Promise<string> {
        try {
            const tfConfig = this.generateTerraform(config);
            await fs.writeFile('main.tf', tfConfig, 'utf-8');
            return `AWS deployment config generated for ${config.projectName}`;
        } catch (error: any) {
            throw new Error(`AWS Deployment failed: ${error.message}`);
        }
    }

    async deployToGcp(config: DeploymentConfig): Promise<string> {
        try {
            const tfConfig = this.generateTerraform(config);
            await fs.writeFile('main.tf', tfConfig, 'utf-8');
            return `GCP deployment config generated for ${config.projectName}`;
        } catch (error: any) {
            throw new Error(`GCP Deployment failed: ${error.message}`);
        }
    }

    generateTerraform(config: DeploymentConfig): string {
        if (config.provider === 'aws') {
            return `
provider "aws" {
  region = "${config.region}"
}

resource "aws_ecr_repository" "repo" {
  name = "${config.projectName}-repo"
}
`.trim();
        } else {
            return `
provider "google" {
  project = "${config.projectName}"
  region  = "${config.region}"
}

resource "google_container_registry" "registry" {
  project = "${config.projectName}"
}
`.trim();
        }
    }

    async executeCommand(command: string): Promise<string> {
        const { stdout, stderr } = await execAsync(command);
        if (stderr) {
            console.warn(`Command stderr: ${stderr}`);
        }
        return stdout.trim();
    }
}
