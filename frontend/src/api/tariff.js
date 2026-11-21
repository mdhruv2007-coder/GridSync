import client from './client'

export async function fetchTariff(scenarioId) {
  const res = await client.get('/tariff', { params: { scenario_id: scenarioId } })
  return res.data
}

export async function saveTariff(data) {
  const res = await client.put('/tariff', data) // data must include scenario_id
  return res.data
}

export async function fetchPresets() {
  const res = await client.get('/tariff/presets')
  return res.data
}
