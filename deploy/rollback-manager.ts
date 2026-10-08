import * as k8s from '@kubernetes/client-node';

export async function triggerRollback(namespace: string, deploymentName: string, previousRevision: string): Promise<void> {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  
  const k8sApi = kc.makeApiClient(k8s.AppsV1Api);
  
  try {
    console.log(`Initiating rollback for ${deploymentName} in ${namespace} to revision ${previousRevision}`);
    
    // Fetch all replicasets for the deployment
    const rsList = await k8sApi.listNamespacedReplicaSet(namespace, undefined, undefined, undefined, undefined, `app=${deploymentName}`);
    
    // Find the replicaset with the matching revision annotation
    const targetRs = rsList.body.items.find(rs => 
      rs.metadata?.annotations && 
      rs.metadata.annotations['deployment.kubernetes.io/revision'] === previousRevision
    );
    
    if (!targetRs) {
      throw new Error(`Revision ${previousRevision} not found for deployment ${deploymentName}`);
    }
    
    if (targetRs.spec?.template) {
      const patch = [
        {
          op: 'replace',
          path: '/spec/template',
          value: targetRs.spec.template,
        },
      ];
      
      const options = { headers: { 'Content-type': k8s.PatchUtils.PATCH_FORMAT_JSON_PATCH } };
      await k8sApi.patchNamespacedDeployment(
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
      
      console.log(`Successfully rolled back ${deploymentName} to revision ${previousRevision}`);
    } else {
        throw new Error('Target ReplicaSet has no pod template.');
    }
  } catch (error) {
    console.error('Error during rollback:', error);
    throw error;
  }
}
