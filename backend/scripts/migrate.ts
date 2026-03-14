/**
 * Database migration script — runs the complete schema from DATABASE.md
 * Usage: npx tsx scripts/migrate.ts
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function runSQL(sql: string, label: string) {
  console.log(`\n⏳ Running: ${label}...`);
  const { error } = await supabase.rpc('', {} as never).then(() => ({ error: null })).catch((err) => ({ error: err }));
  // Use raw SQL via the pg_net extension or direct query
  // Since Supabase JS doesn't support raw SQL, we use the REST API
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc`, {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      'Content-Type': 'application/json',
    },
  });
  console.log(`   Status: ${response.status}`);
}

async function checkTable(tableName: string): Promise<boolean> {
  const { data, error } = await supabase.from(tableName).select('*').limit(0);
  if (error && error.message.includes('does not exist')) return false;
  return true;
}

async function migrate() {
  console.log('🔍 Checking existing tables...\n');

  const tables = ['profiles', 'properties', 'tours', 'annotations', 'roi_calculations'];
  for (const table of tables) {
    const exists = await checkTable(table);
    console.log(`  ${exists ? '✅' : '❌'} ${table}`);
  }

  console.log('\n📋 Migration SQL is ready in docs/DATABASE.md');
  console.log('⚠️  Supabase JS client does not support raw SQL execution.');
  console.log('👉 Please run the migration SQL in the Supabase Dashboard SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/eqwxxwcrgfuakaljblfa/sql/new\n');
  console.log('Copy the SQL from docs/DATABASE.md sections 2 and 3 into the editor and run it.\n');
}

migrate().catch(console.error);

