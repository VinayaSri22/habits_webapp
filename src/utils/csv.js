export function parseCsvLine(line) {
  const result = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === ',') {
      result.push(field)
      field = ''
    } else if (char === '"') {
      inQuotes = true
    } else {
      field += char
    }
  }
  result.push(field)
  return result
}

export function csvLine(fields) {
  return `${fields
    .map((field) => {
      const value = field ?? ''
      if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`
      return value
    })
    .join(',')}\n`
}

export function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.length > 0)
  if (lines.length === 0) return []
  const headers = parseCsvLine(lines[0]).map((header) => header.trim())
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line)
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']))
  })
}

export function parseCsvTable(text) {
  return text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map(parseCsvLine)
}
