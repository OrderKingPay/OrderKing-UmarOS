export enum Urgency {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum Platform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB'
}

export interface UserPreferences {
  platform: Platform;
  deviceToken?: string;
  phoneNumber?: string;
}

export interface OrderAlert {
  orderId: string;
  urgency: Urgency;
  title: string;
  message: string;
}

export class OmniChannelPushRouter {
  
  public async routeAlert(alert: OrderAlert, userPrefs: UserPreferences): Promise<void> {
    const deepLink = `orderking://order/${alert.orderId}`;
    
    // Logic based on urgency
    switch (alert.urgency) {
      case Urgency.CRITICAL:
        // High urgency: send via SMS, WhatsApp, and Push
        await this.sendSMS(alert, userPrefs, deepLink);
        await this.sendWhatsApp(alert, userPrefs, deepLink);
        await this.sendPush(alert, userPrefs, deepLink);
        break;
      case Urgency.HIGH:
        // Send Push and SMS
        await this.sendPush(alert, userPrefs, deepLink);
        await this.sendSMS(alert, userPrefs, deepLink);
        break;
      case Urgency.MEDIUM:
      case Urgency.LOW:
      default:
        // Just push
        await this.sendPush(alert, userPrefs, deepLink);
        break;
    }
  }

  private async sendPush(alert: OrderAlert, userPrefs: UserPreferences, deepLink: string): Promise<void> {
    if (!userPrefs.deviceToken) {
      console.warn('No device token provided for push notification.');
      return;
    }

    if (userPrefs.platform === Platform.ANDROID) {
      await this.sendFCM(alert, userPrefs.deviceToken, deepLink);
    } else if (userPrefs.platform === Platform.IOS) {
      await this.sendAPNs(alert, userPrefs.deviceToken, deepLink);
    }
  }

  private async sendFCM(alert: OrderAlert, deviceToken: string, deepLink: string): Promise<void> {
    const fcmPayload = {
      message: {
        token: deviceToken,
        notification: {
          title: alert.title,
          body: alert.message
        },
        data: {
          deepLink: deepLink,
          orderId: alert.orderId,
          urgency: alert.urgency
        },
        android: {
          priority: alert.urgency === Urgency.CRITICAL ? 'high' : 'normal'
        }
      }
    };
    
    // Simulate real dispatch
    console.log(`[FCM] Dispatching to Android:`, JSON.stringify(fcmPayload, null, 2));
    // TODO: implement actual HTTP call to FCM API
  }

  private async sendAPNs(alert: OrderAlert, deviceToken: string, deepLink: string): Promise<void> {
    const apnsPayload = {
      aps: {
        alert: {
          title: alert.title,
          body: alert.message
        },
        sound: alert.urgency === Urgency.CRITICAL ? 'critical_alert.caf' : 'default',
        badge: 1,
        'interruption-level': this.getAPNsInterruptionLevel(alert.urgency)
      },
      deepLink: deepLink,
      orderId: alert.orderId
    };

    // Simulate real dispatch
    console.log(`[APNs] Dispatching to iOS:`, JSON.stringify(apnsPayload, null, 2));
    // TODO: implement actual HTTP call to APNs API
  }

  private getAPNsInterruptionLevel(urgency: Urgency): string {
    switch (urgency) {
      case Urgency.CRITICAL: return 'critical';
      case Urgency.HIGH: return 'time-sensitive';
      case Urgency.MEDIUM: return 'active';
      case Urgency.LOW: return 'passive';
      default: return 'active';
    }
  }

  private async sendSMS(alert: OrderAlert, userPrefs: UserPreferences, deepLink: string): Promise<void> {
    if (!userPrefs.phoneNumber) return;
    
    const smsPayload = {
      to: userPrefs.phoneNumber,
      body: `OrderKing Alert: ${alert.title}. ${alert.message}. View order: ${deepLink}`
    };

    console.log(`[SMS] Dispatching:`, JSON.stringify(smsPayload, null, 2));
    // TODO: implement actual SMS API (e.g. Twilio)
  }

  private async sendWhatsApp(alert: OrderAlert, userPrefs: UserPreferences, deepLink: string): Promise<void> {
    if (!userPrefs.phoneNumber) return;
    
    const waPayload = {
      messaging_product: "whatsapp",
      to: userPrefs.phoneNumber,
      type: "template",
      template: {
        name: "order_critical_alert",
        language: {
          code: "en_US"
        },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: alert.title },
              { type: "text", text: alert.message },
              { type: "text", text: deepLink }
            ]
          }
        ]
      }
    };

    console.log(`[WhatsApp] Dispatching:`, JSON.stringify(waPayload, null, 2));
    // TODO: implement actual WhatsApp Cloud API
  }
}
