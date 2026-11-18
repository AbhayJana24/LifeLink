import { CompatibilityChart } from "@/components/compatibility-chart";

const steps = [
  {
    title: "Post an urgent request",
    body: "Blood group, units needed and hospital location. It takes 30 seconds.",
  },
  {
    title: "We find matching donors",
    body: "Compatible, eligible donors within a few km are found instantly using geo search.",
  },
  {
    title: "Donors get alerted",
    body: "Nearby donors receive an SMS and can accept with one tap. Contact details stay private until they do.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-xl font-bold tracking-tight">
          <span className="text-brand">●</span> LifeLink
        </span>
        <nav className="flex gap-3 text-sm">
          <a href="#how" className="rounded-full px-4 py-2 hover:bg-red-50">
            How it works
          </a>
          <a href="#chart" className="rounded-full px-4 py-2 hover:bg-red-50">
            Compatibility
          </a>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
          <p className="mb-4 inline-block rounded-full bg-red-100 px-4 py-1 text-sm font-medium text-red-700">
            Now live in Delhi NCR
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Find a compatible blood donor <span className="text-brand">near you</span>, in minutes.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
            LifeLink matches urgent blood and plasma requests with eligible donors nearby and alerts
            them instantly. No more forwarding messages across WhatsApp groups.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <button className="rounded-full bg-brand px-8 py-3 font-semibold text-white shadow-lg shadow-red-200 hover:bg-red-700">
              Request blood
            </button>
            <button className="rounded-full border border-red-200 bg-white px-8 py-3 font-semibold text-red-700 hover:bg-red-50">
              Become a donor
            </button>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mb-10 text-center text-3xl font-bold">How it works</h2>
          <ol className="grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 font-bold text-red-700">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-neutral-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="chart" className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold">Who can donate to whom?</h2>
          <p className="mb-8 mt-3 text-center text-neutral-600">
            Generated from LifeLink&apos;s matching engine (whole blood). O− is the universal donor,
            AB+ the universal recipient.
          </p>
          <CompatibilityChart />
        </section>
      </main>

      <footer className="border-t border-red-100 py-8 text-center text-sm text-neutral-500">
        LifeLink is a portfolio project. Always follow the screening done by a licensed blood bank.
      </footer>
    </div>
  );
}
