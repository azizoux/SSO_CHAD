import { useEffect, useState } from "react";
import { X, RefreshCw, KeyRound, Plus } from "lucide-react";

import GrantAccessForm from "./GrantAccessForm";
import { getUserAccesses } from "../services/access.service";

const STATUS_CLASSES = {
  ACTIVE: "bg-green-50 text-green-700",
  SUSPENDED: "bg-red-50 text-red-700",
  REVOKED: "bg-slate-100 text-slate-600",
};

export default function UserAccessModal({ user, onClose }) {
  const [accesses, setAccesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [showGrantForm, setShowGrantForm] = useState(false);

  const userIsActive = user.status === "ACTIVE";

  useEffect(() => {
    let active = true;

    async function loadAccesses() {
      setLoading(true);
      setError("");

      try {
        const result = await getUserAccesses(user._id);

        if (!active) return;

        setAccesses(result.data || []);
      } catch (err) {
        if (!active) return;

        setAccesses([]);
        setShowGrantForm(false);

        setError(
          err.response?.data?.error?.message ||
            "Impossible de charger les habilitations.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAccesses();

    return () => {
      active = false;
    };
  }, [user._id, reloadKey]);

  const canGrantAccess = !loading && !error && !showGrantForm && userIsActive;

  function handleRefresh() {
    setShowGrantForm(false);
    setReloadKey((value) => value + 1);
  }

  function handleGrantSuccess() {
    setShowGrantForm(false);
    setReloadKey((value) => value + 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-modal-title"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        {/* En-tête */}
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound size={22} className="text-[#003B7A]" />

              <h3
                id="access-modal-title"
                className="text-lg font-bold text-[#003B7A]"
              >
                Habilitations applicatives
              </h3>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {user.firstName} {user.lastName}
              {" — "}
              {user.matricule}
            </p>

            {!userIsActive && (
              <p className="mt-2 text-xs font-medium text-amber-700">
                Compte utilisateur non actif : l'attribution de nouvelles
                habilitations est désactivée.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenu principal */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
          {/* Barre d'actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-700">
              {loading ? "Chargement..." : `${accesses.length} habilitation(s)`}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || showGrantForm}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={16} />
                Actualiser
              </button>

              <button
                type="button"
                onClick={() => setShowGrantForm(true)}
                disabled={!canGrantAccess}
                className="flex items-center gap-2 rounded-lg bg-[#003B7A] px-3 py-2 text-sm font-medium text-white hover:bg-[#002d5c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} />
                Ajouter une habilitation
              </button>
            </div>
          </div>

          {/* Erreurs */}
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Formulaire d'attribution */}
          {showGrantForm && !loading && !error && userIsActive && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-5">
              <GrantAccessForm
                user={user}
                existingAccesses={accesses}
                onCancel={() => setShowGrantForm(false)}
                onSuccess={handleGrantSuccess}
              />
            </div>
          )}

          {/* Liste des habilitations */}
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Chargement des habilitations...
            </p>
          ) : error ? null : accesses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
              <KeyRound size={30} className="mx-auto text-slate-400" />

              <p className="mt-3 text-sm font-medium text-slate-700">
                Aucune habilitation applicative
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Cet utilisateur ne dispose d'aucun accès enregistré.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {accesses.map((access) => (
                <div
                  key={access._id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {access.application?.code || "Application inconnue"}
                      </h4>

                      <p className="mt-1 text-xs text-slate-500">
                        {access.application?.name || "—"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        STATUS_CLASSES[access.status] ||
                        "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {access.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {/* Rôles */}
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Rôles applicatifs
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {(access.roles || []).map((role) => (
                          <span
                            key={role}
                            className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700"
                          >
                            {role}
                          </span>
                        ))}

                        {!access.roles?.length && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </div>

                    {/* Scopes */}
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Scopes autorisés
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {(access.scopes || []).map((scope) => (
                          <span
                            key={scope}
                            className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700"
                          >
                            {scope}
                          </span>
                        ))}

                        {!access.scopes?.length && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date d'attribution */}
                  <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    Attribuée le{" "}
                    {access.grantedAt
                      ? new Date(access.grantedAt).toLocaleString("fr-FR")
                      : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pied de fenêtre */}
        <div className="flex justify-end border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>
      </section>
    </div>
  );
}
