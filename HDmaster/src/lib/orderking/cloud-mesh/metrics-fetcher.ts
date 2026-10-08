import fetch from 'node-fetch';

export async function getClusterMetrics() {
  const K8S_URL = process.env.K8S_CLUSTER_URL || 'http://localhost:8080';
  const K8S_TOKEN = process.env.K8S_TOKEN || '';

  try {
    const res = await fetch(`${K8S_URL}/apis/metrics.k8s.io/v1beta1/pods`, {
      headers: {
        'Authorization': `Bearer ${K8S_TOKEN}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return null;
  }
}
