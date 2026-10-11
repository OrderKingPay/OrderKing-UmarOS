import React, { useEffect, useState } from 'react';

interface KingPaySoundboxEngineProps {
  merchantId: string;
}

export const KingPaySoundboxEngine: React.FC<KingPaySoundboxEngineProps> = ({ merchantId }) => {
  const [lastTransaction, setLastTransaction] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    // In a real implementation, this would connect to a WebSocket or SSE endpoint
    // that relays the webhook events received by the backend for this merchant.
    const ws = new WebSocket(`wss://api.orderking.com/ws/payments/${merchantId}`);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'UPI_PAYMENT_RECEIVED') {
          const amount = data.amount;
          const message = `Received ₹${amount} on KingPay`;
          setLastTransaction(message);
          playAudioAlert(message);
        }
      } catch (error) {
        console.error('Error parsing KingPay payment data:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [merchantId]);

  const playAudioAlert = (message: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'en-IN'; // Indian English for authentic Soundbox feel
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Text-to-speech not supported in this browser.');
    }
  };

  return (
    <div className="kingpay-soundbox-engine p-4 border rounded-lg bg-green-50 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-green-700">KingPay Soundbox</h2>
        <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>
      <p className="text-sm text-gray-600">
        {isConnected ? 'Listening for incoming UPI payments...' : 'Connecting to KingPay servers...'}
      </p>
      
      {lastTransaction && (
        <div className="mt-4 p-3 bg-white border border-green-200 rounded text-green-800 font-semibold text-center animate-pulse">
          🔊 {lastTransaction}
        </div>
      )}
    </div>
  );
};

export default KingPaySoundboxEngine;
