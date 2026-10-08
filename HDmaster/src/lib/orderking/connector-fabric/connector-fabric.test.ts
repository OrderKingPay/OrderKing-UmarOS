import test from 'node:test';
import assert from 'node:assert';
import { ConnectorRegistry } from './registry';
import { HealthMonitor } from './health-monitor';
import { generateConnectorFromOpenAPI } from './connector-factory';
import http from 'node:http';

test('ConnectorRegistry', async (t) => {
  await t.test('register connector', () => {
    const registry = new ConnectorRegistry();
    const config = registry.register({
      id: 'test-conn-1',
      name: 'Test Connector',
      type: 'API',
      capabilities: ['test'],
      version: '1.0.0'
    });
    
    assert.strictEqual(config.id, 'test-conn-1');
    assert.strictEqual(config.healthStatus, 'UNKNOWN');
    assert.ok(config.createdAt instanceof Date);
    
    const retrieved = registry.getConnector('test-conn-1');
    assert.deepStrictEqual(retrieved, config);
  });

  await t.test('unregister connector', () => {
    const registry = new ConnectorRegistry();
    registry.register({
      id: 'test-conn-1',
      name: 'Test Connector',
      type: 'API',
      capabilities: ['test'],
      version: '1.0.0'
    });
    registry.unregister('test-conn-1');
    assert.strictEqual(registry.getConnector('test-conn-1'), undefined);
  });

  await t.test('discover connectors', () => {
    const registry = new ConnectorRegistry();
    registry.register({
      id: 'test-conn-1',
      name: 'Test 1',
      type: 'API',
      capabilities: [],
      version: '1.0.0'
    });
    registry.register({
      id: 'test-conn-2',
      name: 'Test 2',
      type: 'WEBHOOK',
      capabilities: [],
      version: '2.0.0'
    });

    const results = registry.discover({ type: 'WEBHOOK' });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, 'test-conn-2');
  });
});

test('HealthMonitor', async (t) => {
  let serverReqCount = 0;
  const server = http.createServer((req, res) => {
    serverReqCount++;
    if (req.url === '/healthy') {
      res.writeHead(200);
      res.end('OK');
    } else if (req.url === '/degraded') {
      res.writeHead(400);
      res.end('Bad Request');
    } else if (req.url === '/unhealthy') {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;

  const registry = new ConnectorRegistry();
  registry.register({ id: 'c-healthy', name: 'Healthy', type: 'API', endpoint: `${baseUrl}/healthy`, capabilities: [], version: '1' });
  registry.register({ id: 'c-degraded', name: 'Degraded', type: 'API', endpoint: `${baseUrl}/degraded`, capabilities: [], version: '1' });
  registry.register({ id: 'c-unhealthy', name: 'Unhealthy', type: 'API', endpoint: `${baseUrl}/unhealthy`, capabilities: [], version: '1' });
  registry.register({ id: 'c-timeout', name: 'Timeout', type: 'API', endpoint: `http://localhost:${port + 1}/timeout`, capabilities: [], version: '1' });
  registry.register({ id: 'c-no-endpoint', name: 'No Endpoint', type: 'API', capabilities: [], version: '1' });
  
  const monitor = new HealthMonitor(registry);

  await t.test('healthy endpoint', async () => {
    const status = await monitor.checkHealth('c-healthy');
    assert.strictEqual(status, 'HEALTHY');
    assert.strictEqual(registry.getConnector('c-healthy')?.healthStatus, 'HEALTHY');
  });

  await t.test('degraded endpoint', async () => {
    const status = await monitor.checkHealth('c-degraded');
    assert.strictEqual(status, 'DEGRADED');
  });

  await t.test('unhealthy endpoint', async () => {
    const status = await monitor.checkHealth('c-unhealthy');
    assert.strictEqual(status, 'UNHEALTHY');
  });

  await t.test('timeout endpoint', async () => {
    const status = await monitor.checkHealth('c-timeout', 100);
    assert.strictEqual(status, 'UNHEALTHY');
  });

  await t.test('no endpoint', async () => {
    const status = await monitor.checkHealth('c-no-endpoint');
    assert.strictEqual(status, 'UNKNOWN');
  });

  server.close();
});

test('generateConnectorFromOpenAPI', async (t) => {
  const mockSpec = {
    openapi: '3.0.0',
    info: { title: 'Mock API', version: '2.1.0' },
    servers: [{ url: 'https://api.mock.com/v1' }],
    paths: {
      '/users': {
        get: { operationId: 'getUsers' },
        post: { summary: 'Create user' }
      }
    }
  };

  const server = http.createServer((req, res) => {
    if (req.url === '/openapi.json') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockSpec));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const port = (server.address() as any).port;
  const specUrl = `http://localhost:${port}/openapi.json`;

  await t.test('fetches and parses openapi spec', async () => {
    const config = await generateConnectorFromOpenAPI(specUrl, 'mock-connector');
    
    assert.strictEqual(config.id, 'mock-connector');
    assert.strictEqual(config.name, 'Mock API');
    assert.strictEqual(config.version, '2.1.0');
    assert.strictEqual(config.type, 'OPENAPI');
    assert.strictEqual(config.endpoint, 'https://api.mock.com/v1');
    assert.deepStrictEqual(config.capabilities, ['getUsers', 'POST /users']);
  });

  server.close();
});
