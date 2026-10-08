import test from 'node:test';
import assert from 'node:assert';
import { DeviceRegistry } from './device-registry';
import { IoTBroker } from './mqtt-broker';
import { EdgeStateSync } from './edge-sync';

test('IoT & Edge Device Broker Subsystem', async (t) => {

  await t.test('DeviceRegistry - should register and validate devices', () => {
    const registry = new DeviceRegistry();
    const pubKey = 'mock-public-key-123';
    
    const device = registry.registerDevice('robot', pubKey);
    assert.strictEqual(device.type, 'robot');
    assert.ok(device.credentials.certificate);
    
    const isValid = registry.validateCredentials(device.id, device.credentials.certificate);
    assert.strictEqual(isValid, true);
    
    const isInvalid = registry.validateCredentials(device.id, 'wrong-cert');
    assert.strictEqual(isInvalid, false);
    
    registry.updateStatus(device.id, true, { battery: 85 });
    const updated = registry.getDevice(device.id);
    assert.strictEqual(updated?.status.connected, true);
    assert.strictEqual(updated?.status.metadata?.battery, 85);
  });

  await t.test('IoTBroker - should handle pub/sub with exact topic', async () => {
    const broker = new IoTBroker();
    let receivedPayload: any = null;
    
    const promise = new Promise<void>((resolve) => {
      broker.subscribe('client1', 'orderking/robot/1/telemetry', (msg) => {
        receivedPayload = msg.payload;
        resolve();
      });
    });
    
    broker.publish('orderking/robot/1/telemetry', { temp: 42 });
    await promise;
    
    assert.deepStrictEqual(receivedPayload, { temp: 42 });
  });

  await t.test('IoTBroker - should handle pub/sub with single level wildcard (+)', async () => {
    const broker = new IoTBroker();
    let receivedCount = 0;
    
    const promise = new Promise<void>((resolve) => {
      broker.subscribe('client2', 'orderking/robot/+/telemetry', (msg) => {
        receivedCount++;
        if (receivedCount === 2) resolve();
      });
    });
    
    broker.publish('orderking/robot/1/telemetry', { temp: 42 });
    broker.publish('orderking/robot/2/telemetry', { temp: 45 });
    broker.publish('orderking/kitchen/1/telemetry', { temp: 100 }); // Should not match
    
    await promise;
    
    assert.strictEqual(receivedCount, 2);
  });

  await t.test('IoTBroker - should handle pub/sub with multi level wildcard (#)', async () => {
    const broker = new IoTBroker();
    let receivedCount = 0;
    
    const promise = new Promise<void>((resolve) => {
      broker.subscribe('client3', 'orderking/#', (msg) => {
        receivedCount++;
        if (receivedCount === 3) resolve();
      });
    });
    
    broker.publish('orderking/robot/1/telemetry', { temp: 42 });
    broker.publish('orderking/kitchen/2/status', { active: true });
    broker.publish('orderking/system/alerts/critical', { msg: 'fire' });
    broker.publish('other/system', { msg: 'ignore' }); // Should not match
    
    await promise;
    
    assert.strictEqual(receivedCount, 3);
  });

  await t.test('EdgeStateSync - should handle sync up and push down', async () => {
    const broker = new IoTBroker();
    const sync = new EdgeStateSync(broker);
    
    const edgeNodeId = 'edge-100';
    let ackVersion = 0;
    
    const promiseAck = new Promise<void>((resolve) => {
      broker.subscribe('edge-client', `edge/${edgeNodeId}/sync/ack`, (msg) => {
        ackVersion = msg.payload.version;
        resolve();
      });
    });
    
    // Simulate Edge syncing up
    broker.publish(`edge/${edgeNodeId}/sync/up`, {
      edgeNodeId,
      version: 1,
      state: { ordersProcessed: 10 },
      timestamp: Date.now()
    });
    
    await promiseAck;
    assert.strictEqual(ackVersion, 1);
    
    const serverState = sync.getEdgeState(edgeNodeId);
    assert.strictEqual(serverState?.state.ordersProcessed, 10);
    
    // Test Server pushing state down
    let downPayload: any = null;
    const promiseDown = new Promise<void>((resolve) => {
      broker.subscribe('edge-client-2', `edge/${edgeNodeId}/sync/down`, (msg) => {
        downPayload = msg.payload;
        resolve();
      });
    });
    
    sync.pushStateDown(edgeNodeId, { maxCapacity: 50 });
    
    await promiseDown;
    assert.strictEqual(downPayload.version, 2);
    assert.strictEqual(downPayload.state.maxCapacity, 50);
    assert.strictEqual(downPayload.state.ordersProcessed, 10);
  });
});
