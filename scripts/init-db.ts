/**
 * Database initialization script
 * Creates the database if it doesn't exist
 * Run with: npm run db:init
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/**
 * Parse DATABASE_URL into components
 * Supports multiple formats:
 * - postgresql://user:password@host:port/database
 * - postgresql://user:password@host/database (default port 5432)
 * - postgres://user:password@host:port/database
 */
function parseDatabaseUrl(url: string): DatabaseConfig {
  // Remove query parameters if present
  const cleanUrl = url.split('?')[0];
  
  // Try to match with port
  let match = cleanUrl.match(/postgres(ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  
  if (match) {
    return {
      user: decodeURIComponent(match[2]),
      password: decodeURIComponent(match[3]),
      host: match[4],
      port: parseInt(match[5], 10),
      database: match[6],
    };
  }
  
  // Try to match without port (default to 5432)
  match = cleanUrl.match(/postgres(ql)?:\/\/([^:]+):([^@]+)@([^\/]+)\/(.+)/);
  
  if (match) {
    return {
      user: decodeURIComponent(match[2]),
      password: decodeURIComponent(match[3]),
      host: match[4],
      port: 5432, // Default PostgreSQL port
      database: match[5],
    };
  }
  
  // If still no match, show helpful error
  throw new Error(
    `Invalid DATABASE_URL format.\n` +
    `Received: ${url.substring(0, 20)}...\n` +
    `Expected formats:\n` +
    `  - postgresql://user:password@host:port/database\n` +
    `  - postgresql://user:password@host/database (defaults to port 5432)\n` +
    `  - postgres://user:password@host:port/database`
  );
}

/**
 * Check if database exists
 */
async function databaseExists(client: postgres.Sql, dbName: string): Promise<boolean> {
  const result = await client`
    SELECT 1 FROM pg_database WHERE datname = ${dbName}
  `;
  return result.length > 0;
}

/**
 * Create database if it doesn't exist
 */
async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('   Please set it in .env.local file');
    process.exit(1);
  }

  try {
    console.log('🔍 Parsing DATABASE_URL...');
    // Show masked URL for debugging (hide password)
    const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
    console.log(`   URL format: ${maskedUrl.substring(0, 60)}...`);
    const config = parseDatabaseUrl(databaseUrl);

    console.log(`📊 Target database: ${config.database}`);
    console.log(`🔌 Connecting to PostgreSQL at ${config.host}:${config.port}...`);

    // Connect to default 'postgres' database to check/create our database
    const adminUrl = `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/postgres`;
    const adminClient = postgres(adminUrl);

    // Check if database exists
    const exists = await databaseExists(adminClient, config.database);

    if (exists) {
      console.log(`✅ Database "${config.database}" already exists`);
      await adminClient.end();
      return;
    }

    // Create database
    console.log(`📦 Creating database "${config.database}"...`);
    
    // Note: CREATE DATABASE cannot be executed in a transaction
    // We need to use template0 to avoid connection issues
    await adminClient.unsafe(`CREATE DATABASE ${config.database}`);

    console.log(`✅ Database "${config.database}" created successfully!`);
    
    await adminClient.end();
    
    console.log('\n✨ Database initialization complete!');
    console.log('   You can now run: npm run db:migrate');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('password authentication failed')) {
        console.error('\n💡 Tip: Check your database credentials in .env.local');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error('\n💡 Tip: Make sure PostgreSQL is running');
      } else if (error.message.includes('permission denied')) {
        console.error('\n💡 Tip: The database user may not have permission to create databases');
        console.error('   Try creating the database manually:');
        try {
          const config = parseDatabaseUrl(databaseUrl);
          console.error(`   CREATE DATABASE ${config.database};`);
        } catch {
          console.error('   (Could not parse DATABASE_URL to show database name)');
        }
      } else if (error.message.includes('Invalid DATABASE_URL format')) {
        console.error('\n💡 Your DATABASE_URL format might be incorrect.');
        console.error('   Current value (first 50 chars):', databaseUrl?.substring(0, 50));
        console.error('\n   Make sure it follows one of these formats:');
        console.error('   postgresql://username:password@host:5432/database_name');
        console.error('   postgresql://username:password@host/database_name');
      }
    }
    
    process.exit(1);
  }
}

// Run initialization
initDatabase();

