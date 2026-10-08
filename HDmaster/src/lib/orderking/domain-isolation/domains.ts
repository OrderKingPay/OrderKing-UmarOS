export enum Domain {
  ORDERKING = 'ORDERKING',
  KINGPAY = 'KINGPAY',
  CUSTOMER = 'CUSTOMER',
  PARTNER = 'PARTNER',
  RIDER = 'RIDER',
  FOUNDER = 'FOUNDER',
  FINANCE = 'FINANCE',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  SECURITY = 'SECURITY',
  AI_SYSTEMS = 'AI_SYSTEMS',
  EXTERNAL = 'EXTERNAL',
}

export type DomainPolicy = {
  [source in Domain]?: {
    [target in Domain]?: string[]; // Allowed actions
  }
};

export const domainPolicies: DomainPolicy = {
  [Domain.ORDERKING]: {
    [Domain.KINGPAY]: ['initiate_payment', 'check_status'],
    [Domain.CUSTOMER]: ['notify_status'],
    [Domain.PARTNER]: ['send_order', 'check_inventory'],
    [Domain.RIDER]: ['assign_delivery', 'track_location'],
  },
  [Domain.KINGPAY]: {
    [Domain.ORDERKING]: ['update_payment_status'],
    [Domain.FINANCE]: ['record_transaction'],
  },
  [Domain.CUSTOMER]: {
    [Domain.ORDERKING]: ['place_order', 'cancel_order', 'view_history'],
    [Domain.KINGPAY]: ['process_payment'],
  },
  [Domain.PARTNER]: {
    [Domain.ORDERKING]: ['accept_order', 'update_status'],
  },
  [Domain.RIDER]: {
    [Domain.ORDERKING]: ['update_delivery_status'],
  },
  [Domain.FOUNDER]: {
    [Domain.ORDERKING]: ['view_metrics'],
    [Domain.KINGPAY]: ['view_revenue'],
    [Domain.FINANCE]: ['view_reports'],
    [Domain.AI_SYSTEMS]: ['configure_models'],
  },
  [Domain.FINANCE]: {
    [Domain.KINGPAY]: ['audit_transactions'],
  },
  [Domain.INFRASTRUCTURE]: {
    [Domain.ORDERKING]: ['monitor_health'],
    [Domain.KINGPAY]: ['monitor_health'],
    [Domain.SECURITY]: ['report_metrics'],
  },
  [Domain.SECURITY]: {
    [Domain.ORDERKING]: ['enforce_policy', 'audit'],
    [Domain.KINGPAY]: ['enforce_policy', 'audit'],
    [Domain.INFRASTRUCTURE]: ['scan_vulnerabilities'],
  },
  [Domain.AI_SYSTEMS]: {
    [Domain.ORDERKING]: ['predict_demand', 'optimize_routes'],
  },
  [Domain.EXTERNAL]: {
    [Domain.ORDERKING]: ['webhook_callback'],
  },
};
