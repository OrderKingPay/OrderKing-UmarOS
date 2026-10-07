export class SubscriptionController {
  public static async subscribe({ request }: any) {
    return new Response(JSON.stringify({ success: true }));
  }
  public static async getSubscription({ request }: any) {
    return new Response(JSON.stringify({ success: true }));
  }
}
