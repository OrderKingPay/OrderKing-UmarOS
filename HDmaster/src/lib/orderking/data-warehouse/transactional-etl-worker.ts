export class TransactionalETLWorker {
  constructor(private db: any) {}

  async extract() {
    // Extract raw data from ledger_transactions and orders
    const orders = await this.db.query("SELECT * FROM orders WHERE etl_processed = false");
    const transactions = await this.db.query("SELECT * FROM ledger_transactions WHERE etl_processed = false");
    return { orders, transactions };
  }

  transform(rawData: { orders: any[], transactions: any[] }) {
    // Safely transform and remove PII
    const cleanOrders = rawData.orders.map(order => {
      const { customer_name, customer_phone, customer_email, delivery_address, delivery_notes, ...cleanOrder } = order;
      return cleanOrder;
    });

    const cleanTransactions = rawData.transactions.map(tx => {
      const { billing_name, billing_address, card_number, card_fingerprint, ...cleanTx } = tx;
      return cleanTx;
    });

    return { cleanOrders, cleanTransactions };
  }

  loadToColumnarFormat(transformedData: { cleanOrders: any[], cleanTransactions: any[] }) {
    // Structure into columnar formats for massive offline AI analysis
    const columnarOrders = this.convertToColumnar(transformedData.cleanOrders);
    const columnarTransactions = this.convertToColumnar(transformedData.cleanTransactions);
    return { columnarOrders, columnarTransactions };
  }

  private convertToColumnar(arrayOfObjects: any[]) {
    if (!arrayOfObjects || arrayOfObjects.length === 0) return {};
    const columns: Record<string, any[]> = {};
    const keys = Object.keys(arrayOfObjects[0]);
    for (const key of keys) {
      columns[key] = [];
    }
    for (const obj of arrayOfObjects) {
      for (const key of keys) {
        columns[key].push(obj[key]);
      }
    }
    return columns;
  }

  async runPipeline() {
    console.log("Starting TransactionalETLWorker Pipeline...");
    try {
      const rawData = await this.extract();
      if (!rawData.orders?.length && !rawData.transactions?.length) {
         console.log("No new records to process.");
         return null;
      }

      const transformedData = this.transform(rawData);
      const columnarData = this.loadToColumnarFormat(transformedData);
      
      // Load the columnar data to our analytical backend (e.g. BigQuery/ClickHouse/Parquet files)
      await this.db.query("INSERT INTO data_lake_columnar (payload) VALUES ($1)", [columnarData]);
      
      // Mark as processed - Zero Lost Data
      await this.db.query("UPDATE orders SET etl_processed = true WHERE etl_processed = false");
      await this.db.query("UPDATE ledger_transactions SET etl_processed = true WHERE etl_processed = false");

      console.log("Pipeline executed successfully. Data ready for offline AI analysis.");
      return columnarData;
    } catch (error) {
      console.error("ETL Worker failed:", error);
      throw error;
    }
  }
}
