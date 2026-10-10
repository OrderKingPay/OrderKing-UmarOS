import { PaymentService } from '../../src/services/PaymentService';
import { CircuitBreaker } from '../../src/infrastructure/CircuitBreaker';
import { RiderService } from '../../src/services/RiderService';
import { OfflineSyncQueue } from '../../src/infrastructure/OfflineSyncQueue';
import { NetworkError } from '../../src/errors/NetworkError';

describe('Chaos & Failure Proofing', () => {
  describe('Payment Gateway - Circuit Breaker', () => {
    it('should trip the circuit breaker after consecutive 500 errors', async () => {
      // Simulated gateway returning 500 errors
      const mockPaymentGateway = {
        processPayment: jest.fn().mockRejectedValue({ status: 500, message: 'Internal Server Error' })
      };
      
      // Threshold: 3 failures, Timeout: 5000ms
      const circuitBreaker = new CircuitBreaker({ failureThreshold: 3, resetTimeout: 5000 });
      const paymentService = new PaymentService(mockPaymentGateway, circuitBreaker);

      // Trigger failures up to the threshold
      for (let i = 0; i < 3; i++) {
        await expect(paymentService.process({ amount: 100, currency: 'USD' }))
          .rejects.toThrow();
      }

      // The circuit breaker should now be OPEN.
      // Next call should fail immediately without hitting the gateway.
      await expect(paymentService.process({ amount: 100, currency: 'USD' }))
        .rejects.toThrow('Circuit Breaker is OPEN');
      
      expect(circuitBreaker.isOpen()).toBe(true);
      expect(mockPaymentGateway.processPayment).toHaveBeenCalledTimes(3);
    });
  });

  describe('Rider Network Drop - Offline Sync Queue', () => {
    it('should catch and queue payloads when network drops', async () => {
      // Simulated network drop
      const mockNetworkClient = {
        post: jest.fn().mockRejectedValue(new NetworkError('Network unreachable'))
      };
      
      const syncQueue = new OfflineSyncQueue();
      const riderService = new RiderService(mockNetworkClient, syncQueue);

      const updatePayload = { riderId: 'R123', lat: 45.4215, lng: -75.6972 };

      // Action: rider attempts to sync location while offline
      await riderService.syncLocation(updatePayload);

      // Verify the payload was caught by the Offline Sync Queue
      expect(mockNetworkClient.post).toHaveBeenCalledTimes(1);
      
      const queuedItems = syncQueue.getPendingItems();
      expect(queuedItems.length).toBe(1);
      expect(queuedItems[0].payload).toEqual(updatePayload);
      expect(queuedItems[0].endpoint).toBe('/api/riders/location');
    });
  });
});
