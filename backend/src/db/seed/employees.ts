import dotenv from "dotenv";
import path from "path";
import { Pool } from "pg";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in .env");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const firstNames = [
  "James",
  "Mary",
  "John",
  "Patricia",
  "Robert",
  "Jennifer",
  "Michael",
  "Linda",
  "William",
  "Elizabeth",
  "David",
  "Barbara",
  "Richard",
  "Susan",
  "Joseph",
  "Jessica",
  "Thomas",
  "Sarah",
  "Charles",
  "Karen",
  "Rahul",
  "Priya",
  "Amit",
  "Sneha",
  "Vikram",
  "Anjali",
];
const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Sharma",
  "Verma",
  "Gupta",
  "Patel",
  "Singh",
  "Kumar",
  "Reddy",
  "Rao",
  "Das",
  "Jain",
];

async function seedEmployees() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get company
    const compRes = await client.query(`SELECT id FROM companies LIMIT 1`);
    if (compRes.rows.length === 0)
      throw new Error("No company found. Please run the main seed first.");
    const companyId = compRes.rows[0].id;

    // Get branches, depts, desigs
    const branchRes = await client.query(
      `SELECT id FROM branches WHERE company_id = $1`,
      [companyId],
    );
    const deptRes = await client.query(
      `SELECT id FROM departments WHERE company_id = $1`,
      [companyId],
    );
    const desigRes = await client.query(
      `SELECT id FROM designations WHERE company_id = $1`,
      [companyId],
    );

    const branches = branchRes.rows.map((r) => r.id);
    const depts = deptRes.rows.map((r) => r.id);
    const desigs = desigRes.rows.map((r) => r.id);

    const randomItem = (arr: any[]) =>
      arr[Math.floor(Math.random() * arr.length)];

    let count = 0;

    for (let i = 1; i <= 150; i++) {
      const fName = randomItem(firstNames);
      const lName = randomItem(lastNames);
      const code = `EMP-${1000 + i}`;
      const branchId = branches.length > 0 ? randomItem(branches) : null;
      const deptId = depts.length > 0 ? randomItem(depts) : null;
      const desigId = desigs.length > 0 ? randomItem(desigs) : null;
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@example.com`;
      const joiningDate = new Date(Date.now() - Math.random() * 30000000000)
        .toISOString()
        .split("T")[0];
      const gender = Math.random() > 0.5 ? "MALE" : "FEMALE";

      const res = await client.query(
        `INSERT INTO employees (id, company_id, branch_id, department_id, designation_id, employee_code, first_name, last_name, email, joining_date, gender, is_active)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
         ON CONFLICT (company_id, employee_code) DO NOTHING
         RETURNING id`,
        [
          companyId,
          branchId,
          deptId,
          desigId,
          code,
          fName,
          lName,
          email,
          joiningDate,
          gender,
        ],
      );

      if (res.rowCount && res.rowCount > 0) {
        count++;
      }
    }

    await client.query("COMMIT");
    console.log(`✓ Successfully seeded ${count} new employees!`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Failed to seed employees:", e);
  } finally {
    client.release();
    await pool.end();
  }
}

seedEmployees();
