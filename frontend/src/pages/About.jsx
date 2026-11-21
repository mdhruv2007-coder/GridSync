// About.jsx - what GridSync is, how to use it, how it works, honesty statements, limitations.
import Card from '../components/common/Card'

export default function About() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">About GridSync</h1>

      <Card title="What it is and the problem it solves">
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            GridSync is a software-only appliance scheduler for Time-of-Day (ToD) electricity
            tariffs. You enter your appliances and tariff slots, and GridSync moves flexible
            appliances into the cheapest feasible hours without breaking deadlines or a load limit.
          </p>
          <p>
            Demand peaks in the evening and that costs distribution companies more. India now
            requires ToD tariffs for smart-meter consumers, but households, hostels, PGs and
            canteens rarely know which hours are cheaper, and cannot easily schedule many
            appliances around deadlines such as a geyser ready by 7 AM. Flexible loads like water
            heaters, washing machines, EV chargers and pumps often run at costly times, which
            raises bills and grid peak demand.
          </p>
        </div>
      </Card>

      <Card title="How to use it (5 steps)">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>Load the Sample Household, or add your own appliances on the Appliances page.</li>
          <li>Set the tariff on the Tariff page: base rate, load limit and the slot percentages.</li>
          <li>Open the Dashboard and click Optimise Schedule.</li>
          <li>Drag an appliance block to another hour to adjust the plan and watch the cost update.</li>
          <li>Export the schedule as CSV from the Dashboard, and save the setup on the Scenarios page.</li>
        </ol>
      </Card>

      <Card title="How the scheduler works">
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>
            The day is a circular 24-hour clock, so a window such as 22:00 to 07:00 is allowed.
          </li>
          <li>
            Flexible appliances are moved into the cheapest feasible hours inside their own window
            (earliest start and deadline).
          </li>
          <li>
            The total load in any hour must stay under the maximum load you set in the tariff.
          </li>
          <li>Fixed appliances (such as a fridge) never move.</li>
          <li>Interruptible appliances, such as an EV charger, may run in separate hours.</li>
        </ul>
      </Card>

      <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <h2 className="mb-2 text-base font-semibold">Please read: honesty statements</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            GridSync is a decision-support tool. It does not control appliances and does not read
            real meters.
          </li>
          <li>
            Tariff values are configurable samples. Edit them to match your own bill. They are not
            the actual rates of BESCOM or any other company.
          </li>
          <li>
            All savings are modelled estimates calculated from the appliance ratings and hours you
            declare.
          </li>
        </ul>
      </div>

      <Card title="Limitations">
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Durations are whole hours only.</li>
          <li>One tariff is used for the whole day, with no weekday or seasonal variation.</li>
          <li>Appliance power is the declared rating, not a measured value.</li>
          <li>The schedule is advice only: nothing is switched on or off for you.</li>
        </ul>
      </Card>

      <p className="text-sm text-slate-500">
        Built with React, Vite, Tailwind CSS, Recharts and dnd-kit on the frontend, and FastAPI,
        SQLAlchemy and SQLite on the backend.
      </p>
    </div>
  )
}
