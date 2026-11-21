import { useCallback, useState } from 'react'
import { useScenario } from '../context/ScenarioContext'
import { optimise } from '../api/schedule'
import { getErrorMessage } from '../api/client'

// Calls POST /api/schedule/optimize with the current appliances and tariff,
// then stores { baseline, optimised, savings, warnings } in the context.
export default function useOptimise() {
  const { appliances, tariff, setPlan } = useScenario()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = useCallback(async () => {
    if (appliances.length === 0) {
      setError('Add at least one appliance first.')
      return null
    }
    setLoading(true)
    setError('')
    try {
      const data = await optimise(appliances, tariff)
      setPlan(data)
      return data
    } catch (e) {
      setError(getErrorMessage(e))
      return null
    } finally {
      setLoading(false)
    }
  }, [appliances, tariff, setPlan])

  return { run, loading, error }
}
