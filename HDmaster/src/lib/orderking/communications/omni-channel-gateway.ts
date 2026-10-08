export type ChannelType = 'sms' | 'email' | 'voice' | 'push';
export type MessagePriority = 'high' | 'normal' | 'low';

export interface UserContactPrefs {
  preferredChannels: ChannelType[];
  optedOut: ChannelType[];
}

export interface MessagePayload {
  to: string;
  subject?: string;
  body: string;
  priority: MessagePriority;
}

export interface DeliveryResult {
  channel: ChannelType;
  success: boolean;
  timestamp: Date;
  error?: string;
}

export interface IChannelProvider {
  type: ChannelType;
  send(payload: MessagePayload): Promise<DeliveryResult>;
}

export class OmniChannelGateway {
  private providers: Map<ChannelType, IChannelProvider> = new Map();

  registerProvider(provider: IChannelProvider): void {
    this.providers.set(provider.type, provider);
  }

  async route(payload: MessagePayload, prefs: UserContactPrefs): Promise<DeliveryResult[]> {
    const channelsToUse = this.determineChannels(payload.priority, prefs);
    
    if (channelsToUse.length === 0) {
      throw new Error('No valid channels available for delivery');
    }

    const results: DeliveryResult[] = [];
    const promises = channelsToUse.map(async (channel) => {
      const provider = this.providers.get(channel);
      if (provider) {
        try {
          const result = await provider.send(payload);
          results.push(result);
        } catch (error: any) {
          results.push({ channel, success: false, timestamp: new Date(), error: error.message || 'Unknown error' });
        }
      } else {
        results.push({ channel, success: false, timestamp: new Date(), error: `Provider for ${channel} not configured` });
      }
    });

    await Promise.all(promises);
    return results;
  }

  private determineChannels(priority: MessagePriority, prefs: UserContactPrefs): ChannelType[] {
    const isAllowed = (c: ChannelType) => !prefs.optedOut.includes(c);
    let selected: ChannelType[] = [];

    if (priority === 'high') {
      // High priority targets all allowed channels for maximum reach
      selected = (['push', 'sms', 'voice', 'email'] as ChannelType[]).filter(isAllowed);
    } else if (priority === 'normal') {
      // Normal priority respects user preferences first
      selected = prefs.preferredChannels.filter(isAllowed);
      if (selected.length === 0 && isAllowed('email')) {
        selected = ['email'];
      }
    } else {
      // Low priority defaults to email if allowed
      if (isAllowed('email')) {
        selected = ['email'];
      }
    }

    return selected;
  }
}
