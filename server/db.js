import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://habits:habits_dev@localhost:5432/habits_local',
  ssl: false,
})

export async function query(text, params = []) {
  const result = await pool.query(text, params)
  return result
}
