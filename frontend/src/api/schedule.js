import client from './client'

// Both calls are stateless: appliances and tariff travel in the request body.
function cleanTariff(tariff) {
  return {
    base_rate: tariff.base_rate,
    max_load_kw: tariff.max_load_kw,
    slots: tariff.slots,
  }
}

export async function optimise(appliances, tariff) {
  const res = await client.post('/schedule/optimize', {
    appliances,
    tariff: cleanTariff(tariff),
  })
  return res.data // { baseline, optimised, savings, warnings }
}

export async function evaluate(appliances, tariff, items) {
  const res = await client.post('/schedule/evaluate', {
    appliances,
    tariff: cleanTariff(tariff),
    items,
  })
  return res.data // ScheduleResult
}
