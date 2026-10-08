import { BigQuery } from '@google-cloud/bigquery';

export async function loadToBigQuery(data: any[]) {
    if (!data || data.length === 0) {
        console.log('No data to load to BigQuery.');
        return;
    }

    // Initialize BigQuery client
    const bigquery = new BigQuery();
    
    const datasetId = 'orderking_dwh';
    const tableId = 'daily_orders';
    
    try {
        // Stream data to BigQuery
        await bigquery
            .dataset(datasetId)
            .table(tableId)
            .insert(data);
            
        console.log(`Successfully loaded ${data.length} rows to BigQuery table ${datasetId}.${tableId}`);
    } catch (error) {
        console.error('Error loading data to BigQuery:', error);
        throw error;
    }
}
