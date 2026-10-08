import test from 'node:test';
import assert from 'node:assert/strict';
import { UniversalSearch } from './universal-search';
import { VectorSearch } from './vector-search';

test('UniversalSearch - index and search', () => {
  const searchEngine = new UniversalSearch();
  
  searchEngine.index('products', 'doc1', 'Apple iPhone 14 Pro Max');
  searchEngine.index('products', 'doc2', 'Apple iPad Pro');
  searchEngine.index('products', 'doc3', 'Samsung Galaxy S23 Ultra');
  searchEngine.index('articles', 'doc4', 'Review of the new Apple iPhone');

  // Search in specific domain
  const results1 = searchEngine.search('apple iphone', { domain: 'products' });
  assert.equal(results1.length, 2);
  assert.equal(results1[0].docId, 'doc1'); // Should score higher for iphone because doc1 has less words

  // Search across all domains
  const results2 = searchEngine.search('apple');
  assert.equal(results2.length, 3);
  
  const docIds2 = results2.map(r => r.docId);
  assert.ok(docIds2.includes('doc1'));
  assert.ok(docIds2.includes('doc2'));
  assert.ok(docIds2.includes('doc4'));

  // Remove a document
  searchEngine.remove('products', 'doc1');
  const results3 = searchEngine.search('iphone', { domain: 'products' });
  assert.equal(results3.length, 0);
});

test('VectorSearch - add and search', () => {
  const vectorSearch = new VectorSearch();
  
  vectorSearch.addVector('v1', [1, 0, 0]);
  vectorSearch.addVector('v2', [0, 1, 0]);
  vectorSearch.addVector('v3', [0.8, 0.2, 0]);

  const results = vectorSearch.search([1, 0, 0], 2);
  
  assert.equal(results.length, 2);
  assert.equal(results[0].id, 'v1');
  assert.ok(results[0].score > 0.99); // Cosine similarity should be 1
  assert.equal(results[1].id, 'v3');
  assert.ok(results[1].score > 0.8 && results[1].score < 1);
});
