import { NavLink, Outlet } from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Building2,
  AppWindow,
  KeyRound,
  Monitor,
  ScrollText,
  Settings,
  Bell,
} from "lucide-react";

const navigation = [
  { label: "Tableau de bord", path: "/", icon: LayoutDashboard },
  { label: "Utilisateurs", path: "/users", icon: Users },
  { label: "Organisations", path: "/organizations", icon: Building2 },
  { label: "Applications", path: "/applications", icon: AppWindow },
  { label: "Habilitations", path: "/access", icon: KeyRound },
  { label: "Sessions", path: "/sessions", icon: Monitor },
  { label: "Journal d'audit", path: "/audit", icon: ScrollText },
  { label: "Paramètres", path: "/settings", icon: Settings },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="w-full bg-primary text-white lg:fixed lg:inset-y-0 lg:w-64">
        <div className="flex items-center gap-3 border-b border-white/15 px-6 py-6">
          <ShieldCheck size={32} />
          <div>
            <div className="text-xl font-bold tracking-wide">CHAD-SSO</div>
            <div className="text-xs text-blue-100">
              Administration nationale
            </div>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                [
                  "flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-sm transition",
                  isActive
                    ? "bg-white font-semibold text-primary"
                    : "text-blue-100 hover:bg-white/10 hover:text-white",
                ].join(" ")
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 lg:ml-64">
        <header className="flex h-18 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div>
            <h1 className="text-lg font-semibold text-primary">
              Portail d'administration
            </h1>
            <p className="text-xs text-slate-500">
              Système national d'authentification unique
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Notifications"
              disabled
              title="Notifications à venir"
              className="text-slate-400 disabled:cursor-not-allowed"
            >
              <Bell size={20} />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">
              A
            </div>
          </div>
        </header>

        <main className="p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
