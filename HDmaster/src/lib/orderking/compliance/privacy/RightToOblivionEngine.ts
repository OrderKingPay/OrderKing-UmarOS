import { createHash } from 'crypto';

export class RightToOblivionEngine {
  private db: any; // Using any for abstract db client

  constructor(dbClient: any) {
    this.db = dbClient;
  }

  /**
   * Generates a SHA-256 cryptographic hash of the input string.
   */
  private hashData(data: string): string {
    if (!data) return '';
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Process a right to oblivion (delete my account) request.
   * Complies with Indian DPDP and GDPR.
   * Cryptographically anonymizes PII (using SHA-256) instead of hard deletion 
   * to maintain financial ledgers.
   */
  async processDeletionRequest(userId: string): Promise<void> {
    if (!userId) {
      throw new Error("userId is required");
    }

    try {
      // Retrieve existing user data to hash their PII
      const userResult = await this.db.query(
        `SELECT first_name, last_name, email, phone, address FROM profiles WHERE user_id = $1`,
        [userId]
      );

      if (!userResult || userResult.rows?.length === 0) {
        throw new Error("User profile not found");
      }

      const user = userResult.rows[0];

      // Cryptographically hash the PII
      const hashedFirstName = this.hashData(user.first_name);
      const hashedLastName = this.hashData(user.last_name);
      const hashedEmail = this.hashData(user.email);
      const hashedPhone = this.hashData(user.phone);
      const hashedAddress = this.hashData(user.address);

      // 1. Anonymize profile data with cryptographic hashes
      await this.db.query(
        `UPDATE profiles 
         SET 
           first_name = $1, 
           last_name = $2, 
           email = $3, 
           phone = $4, 
           address = $5 
         WHERE user_id = $6`,
        [
          hashedFirstName,
          hashedLastName,
          hashedEmail,
          hashedPhone,
          hashedAddress,
          userId
        ]
      );

      // 2. Anonymize orders data for the user
      // Assuming orders might contain customer_name or shipping_address
      await this.db.query(
        `UPDATE orders 
         SET 
           customer_name = $1, 
           shipping_address = $2 
         WHERE user_id = $3`,
        [
          `${hashedFirstName} ${hashedLastName}`.trim(),
          hashedAddress,
          userId
        ]
      );

      // We DO NOT drop financial ledgers or delete rows to ensure compliance 
      // with tax/financial retention laws.

    } catch (error) {
      console.error("Failed to process right to oblivion request:", error);
      throw error;
    }
  }
}
