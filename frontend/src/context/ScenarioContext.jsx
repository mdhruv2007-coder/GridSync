import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { seedScenario, getScenario } from '../api/scenarios'
import { getErrorMessage } from '../api/client'
import { baselineItems, computeResult, computeSavings, emptyResult } from '../utils/cost'

// Sample tariff so the UI works before anything is loaded (editable, not real rates).
export const DEFAULT_TARIFF = {
  base_rate: 7.0,
  max_load_kw: 5.0,
  slots: [
    { start_hour: 0, end_hour: 6, label: 'offpeak', adjustment_pct: 0 },
    { start_hour: 6, end_hour: 9, label: 'normal', adjustment_pct: 0 },
    { start_hour: 9, end_hour: 17, label: 'solar', adjustment_pct: -15 },
    { start_hour: 17, end_hour: 22, label: 'peak', adjustment_pct: 20 },
    { start_hour: 22, end_hour: 24, label: 'normal', adjustment_pct: 0 },
  ],
}

const ScenarioContext = createContext(null)

export function ScenarioProvider({ children }) {
  const [appliances, setAppliances] = useState([])
  const [tariff, setTariffState] = useState(DEFAULT_TARIFF)
  const [scenarioId, setScenarioId] = useState(null) // null = not saved yet
  const [scenarioName, setScenarioName] = useState('')
  // plan = { baseline, optimised, savings, warnings } after Optimise, otherwise null
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ---- appliance actions (any change makes the old plan stale, so clear it) ----
  const addAppliance = useCallback((data) => {
    setAppliances((prev) => {
      const id = prev.reduce((max, a) => Math.max(max, a.id), 0) + 1 // local id
      return [...prev, { ...data, id }]
    })
    setPlan(null)
  }, [])

  const updateAppliance = useCallback((id, data) => {
    setAppliances((prev) => prev.map((a) => (a.id === id ? { ...a, ...data, id } : a)))
    setPlan(null)
  }, [])

  const removeAppliance = useCallback((id) => {
    setAppliances((prev) => prev.filter((a) => a.id !== id))
    setPlan(null)
  }, [])

  // ---- tariff action ----
  const setTariff = useCallback((t) => {
    setTariffState({ base_rate: t.base_rate, max_load_kw: t.max_load_kw, slots: t.slots })
    setPlan(null)
  }, [])

  // ---- load / reset ----
  const applyScenario = useCallback((detail) => {
    setAppliances(detail.appliances || [])
    if (detail.tariff) {
      setTariffState({
        base_rate: detail.tariff.base_rate,
        max_load_kw: detail.tariff.max_load_kw,
        slots: detail.tariff.slots,
      })
    }
    setScenarioId(detail.id)
    setScenarioName(detail.name)
    setPlan(null)
  }, [])

  const loadSample = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const detail = await seedScenario()
      applyScenario(detail)
      return detail
    } catch (e) {
      setError(getErrorMessage(e))
      return null
    } finally {
      setLoading(false)
    }
  }, [applyScenario])

  const loadScenario = useCallback(
    async (id) => {
      setLoading(true)
      setError('')
      try {
        const detail = await getScenario(id)
        applyScenario(detail)
        return detail
      } catch (e) {
        setError(getErrorMessage(e))
        return null
      } finally {
        setLoading(false)
      }
    },
    [applyScenario],
  )

  const resetAll = useCallback(() => {
    setAppliances([])
    setTariffState(DEFAULT_TARIFF)
    setScenarioId(null)
    setScenarioName('')
    setPlan(null)
    setError('')
  }, [])

  // ---- drag and drop: replace the optimised schedule and recompute cost locally ----
  const updateOptimisedItems = useCallback(
    (items) => {
      if (!plan) return null
      try {
        const optimised = computeResult(appliances, items, tariff)
        setPlan({
          ...plan,
          optimised,
          savings: computeSavings(plan.baseline.total_cost, optimised.total_cost),
        })
        return optimised
      } catch (e) {
        setError(getErrorMessage(e))
        return null
      }
    },
    [plan, appliances, tariff],
  )

  // Baseline is always computed live from the usual start times.
  const localBaseline = useMemo(() => {
    try {
      return computeResult(appliances, baselineItems(appliances), tariff)
    } catch {
      return emptyResult() // tariff incomplete while being edited
    }
  }, [appliances, tariff])

  const value = useMemo(
    () => ({
      appliances,
      tariff,
      scenarioId,
      scenarioName,
      plan,
      baseline: plan?.baseline ?? localBaseline,
      optimised: plan?.optimised ?? null,
      savings: plan?.savings ?? null,
      warnings: plan?.warnings ?? [],
      loading,
      error,
      setPlan,
      setError,
      setScenarioId,
      setScenarioName,
      addAppliance,
      updateAppliance,
      removeAppliance,
      setTariff,
      applyScenario,
      loadSample,
      loadScenario,
      resetAll,
      updateOptimisedItems,
    }),
    [
      appliances, tariff, scenarioId, scenarioName, plan, localBaseline, loading, error,
      addAppliance, updateAppliance, removeAppliance, setTariff, applyScenario,
      loadSample, loadScenario, resetAll, updateOptimisedItems,
    ],
  )

  return <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>
}

export function useScenario() {
  const ctx = useContext(ScenarioContext)
  if (!ctx) throw new Error('useScenario must be used inside <ScenarioProvider>')
  return ctx
}
