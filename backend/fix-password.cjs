const pg = require('pg');
const bcrypt = require('bcrypt');

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:Karan%40123@localhost:5432/paymatrix',
});

bcrypt.hash('Password123!', 10)
  .then(hash => {
    console.log('Generated hash:', hash);
    return pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email',
      [hash, 'admin@paymatrix.com']
    );
  })
  .then(r => {
    console.log('Updated rows:', r.rowCount, r.rows);
    pool.end();
  })
  .catch(e => {
    console.error('Error:', e.message);
    pool.end();
  });
