/**
 * Database schema export script
 * Exports the complete database schema to DATABASE_SCHEMA.sql
 * Run with: npm run db:schema
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SCHEMA_QUERY = `
-- Single query to export complete schema for 'dbhg' database

WITH 

-- Get all tables with columns

tables_def AS (

    SELECT 

        table_name,

        '-- ===========================================' || E'\\n' ||

        '-- TABLE: ' || table_name || E'\\n' ||

        '-- ===========================================' || E'\\n' ||

        'CREATE TABLE ' || table_schema || '.' || table_name || E' (\\n' ||

        string_agg(

            '    ' || column_name || ' ' || 

            CASE 

                WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'

                WHEN data_type = 'character' THEN 'CHAR(' || character_maximum_length || ')'

                WHEN data_type = 'numeric' THEN 'NUMERIC(' || numeric_precision || ',' || numeric_scale || ')'

                WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'

                WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'

                WHEN data_type = 'time without time zone' THEN 'TIME'

                WHEN data_type = 'USER-DEFINED' THEN udt_name

                ELSE UPPER(data_type)

            END ||

            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||

            CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,

            E',\\n' ORDER BY ordinal_position

        ) || E'\\n);\\n\\n' AS definition,

        1 AS sort_order

    FROM information_schema.columns

    WHERE table_schema = 'public' 

        AND table_catalog = 'dbhg'

    GROUP BY table_schema, table_name

),

-- Get primary keys

pk_def AS (

    SELECT 

        tc.table_name,

        '-- Primary Key for ' || tc.table_name || E'\\n' ||

        'ALTER TABLE ' || tc.table_schema || '.' || tc.table_name || 

        ' ADD CONSTRAINT ' || tc.constraint_name || 

        ' PRIMARY KEY (' || string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) || E');\\n\\n' AS definition,

        2 AS sort_order

    FROM information_schema.table_constraints tc

    JOIN information_schema.key_column_usage kcu 

        ON tc.constraint_name = kcu.constraint_name 

        AND tc.table_schema = kcu.table_schema

    WHERE tc.constraint_type = 'PRIMARY KEY'

        AND tc.table_schema = 'public'

        AND tc.table_catalog = 'dbhg'

    GROUP BY tc.table_schema, tc.table_name, tc.constraint_name

),

-- Get foreign keys

fk_def AS (

    SELECT 

        tc.table_name,

        '-- Foreign Key for ' || tc.table_name || E'\\n' ||

        'ALTER TABLE ' || tc.table_schema || '.' || tc.table_name || 

        ' ADD CONSTRAINT ' || tc.constraint_name || 

        ' FOREIGN KEY (' || kcu.column_name || ')' ||

        ' REFERENCES ' || ccu.table_schema || '.' || ccu.table_name || 

        ' (' || ccu.column_name || ')' ||

        CASE 

            WHEN rc.update_rule != 'NO ACTION' THEN ' ON UPDATE ' || rc.update_rule 

            ELSE '' 

        END ||

        CASE 

            WHEN rc.delete_rule != 'NO ACTION' THEN ' ON DELETE ' || rc.delete_rule 

            ELSE '' 

        END || E';\\n\\n' AS definition,

        3 AS sort_order

    FROM information_schema.table_constraints tc

    JOIN information_schema.key_column_usage kcu 

        ON tc.constraint_name = kcu.constraint_name

    JOIN information_schema.constraint_column_usage ccu 

        ON ccu.constraint_name = tc.constraint_name

    JOIN information_schema.referential_constraints rc 

        ON tc.constraint_name = rc.constraint_name

    WHERE tc.constraint_type = 'FOREIGN KEY'

        AND tc.table_schema = 'public'

        AND tc.table_catalog = 'dbhg'

),

-- Get indexes

idx_def AS (

    SELECT 

        tablename AS table_name,

        '-- Index for ' || tablename || E'\\n' ||

        indexdef || E';\\n\\n' AS definition,

        4 AS sort_order

    FROM pg_indexes

    WHERE schemaname = 'public'

        AND tablename IN (

            SELECT table_name 

            FROM information_schema.tables 

            WHERE table_schema = 'public' 

            AND table_catalog = 'dbhg'

        )

        AND indexname NOT IN (

            SELECT constraint_name 

            FROM information_schema.table_constraints 

            WHERE constraint_type = 'PRIMARY KEY'

        )

),

-- Get triggers

trigger_def AS (

    SELECT 

        event_object_table AS table_name,

        '-- Trigger: ' || trigger_name || E'\\n' ||

        'CREATE TRIGGER ' || trigger_name || E'\\n' ||

        '    ' || action_timing || ' ' || string_agg(DISTINCT event_manipulation, ' OR ') || E'\\n' ||

        '    ON ' || event_object_schema || '.' || event_object_table || E'\\n' ||

        '    FOR EACH ' || action_orientation || E'\\n' ||

        '    ' || action_statement || E';\\n\\n' AS definition,

        5 AS sort_order

    FROM information_schema.triggers

    WHERE trigger_schema = 'public'

        AND trigger_catalog = 'dbhg'

    GROUP BY trigger_name, action_timing, event_object_schema, event_object_table, 

             action_orientation, action_statement

),

-- Get functions

func_def AS (

    SELECT 

        NULL AS table_name,

        E'\\n-- ===========================================' || E'\\n' ||

        '-- FUNCTION: ' || p.proname || E'\\n' ||

        '-- ===========================================' || E'\\n' ||

        'CREATE OR REPLACE FUNCTION ' || ns.nspname || '.' || p.proname || 

        '(' || pg_get_function_arguments(p.oid) || ')' || E'\\n' ||

        'RETURNS ' || pg_get_function_result(p.oid) || E'\\n' ||

        'LANGUAGE ' || l.lanname || E'\\n' ||

        CASE 

            WHEN p.provolatile = 'i' THEN 'IMMUTABLE' || E'\\n'

            WHEN p.provolatile = 's' THEN 'STABLE' || E'\\n'

            ELSE ''

        END ||

        'AS $function$' || E'\\n' ||

        p.prosrc || E'\\n' ||

        '$function$;' || E'\\n\\n' AS definition,

        6 AS sort_order

    FROM pg_proc p

    JOIN pg_namespace ns ON p.pronamespace = ns.oid

    JOIN pg_language l ON p.prolang = l.oid

    WHERE ns.nspname = 'public'

        AND p.prokind IN ('f', 'p')

),

-- Combine everything

all_defs AS (

    SELECT table_name, definition, sort_order FROM tables_def

    UNION ALL

    SELECT table_name, definition, sort_order FROM pk_def

    UNION ALL

    SELECT table_name, definition, sort_order FROM fk_def

    UNION ALL

    SELECT table_name, definition, sort_order FROM idx_def

    UNION ALL

    SELECT table_name, definition, sort_order FROM trigger_def

    UNION ALL

    SELECT table_name, definition, sort_order FROM func_def

)

-- Final output

SELECT 

    '-- =============================================' || E'\\n' ||

    '-- COMPLETE SCHEMA EXPORT FOR DATABASE: dbhg' || E'\\n' ||

    '-- Schema: public' || E'\\n' ||

    '-- Generated: ' || NOW() || E'\\n' ||

    '-- =============================================' || E'\\n\\n' ||

    string_agg(definition, '' ORDER BY COALESCE(table_name, 'zzz'), sort_order) AS complete_schema

FROM all_defs;
`;

/**
 * Export database schema to file
 */
async function exportSchema() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('   Please set it in .env.local file');
    process.exit(1);
  }

  try {
    console.log('🔍 Connecting to database...');
    
    // Create postgres client
    const sql = postgres(databaseUrl);

    console.log('📊 Executing schema query...');
    
    // Execute the schema query
    const result = await sql.unsafe(SCHEMA_QUERY);

    if (!result || result.length === 0) {
      console.error('❌ No schema data returned from query');
      await sql.end();
      process.exit(1);
    }

    // Get the schema string from the result
    const schemaString = (result[0] as unknown as { complete_schema: string }).complete_schema;

    if (!schemaString) {
      console.error('❌ Schema string is empty');
      await sql.end();
      process.exit(1);
    }

    // Determine output file path
    const outputPath = path.join(process.cwd(), 'db', 'DATABASE_SCHEMA.sql');

    // Ensure db directory exists
    const dbDir = path.dirname(outputPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Write schema to file
    console.log(`💾 Writing schema to ${outputPath}...`);
    fs.writeFileSync(outputPath, schemaString, 'utf8');

    await sql.end();

    console.log('✅ Schema exported successfully!');
    console.log(`   File: ${outputPath}`);
  } catch (error) {
    console.error('❌ Schema export failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('password authentication failed')) {
        console.error('\n💡 Tip: Check your database credentials in .env.local');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error('\n💡 Tip: Make sure PostgreSQL is running');
      } else if (error.message.includes('does not exist')) {
        console.error('\n💡 Tip: Make sure the database "dbhg" exists');
      }
    }
    
    process.exit(1);
  }
}

// Run export
exportSchema();

