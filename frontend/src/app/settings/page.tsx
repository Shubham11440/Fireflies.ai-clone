"use client";

const tabs = ["Profile", "Notifications", "Integrations", "Team", "Playback"];

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="border-b border-border mb-6">
        <nav className="flex gap-4">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                i === 0
                  ? "border-fireflies-yellow text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
        <p className="text-muted-foreground text-lg">Coming Soon</p>
        <p className="text-muted-foreground/60 text-sm mt-1">
          This section is under development.
        </p>
      </div>
    </div>
  );
}
