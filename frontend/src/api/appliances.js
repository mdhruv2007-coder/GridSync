import client from './client'

export async function listAppliances(scenarioId) {
  const res = await client.get('/appliances', { params: { scenario_id: scenarioId } })
  return res.data
}

export async function createAppliance(data) {
  const res = await client.post('/appliances', data) // data must include scenario_id
  return res.data
}

export async function updateAppliance(id, data) {
  const res = await client.put(`/appliances/${id}`, data)
  return res.data
}

export async function deleteAppliance(id) {
  await client.delete(`/appliances/${id}`)
}
