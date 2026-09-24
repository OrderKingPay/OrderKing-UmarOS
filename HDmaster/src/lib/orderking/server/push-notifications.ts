/**
 * Push Notification Infrastructure — Multi-channel notification delivery
 * supporting FCM (Firebase Cloud Messaging), Web Push, and SMS fallback.
 *
 * @module push-notifications
 */

export type NotificationChannel = "FCM" | "WEB_PUSH" | "SMS" | "EMAIL" | "IN_APP";
export type NotificationPriority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
export type NotificationStatus = "QUEUED" | "SENT" | "DELIVERED" | "FAILED" | "DROPPED";

export type NotificationPayload = {
  id: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  recipient: {
    userId: string;
    deviceToken?: string;
    phone?: string;
    email?: string;
  };
  content: {
    title: string;
    body: string;
    imageUrl?: string;
    deepLink?: string;
    data?: Record<string, string>;
  };
  scheduling: {
    sendAt?: string; // ISO 8601, null = immediate
    expiresAt?: string; // TTL for delivery
    collapseKey?: string; // Replace previous notification with same key
  };
  tracking: {
    campaignId?: string;
    templateKey: string;
    orderId?: string;
    orgId: string;
  };
};

export type NotificationResult = {
  id: string;
  status: NotificationStatus;
  channel: NotificationChannel;
  sentAt?: string;
  error?: string;
  retryCount: number;
};

// Template registry with i18n support
export const NOTIFICATION_TEMPLATES: Record<string, { title: string; body: string; channel: NotificationChannel[]; priority: NotificationPriority }> = {
  // Customer templates
  order_placed: {
    title: "Order Confirmed! 🎉",
    body: "Your order #{orderId} has been placed successfully. We'll notify you when the restaurant starts preparing.",
    channel: ["FCM", "WEB_PUSH", "IN_APP"],
    priority: "HIGH",
  },
  order_accepted: {
    title: "Restaurant is preparing your order 🍳",
    body: "Your order #{orderId} is being prepared. Estimated delivery in {eta} minutes.",
    channel: ["FCM", "WEB_PUSH", "IN_APP"],
    priority: "NORMAL",
  },
  rider_assigned: {
    title: "Rider on the way! 🏍️",
    body: "{riderName} is picking up your order from {restaurantName}.",
    channel: ["FCM", "WEB_PUSH", "IN_APP"],
    priority: "HIGH",
  },
  order_delivered: {
    title: "Order Delivered! ✅",
    body: "Your order #{orderId} has been delivered. Enjoy your meal! Rate your experience.",
    channel: ["FCM", "WEB_PUSH", "IN_APP"],
    priority: "NORMAL",
  },
  order_cancelled: {
    title: "Order Cancelled",
    body: "Your order #{orderId} has been cancelled. {reason}",
    channel: ["FCM", "WEB_PUSH", "IN_APP", "SMS"],
    priority: "HIGH",
  },
  refund_processed: {
    title: "Refund Processed 💰",
    body: "₹{amount} has been refunded for order #{orderId}. It will reflect in 3-5 business days.",
    channel: ["FCM", "WEB_PUSH", "IN_APP", "EMAIL"],
    priority: "HIGH",
  },

  // Restaurant templates
  new_order: {
    title: "New Order! 🔔",
    body: "Order #{orderId} — {itemCount} items, ₹{total}. Accept within 90 seconds.",
    channel: ["FCM", "WEB_PUSH", "IN_APP"],
    priority: "CRITICAL",
  },
  order_about_to_expire: {
    title: "⚠️ Order Expiring!",
    body: "Order #{orderId} will auto-reject in 30 seconds. Please accept now.",
    channel: ["FCM", "WEB_PUSH"],
    priority: "CRITICAL",
  },

  // Rider templates
  delivery_offer: {
    title: "New Delivery Offer 📍",
    body: "Pickup: {restaurantName} ({distance} km). Payout: ₹{payout}.",
    channel: ["FCM", "WEB_PUSH", "IN_APP"],
    priority: "CRITICAL",
  },
  delivery_completed: {
    title: "Delivery Complete ✓",
    body: "₹{payout} earned for order #{orderId}. Total today: ₹{dailyTotal}.",
    channel: ["FCM", "IN_APP"],
    priority: "NORMAL",
  },

  // System templates
  payment_failed: {
    title: "Payment Failed",
    body: "Payment for order #{orderId} failed. Please retry or use a different method.",
    channel: ["FCM", "WEB_PUSH", "SMS"],
    priority: "CRITICAL",
  },
  account_suspended: {
    title: "Account Suspended",
    body: "Your account has been suspended. Please contact support for assistance.",
    channel: ["FCM", "WEB_PUSH", "SMS", "EMAIL"],
    priority: "CRITICAL",
  },
  loyalty_tier_upgrade: {
    title: "Tier Upgrade! 🌟",
    body: "Congratulations! You've been upgraded to {tier} tier. Enjoy enhanced rewards!",
    channel: ["FCM", "WEB_PUSH", "IN_APP"],
    priority: "HIGH",
  },
  weekly_earnings: {
    title: "Weekly Earnings Summary 📊",
    body: "You earned ₹{total} from {deliveryCount} deliveries this week.",
    channel: ["FCM", "IN_APP", "EMAIL"],
    priority: "LOW",
  },
};

/**
 * Interpolate template variables into notification content.
 */
export function renderTemplate(
  templateKey: string,
  variables: Record<string, string | number>
): { title: string; body: string } | null {
  const template = NOTIFICATION_TEMPLATES[templateKey];
  if (!template) return null;

  let title = template.title;
  let body = template.body;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    title = title.replaceAll(placeholder, String(value));
    body = body.replaceAll(placeholder, String(value));
  }

  // Also handle #{var} patterns
  for (const [key, value] of Object.entries(variables)) {
    const hashPlaceholder = `#{${key}}`;
    title = title.replaceAll(hashPlaceholder, String(value));
    body = body.replaceAll(hashPlaceholder, String(value));
  }

  return { title, body };
}

/**
 * Build a notification payload from a template.
 */
export function buildNotification(
  templateKey: string,
  recipient: NotificationPayload["recipient"],
  variables: Record<string, string | number>,
  orgId: string,
  options?: { orderId?: string; campaignId?: string; deepLink?: string; scheduledAt?: string }
): NotificationPayload | null {
  const template = NOTIFICATION_TEMPLATES[templateKey];
  if (!template) return null;

  const rendered = renderTemplate(templateKey, variables);
  if (!rendered) return null;

  const preferredChannel = template.channel[0] ?? "IN_APP";

  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    channel: preferredChannel,
    priority: template.priority,
    recipient,
    content: {
      title: rendered.title,
      body: rendered.body,
      deepLink: options?.deepLink,
    },
    scheduling: {
      sendAt: options?.scheduledAt ?? undefined,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      collapseKey: options?.orderId ? `order_${options.orderId}` : undefined,
    },
    tracking: {
      campaignId: options?.campaignId,
      templateKey,
      orderId: options?.orderId,
      orgId,
    },
  };
}

/**
 * Determine delivery channels for a notification based on priority and recipient capabilities.
 */
export function resolveChannels(
  templateKey: string,
  hasDeviceToken: boolean,
  hasPhone: boolean,
  hasEmail: boolean
): NotificationChannel[] {
  const template = NOTIFICATION_TEMPLATES[templateKey];
  if (!template) return ["IN_APP"];

  return template.channel.filter((ch) => {
    switch (ch) {
      case "FCM":
      case "WEB_PUSH":
        return hasDeviceToken;
      case "SMS":
        return hasPhone;
      case "EMAIL":
        return hasEmail;
      case "IN_APP":
        return true;
      default:
        return false;
    }
  });
}
