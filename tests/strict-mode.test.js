import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('app root is not wrapped in React StrictMode to avoid duplicated startup side effects', async () => {
  const source = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8')

  assert.equal(source.includes('<StrictMode>'), false)
})
