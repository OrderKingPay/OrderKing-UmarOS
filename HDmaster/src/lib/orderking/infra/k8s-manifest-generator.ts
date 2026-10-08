import * as fs from 'fs';
import * as path from 'path';

export function generateK8sDeployment(containerImage: string, replicas: number): string {
    // Attempt to read package.json for name and version
    // We try to find package.json starting from the current working directory
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    
    let name = 'umar-os-app';
    let version = 'latest';
    
    try {
        if (fs.existsSync(packageJsonPath)) {
            const packageJsonData = fs.readFileSync(packageJsonPath, 'utf8');
            const packageJson = JSON.parse(packageJsonData);
            if (packageJson.name) {
                name = packageJson.name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase(); // ensure valid k8s name
            }
            if (packageJson.version) {
                version = packageJson.version;
            }
        }
    } catch (err) {
        console.warn('Could not read package.json, using fallback values.', err);
    }

    const yamlManifest = `---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}-deployment
  labels:
    app: ${name}
    version: "${version}"
  annotations:
    autoscaling.alpha.kubernetes.io/metrics: '[{"type":"Resource","resource":{"name":"cpu","targetAverageUtilization":70}}]'
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
        app: ${name}
        version: "${version}"
    spec:
      containers:
        - name: ${name}-container
          image: ${containerImage}
          ports:
            - containerPort: 8080
          livenessProbe:
            httpGet:
              path: /api/health
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
          readinessProbe:
            httpGet:
              path: /api/health
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: ${name}-svc
  labels:
    app: ${name}
    version: "${version}"
spec:
  type: ClusterIP
  selector:
    app: ${name}
  ports:
    - port: 80
      targetPort: 8080
      protocol: TCP
`;

    return yamlManifest;
}
