import { useEffect, useState } from "react";
import {
  X,
  RefreshCw,
  KeyRound,
  Plus,
  Pencil,
  PauseCircle,
  PlayCircle,
  ShieldX,
  UserRound,
  Fingerprint,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

import GrantAccessForm from "./GrantAccessForm";
import EditAccessModal from "./EditAccessModal";
import AccessActionModal from "./AccessActionModal";

import { getUserAccesses } from "../services/access.service";

const STATUS_CLASSES = {
  ACTIVE: "bg-green-50 text-green-700",
  SUSPENDED: "bg-amber-50 text-amber-700",
  REVOKED: "bg-red-50 text-red-700",
};

const STATUS_LABELS = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  REVOKED: "Révoqué",
};

export default function UserAccessModal({ user, onClose }) {
  const [accesses, setAccesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [showGrantForm, setShowGrantForm] = useState(false);
  const [editingAccess, setEditingAccess] = useState(null);
  const [actionAccess, setActionAccess] = useState(null);
  const [actionType, setActionType] = useState(null);

  const userIsActive = user.status === "ACTIVE";

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  const initials = [user.firstName?.charAt(0), user.lastName?.charAt(0)]
    .filter(Boolean)
    .join("")
    .toUpperCase();

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

  function refreshAccesses() {
    setShowGrantForm(false);
    setEditingAccess(null);
    setActionAccess(null);
    setActionType(null);
    setReloadKey((value) => value + 1);
  }

  function openAction(access, type) {
    setActionAccess(access);
    setActionType(type);
  }

  function closeAction() {
    setActionAccess(null);
    setActionType(null);
  }

  const canGrantAccess = userIsActive && !loading && !error && !showGrantForm;

  const modalOpen = Boolean(editingAccess || actionAccess);

  return (
    <>
      {/* Modal principal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[3px]">
        <section
          role="dialog"
          aria-modal={!modalOpen}
          aria-labelledby="user-access-title"
          className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          {/* Bandeau */}
          <div className="h-1.5 shrink-0 bg-[#003B7A]" />

          {/* En-tête */}
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#003B7A]">
                <KeyRound size={26} />
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#003B7A]">
                  Gestion des habilitations
                </p>

                <h2
                  id="user-access-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  Habilitations applicatives
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Gestion des accès aux applications publiques.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={modalOpen}
              aria-label="Fermer"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-40"
            >
              <X size={20} />
            </button>
          </div>

          {/* Corps */}
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6 sm:px-8">
            {/* Identité utilisateur */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white font-bold text-[#003B7A] ring-1 ring-slate-200">
                {initials || <UserRound size={22} />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">
                  {fullName || "Utilisateur"}
                </p>

                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Fingerprint size={13} />
                  {user.matricule || "—"}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  userIsActive
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {userIsActive ? "Compte actif" : "Compte non actif"}
              </span>
            </div>

            {/* Barre d'actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Applications autorisées
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {loading
                    ? "Chargement..."
                    : `${accesses.length} habilitation(s) enregistrée(s)`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={refreshAccesses}
                  disabled={loading || showGrantForm || modalOpen}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw size={16} />
                  Actualiser
                </button>

                <button
                  type="button"
                  onClick={() => setShowGrantForm(true)}
                  disabled={!canGrantAccess || modalOpen}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#003B7A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#002d5c] disabled:opacity-50"
                >
                  <Plus size={17} />
                  Ajouter une habilitation
                </button>
              </div>
            </div>

            {/* Erreurs */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
              >
                <AlertCircle size={19} className="shrink-0 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Formulaire d'attribution */}
            {showGrantForm && !loading && !error && userIsActive && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-5">
                <GrantAccessForm
                  user={user}
                  existingAccesses={accesses}
                  onCancel={() => setShowGrantForm(false)}
                  onSuccess={refreshAccesses}
                />
              </div>
            )}

            {/* Chargement */}
            {loading ? (
              <div
                role="status"
                className="flex flex-col items-center justify-center py-12"
              >
                <Loader2 size={28} className="animate-spin text-[#003B7A]" />

                <p className="mt-3 text-sm text-slate-500">
                  Chargement des habilitations...
                </p>
              </div>
            ) : error ? null : accesses.length === 0 ? (
              /* Liste vide */
              <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
                <KeyRound size={32} className="mx-auto text-slate-400" />

                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Aucune habilitation enregistrée
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Cet utilisateur ne dispose d'aucun accès applicatif.
                </p>
              </div>
            ) : (
              /* Liste des habilitations */
              <div className="space-y-4">
                {accesses.map((access) => {
                  const isActive = access.status === "ACTIVE";
                  const isSuspended = access.status === "SUSPENDED";
                  const isRevoked = access.status === "REVOKED";

                  return (
                    <div
                      key={access._id}
                      className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm"
                    >
                      {/* Application et statut */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#003B7A]">
                            <ShieldCheck size={21} />
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {access.application?.code ||
                                "Application inconnue"}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {access.application?.name || "—"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            STATUS_CLASSES[access.status] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {STATUS_LABELS[access.status] || access.status}
                        </span>
                      </div>

                      {/* Rôles et scopes */}
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-500">
                            Rôles applicatifs
                          </p>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(access.roles || []).map((role) => (
                              <span
                                key={role}
                                className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-[#003B7A]"
                              >
                                {role}
                              </span>
                            ))}

                            {!access.roles?.length && (
                              <span className="text-xs text-slate-400">
                                Aucun rôle
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-500">
                            Scopes autorisés
                          </p>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(access.scopes || []).map((scope) => (
                              <span
                                key={scope}
                                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                              >
                                {scope}
                              </span>
                            ))}

                            {!access.scopes?.length && (
                              <span className="text-xs text-slate-400">
                                Aucun scope
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Pied de carte */}
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <p className="text-xs text-slate-500">
                          Attribuée le{" "}
                          {access.grantedAt
                            ? new Date(access.grantedAt).toLocaleString("fr-FR")
                            : "—"}
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          {!isRevoked && (
                            <button
                              type="button"
                              onClick={() => setEditingAccess(access)}
                              disabled={modalOpen || showGrantForm}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              <Pencil size={14} />
                              Modifier
                            </button>
                          )}

                          {isActive && (
                            <button
                              type="button"
                              onClick={() => openAction(access, "SUSPEND")}
                              disabled={modalOpen || showGrantForm}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                            >
                              <PauseCircle size={15} />
                              Suspendre
                            </button>
                          )}

                          {isSuspended && (
                            <button
                              type="button"
                              onClick={() => openAction(access, "REACTIVATE")}
                              disabled={
                                modalOpen || showGrantForm || !userIsActive
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-800 hover:bg-green-100 disabled:opacity-50"
                            >
                              <PlayCircle size={15} />
                              Réactiver
                            </button>
                          )}

                          {!isRevoked && (
                            <button
                              type="button"
                              onClick={() => openAction(access, "REVOKE")}
                              disabled={modalOpen || showGrantForm}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              <ShieldX size={15} />
                              Révoquer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pied */}
          <div className="flex shrink-0 justify-end border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:px-8">
            <button
              type="button"
              onClick={onClose}
              disabled={modalOpen}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Fermer
            </button>
          </div>
        </section>
      </div>

      {/* Modification */}
      {editingAccess && (
        <EditAccessModal
          user={user}
          access={editingAccess}
          onClose={() => setEditingAccess(null)}
          onUpdated={refreshAccesses}
        />
      )}

      {/* Suspension, réactivation, révocation */}
      {actionAccess && actionType && (
        <AccessActionModal
          user={user}
          access={actionAccess}
          action={actionType}
          onClose={closeAction}
          onCompleted={refreshAccesses}
        />
      )}
    </>
  );
}
