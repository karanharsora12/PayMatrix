import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not defined in .env');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Email Templates database migration...');
    await client.query('BEGIN');

    // 1. Create Enums if not exist
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE email_template_status AS ENUM ('ACTIVE', 'INACTIVE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE email_log_status AS ENUM ('PENDING', 'SENT', 'FAILED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create email_templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        template_code VARCHAR(100) NOT NULL,
        template_name VARCHAR(255) NOT NULL,
        template_type VARCHAR(80) NOT NULL,
        description TEXT,
        subject TEXT NOT NULL,
        body_html TEXT NOT NULL,
        status email_template_status DEFAULT 'ACTIVE' NOT NULL,
        is_default BOOLEAN DEFAULT false NOT NULL,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS email_templates_company_code_unique ON email_templates(company_id, template_code);
      CREATE INDEX IF NOT EXISTS email_templates_company_id_idx ON email_templates(company_id);
      CREATE INDEX IF NOT EXISTS email_templates_type_idx ON email_templates(template_type);
      CREATE INDEX IF NOT EXISTS email_templates_status_idx ON email_templates(status);
      CREATE INDEX IF NOT EXISTS email_templates_is_default_idx ON email_templates(is_default);
    `);

    // 3. Create email_template_versions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_template_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
        version_no INTEGER NOT NULL,
        subject TEXT NOT NULL,
        body_html TEXT NOT NULL,
        change_summary TEXT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS email_template_versions_tpl_ver_unique ON email_template_versions(template_id, version_no);
      CREATE INDEX IF NOT EXISTS email_template_versions_tpl_idx ON email_template_versions(template_id);
    `);

    // 4. Create email_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
        reference_type VARCHAR(80),
        reference_id VARCHAR(255),
        to_email VARCHAR(255) NOT NULL,
        cc TEXT,
        bcc TEXT,
        subject TEXT NOT NULL,
        body_html TEXT,
        status email_log_status DEFAULT 'PENDING' NOT NULL,
        sent_at TIMESTAMPTZ,
        error_message TEXT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS email_logs_company_id_idx ON email_logs(company_id);
      CREATE INDEX IF NOT EXISTS email_logs_template_id_idx ON email_logs(template_id);
      CREATE INDEX IF NOT EXISTS email_logs_ref_idx ON email_logs(reference_type, reference_id);
      CREATE INDEX IF NOT EXISTS email_logs_status_idx ON email_logs(status);
      CREATE INDEX IF NOT EXISTS email_logs_created_at_idx ON email_logs(created_at);
    `);

    await client.query('COMMIT');
    console.log('Email Templates migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
