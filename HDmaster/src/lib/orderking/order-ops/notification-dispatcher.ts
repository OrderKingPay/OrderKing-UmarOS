import { getSql } from '../../db';

export async function notifyOrderUpdate(orderId: string, status: string): Promise<void> {
  const sql = await getSql();
  
  const rows = await sql`
    SELECT u.fcm_token 
    FROM orders o 
    JOIN users u ON o.customer_id = u.id 
    WHERE o.id = ${orderId}
  `;
  
  if (rows.length === 0 || !(rows[0] as any).fcm_token) {
    console.warn(`No FCM token found for order ${orderId}`);
    return;
  }
  
  const fcmToken = (rows[0] as any).fcm_token;
  const projectId = process.env.FCM_PROJECT_ID;
  const accessToken = process.env.FCM_ACCESS_TOKEN;
  
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  
  const payload = {
    message: {
      token: fcmToken,
      notification: {
        title: 'Order Update',
        body: `Your order status has been updated to: ${status}`
      },
      data: {
        orderId: orderId,
        status: status
      }
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to send FCM notification: ${errorText}`);
  }
}
