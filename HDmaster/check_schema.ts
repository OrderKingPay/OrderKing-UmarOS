import { getSql } from './src/lib/db';
getSql().then(sql => sql.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'settlement_batches';"))
.then(rows => {
    console.log(rows);
    process.exit(0);
})
.catch(err => {
    console.error(err);
    process.exit(1);
});
