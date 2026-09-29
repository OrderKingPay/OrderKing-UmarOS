import { getSql } from '../src/lib/db.ts';

getSql()
  .then(sql => sql.query('SELECT email FROM employees'))
  .then(res => console.log(JSON.stringify(res.rows, null, 2)))
  .catch(console.error);
