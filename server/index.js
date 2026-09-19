import cors from 'cors'
import express from 'express'
import { query } from './db.js'
import { normalizeHabitForDb, normalizeHabitFromDb } from './habitsService.js'

const app = express()
const port = process.env.PORT || 3001
const JSON_LIMIT = process.env.JSON_BODY_LIMIT || '50mb'

app.use(cors())
app.use(express.json({ limit: JSON_LIMIT }))
app.use(express.urlencoded({ extended: true, limit: JSON_LIMIT }))

app.get('/api/health', async (_req, res) => {
  try {
    const result = await query('SELECT 1 as ok')
    res.json({ ok: true, postgres: result.rows[0].ok === 1 })
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message })
  }
})

app.get('/api/settings', async (_req, res) => {
  try {
    const result = await query('SELECT key, value FROM app_settings')
    const settings = {}
    for (const row of result.rows) {
      settings[row.key] = row.value
    }
    res.json({ settings })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/settings', async (req, res) => {
  const entries = Object.entries(req.body ?? {})
  try {
    await query('BEGIN')
    for (const [key, value] of entries) {
      await query(
        `INSERT INTO app_settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, String(value)],
      )
    }
    await query('COMMIT')
    res.json({ ok: true })
  } catch (error) {
    await query('ROLLBACK').catch(() => {})
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/habits', async (_req, res) => {
  try {
    const habitsResult = await query(`
      SELECT h.*
      FROM habits h
      ORDER BY h.position ASC, h.id ASC
    `)

    const habits = []
    for (const dbHabit of habitsResult.rows) {
      const rowsResult = await query(
        'SELECT entry_date, value, notes FROM entries WHERE habit_id = $1 ORDER BY entry_date ASC',
        [dbHabit.id],
      )
      habits.push(normalizeHabitFromDb(dbHabit, rowsResult.rows))
    }

    res.json({ habits })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/habits', async (req, res) => {
  const habits = Array.isArray(req.body?.habits) ? req.body.habits : []

  try {
    await query('BEGIN')
    await query('DELETE FROM entries')
    await query('DELETE FROM habits')

    for (const habit of habits) {
      const { habit: habitData, entries } = normalizeHabitForDb(habit)
      const result = await query(
        `
          INSERT INTO habits (
            uuid, name, description, question, color_index, type,
            frequency_numerator, frequency_denominator, target_type,
            target_value, unit, archived, position
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id
        `,
        [
          habitData.uuid,
          habitData.name,
          habitData.description,
          habitData.question,
          habitData.color_index,
          habitData.type,
          habitData.frequency_numerator,
          habitData.frequency_denominator,
          habitData.target_type,
          habitData.target_value,
          habitData.unit,
          habitData.archived,
          habitData.position,
        ],
      )

      const habitId = result.rows[0].id

      if (entries.length > 0) {
        for (const entry of entries) {
          await query(
            'INSERT INTO entries (habit_id, entry_date, value, notes) VALUES ($1, $2, $3, $4)',
            [habitId, entry.entry_date, entry.value, entry.notes],
          )
        }
      }
    }

    await query('COMMIT')
    res.json({ ok: true })
  } catch (error) {
    await query('ROLLBACK').catch(() => {})
    res.status(500).json({ error: error.message })
  }
})

app.listen(port, () => {
  console.log(`Habits API listening on http://localhost:${port}`)
})
