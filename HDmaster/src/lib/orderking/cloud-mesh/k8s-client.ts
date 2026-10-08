import * as k8s from '@kubernetes/client-node';

export function getK8sClient() {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  return kc;
}

export function getCoreV1Api() {
  const kc = getK8sClient();
  return kc.makeApiClient(k8s.CoreV1Api);
}

export function getAppsV1Api() {
  const kc = getK8sClient();
  return kc.makeApiClient(k8s.AppsV1Api);
}

export function getCustomObjectsApi() {
  const kc = getK8sClient();
  return kc.makeApiClient(k8s.CustomObjectsApi);
}
