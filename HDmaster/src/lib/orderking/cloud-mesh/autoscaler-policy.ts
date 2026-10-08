import fetch from 'node-fetch';

export async function scaleDeployment(namespace: string, deployment: string, replicas: number) {
  const K8S_URL = process.env.K8S_CLUSTER_URL || 'http://localhost:8080';
  const K8S_TOKEN = process.env.K8S_TOKEN || '';

  const res = await fetch(`${K8S_URL}/apis/apps/v1/namespaces/${namespace}/deployments/${deployment}/scale`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${K8S_TOKEN}`,
      'Content-Type': 'application/strategic-merge-patch+json'
    },
    body: JSON.stringify({ spec: { replicas } })
  });

  if (!res.ok) {
    throw new Error('Failed to scale deployment');
  }
}
