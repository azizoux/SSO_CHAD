import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  AppWindow,
  Monitor,
  KeyRound,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";

import StatCard from "../components/StatCard";
import { getDashboardStatistics } from "../services/dashboard.service";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStatistics() {
    setLoading(true);
    setError("");

    try {
      const data = await getDashboardStatistics();
      setStats(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Impossible de récupérer les statistiques CHAD-SSO.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatistics();
  }, []);

  const indicators = [
    {
      title: "Utilisateurs",
      value: stats?.users?.total,
      icon: Users,
      description: `${stats?.users?.active ?? "—"} comptes actifs`,
    },
    {
      title: "Organisations",
      value: stats?.organizations?.total,
      icon: Building2,
      description: "Structures enregistrées",
    },
    {
      title: "Applications",
      value: stats?.applications?.total,
      icon: AppWindow,
      description: `${stats?.applications?.active ?? "—"} applications actives`,
    },
    {
      title: "Sessions actives",
      value: stats?.sessions?.active,
      icon: Monitor,
      description: "Sessions SSO non expirées",
    },
    {
      title: "Habilitations actives",
      value: stats?.access?.active,
      icon: KeyRound,
      description: "Autorisations applicatives",
    },
    {
      title: "Accès suspendus",
      value: stats?.access?.suspended,
      icon: ShieldAlert,
      description: "Habilitations suspendues",
    },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Tableau de bord</h2>
          <p className="mt-1 text-sm text-slate-500">
            Supervision nationale des identités et des accès
          </p>
        </div>

        <button
          type="button"
          onClick={loadStatistics}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {indicators.map((indicator) => (
          <StatCard
            key={indicator.title}
            {...indicator}
            value={error ? null : indicator.value}
            loading={loading}
          />
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-primary">
          État de la plateforme
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Les indicateurs proviennent directement des collections MongoDB de
          CHAD-SSO.
        </p>

        <div className="mt-5 flex items-center gap-2 text-sm text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          Données actualisées à la demande
        </div>
      </div>
    </div>
  );
}
