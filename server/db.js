import pg from 'pg'

const { Pool } = pg

const connectionString =
  process.env.DATABASE_URL || 'postgresql://habits:habits_dev@localhost:5432/habits_local'

export const pool = new Pool({
  connectionString,
  ssl: false,
})

export async function query(text, params = []) {
  const result = await pool.query(text, params)
  return result
}
