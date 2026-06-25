"use client";

import { useState } from "react";
import { useSessionStore } from "@/stores/sessionStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon, User, Bell, Puzzle, Users, Play } from "lucide-react";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Puzzle },
  { id: "team", label: "Team", icon: Users },
  { id: "playback", label: "Playback", icon: Play },
] as const;

type TabId = (typeof tabs)[number]["id"];

function ProfileTab() {
  const { user, theme, toggleTheme } = useSessionStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Profile</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <Separator />

      <div className="space-y-4 max-w-md">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={user?.name || ""} disabled />
          <p className="text-xs text-muted-foreground">
            Edit coming soon. Currently using default user.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={user?.email || ""} disabled />
        </div>

        <div className="space-y-1.5">
          <Label>Avatar</Label>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-fireflies-yellow flex items-center justify-center font-bold text-fireflies-navy">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "DU"}
            </div>
            <Button variant="outline" size="sm" disabled>
              Change Avatar
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Appearance</h4>
        <div className="flex items-center justify-between max-w-md p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center gap-3">
            {theme === "dark" ? (
              <Moon className="h-5 w-5 text-fireflies-yellow" />
            ) : (
              <Sun className="h-5 w-5 text-fireflies-yellow" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">Dark Mode</p>
              <p className="text-xs text-muted-foreground">
                Currently using {theme} theme
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={toggleTheme}>
            Switch to {theme === "dark" ? "Light" : "Dark"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure how you receive notifications.
        </p>
      </div>

      <Separator />

      <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
        <Bell className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">Coming Soon</p>
        <p className="text-sm text-muted-foreground/60 mt-1">
          Email and push notification settings will be available here.
        </p>
      </div>
    </div>
  );
}

function IntegrationsTab() {
  const integrations = [
    { name: "Zoom", description: "Auto-join meetings and sync recordings" },
    { name: "Google Meet", description: "Connect Google Calendar for auto-join" },
    { name: "Microsoft Teams", description: "Integrate with Teams meetings" },
    { name: "Google Calendar", description: "Sync meeting schedules" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Integrations</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your favorite tools and services.
        </p>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                {integration.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {integration.description}
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0 ml-3">
              Soon
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Team</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Manage team members and collaboration settings.
        </p>
      </div>

      <Separator />

      <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
        <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">Coming Soon</p>
        <p className="text-sm text-muted-foreground/60 mt-1">
          Team management and sharing features will be available here.
        </p>
      </div>
    </div>
  );
}

function PlaybackTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Playback</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Customize audio and transcript playback settings.
        </p>
      </div>

      <Separator />

      <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
        <Play className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">Coming Soon</p>
        <p className="text-sm text-muted-foreground/60 mt-1">
          Playback speed, auto-scroll, and transcript display options will be here.
        </p>
      </div>
    </div>
  );
}

const tabContent: Record<TabId, React.ComponentType> = {
  profile: ProfileTab,
  notifications: NotificationsTab,
  integrations: IntegrationsTab,
  team: TeamTab,
  playback: PlaybackTab,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const ActiveTabContent = tabContent[activeTab];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="border-b border-border mb-6">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-fireflies-yellow text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <ActiveTabContent />
    </div>
  );
}
