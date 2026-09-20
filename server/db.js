import pg from 'pg'

const { Pool } = pg

const connectionString =
  process.env.DATABASE_URL || 'postgresql://habits:habits_dev@localhost:5432/habits_local'

const shouldUseSsl =
  process.env.PGSSLMODE === 'require' ||
  process.env.NODE_ENV === 'production' ||
  connectionString.includes('sslmode=require') ||
  connectionString.includes('ssl=true')

export const pool = new Pool({
  connectionString,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
})

export async function query(text, params = []) {
  const result = await pool.query(text, params)
  return result
}
