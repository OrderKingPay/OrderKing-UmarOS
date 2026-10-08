// @ts-nocheck
import { getAppsV1Api } from './k8s-client';
import * as k8s from '@kubernetes/client-node';

export async function scaleDeployment(namespace: string, deploymentName: string, replicas: number) {
  const appsV1Api = getAppsV1Api();
  
  try {
    const patch = [
      {
        op: 'replace',
        path: '/spec/replicas',
        value: replicas,
      },
    ];
    const options = { "headers": { "Content-type": k8s.PatchUtils.PATCH_FORMAT_JSON_PATCH}};
    
    const res = await appsV1Api.patchNamespacedDeploymentScale(
      deploymentName,
      namespace,
      patch,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      options
    );
    
    return res.body;
  } catch (error) {
    console.error('Error scaling deployment:', error);
    throw error;
  }
}

export async function evaluateAndScale(namespace: string, deploymentName: string, currentCpuUsagePercent: number, currentReplicas: number) {
    if (currentCpuUsagePercent > 80) {
        console.log(`CPU usage is ${currentCpuUsagePercent}%. Scaling up...`);
        return await scaleDeployment(namespace, deploymentName, currentReplicas + 1);
    }
    return null;
}
