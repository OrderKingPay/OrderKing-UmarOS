import { ProvenanceTracker, ProvenanceMetadata } from './src/lib/orderking/provenance/index';

function runTests() {
  const tracker = new ProvenanceTracker();
  
  const sampleData = { orderId: '12345', status: 'delivered' };
  const metadata: ProvenanceMetadata = {
    origin: 'HDmaster',
    source: 'OrderService',
    identity: 'user-789',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    transformationHistory: ['created', 'updated']
  };

  console.log('Testing ProvenanceTracker...');
  
  const provenanceData = tracker.attachProvenance(sampleData, metadata);
  console.log('Attached Provenance:');
  console.log(JSON.stringify(provenanceData, null, 2));
  
  const isValid = tracker.verifyProvenance(provenanceData);
  console.log('Verification Result:', isValid ? 'PASS' : 'FAIL');
  
  // Test tampering
  const tamperedData = { ...provenanceData, data: { orderId: '12345', status: 'cancelled' } };
  const isTamperedValid = tracker.verifyProvenance(tamperedData);
  console.log('Tamper Verification Result:', !isTamperedValid ? 'PASS (detected)' : 'FAIL');
}

runTests();
