// @ts-nocheck
import { getCustomObjectsApi } from './k8s-client';

export async function getClusterMetrics() {
  const customObjectsApi = getCustomObjectsApi();
  
  try {
    const res = await customObjectsApi.listClusterCustomObject(
      'metrics.k8s.io',
      'v1beta1',
      'nodes'
    );
    return res.body;
  } catch (error) {
    console.error('Error fetching cluster metrics:', error);
    throw error;
  }
}

export async function getPodMetrics(namespace: string = 'default') {
    const customObjectsApi = getCustomObjectsApi();
    
    try {
      const res = await customObjectsApi.listNamespacedCustomObject(
        'metrics.k8s.io',
        'v1beta1',
        namespace,
        'pods'
      );
      return res.body;
    } catch (error) {
      console.error('Error fetching pod metrics:', error);
      throw error;
    }
}
