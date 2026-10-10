import test from 'node:test';
import assert from 'node:assert';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Buffer } from 'node:buffer';

import { 
  OmniChannelGateway, 
  MessageTemplateEngine, 
  MediaProcessor,
  IChannelProvider
} from './index';

test('MessageTemplateEngine - compiles template with variables', () => {
  const engine = new MessageTemplateEngine();
  engine.registerTemplate('en', 'welcome', 'Hello {{ name }}, welcome to {{ app }}!');
  engine.registerTemplate('fr', 'welcome', 'Bonjour {{ name }}, bienvenue sur {{ app }}!');

  const resultEn = engine.compile('welcome', 'en', { name: 'Alice', app: 'OrderKing' });
  assert.strictEqual(resultEn, 'Hello Alice, welcome to OrderKing!');

  const resultFr = engine.compile('welcome', 'fr', { name: 'Bob', app: 'OrderKing' });
  assert.strictEqual(resultFr, 'Bonjour Bob, bienvenue sur OrderKing!');
});

test('MessageTemplateEngine - falls back to English if locale missing', () => {
  const engine = new MessageTemplateEngine();
  engine.registerTemplate('en', 'alert', 'Alert: {{ issue }}');

  const result = engine.compile('alert', 'es', { issue: 'Fire' });
  assert.strictEqual(result, 'Alert: Fire');
});

test('OmniChannelGateway - routes high priority to all allowed channels', async () => {
  const gateway = new OmniChannelGateway();
  
  const sentMessages: { channel: string, payload: any }[] = [];
  
  const createSimulatedProvider = (type: any): IChannelProvider => ({
    type,
    send: async (payload) => {
      sentMessages.push({ channel: type, payload });
      return { channel: type, success: true, timestamp: new Date() };
    }
  });

  gateway.registerProvider(createSimulatedProvider('email'));
  gateway.registerProvider(createSimulatedProvider('sms'));
  gateway.registerProvider(createSimulatedProvider('push'));
  gateway.registerProvider(createSimulatedProvider('voice'));

  const results = await gateway.route(
    { to: 'user1', body: 'Emergency!', priority: 'high' },
    { preferredChannels: ['sms'], optedOut: ['voice'] }
  );

  assert.strictEqual(results.length, 3);
  const channels = results.map(r => r.channel);
  assert.ok(channels.includes('push'));
  assert.ok(channels.includes('sms'));
  assert.ok(channels.includes('email'));
  assert.ok(!channels.includes('voice'));
});

test('OmniChannelGateway - routes normal priority to preferred channels', async () => {
  const gateway = new OmniChannelGateway();
  const createSimulatedProvider = (type: any): IChannelProvider => ({
    type,
    send: async (payload) => {
      return { channel: type, success: true, timestamp: new Date() };
    }
  });

  gateway.registerProvider(createSimulatedProvider('email'));
  gateway.registerProvider(createSimulatedProvider('push'));

  const results = await gateway.route(
    { to: 'user2', body: 'Update', priority: 'normal' },
    { preferredChannels: ['push'], optedOut: [] }
  );

  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].channel, 'push');
});

test('MediaProcessor - watermark stream prepends watermark', async () => {
  const processor = new MediaProcessor();
  const watermarkStream = processor.createWatermarkStream('CONFIDENTIAL');
  
  const inputData = Buffer.from('ImageDataHere');
  const readable = Readable.from([inputData]);
  
  let outputData = Buffer.alloc(0);
  
  watermarkStream.on('data', (chunk) => {
    outputData = Buffer.concat([outputData, chunk]);
  });

  await pipeline(readable, watermarkStream);
  
  assert.strictEqual(outputData.toString(), '[WATERMARK:CONFIDENTIAL]ImageDataHere');
});

test('MediaProcessor - normalize audio buffer amplifies bytes', () => {
  const processor = new MediaProcessor();
  const input = Buffer.from([10, 50, 100, 200]);
  const output = processor.normalizeAudioBuffer(input, 1.5);
  
  assert.strictEqual(output[0], 15);
  assert.strictEqual(output[1], 75);
  assert.strictEqual(output[2], 150);
  assert.strictEqual(output[3], 255); // Clamped to 255 (200 * 1.5 = 300)
});
