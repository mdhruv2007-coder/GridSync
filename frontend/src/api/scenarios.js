import client from './client'

export async function listScenarios() {
  const res = await client.get('/scenarios')
  return res.data
}

export async function createScenario(data) {
  const res = await client.post('/scenarios', data)
  return res.data
}

export async function getScenario(id) {
  const res = await client.get(`/scenarios/${id}`)
  return res.data
}

export async function deleteScenario(id) {
  await client.delete(`/scenarios/${id}`)
}

// Idempotent: returns the existing "Sample Household" if it is already saved.
export async function seedScenario() {
  const res = await client.post('/scenarios/seed')
  return res.data
}
