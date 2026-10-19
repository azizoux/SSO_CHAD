import { useEffect, useRef, useState } from "react";
import {
  X,
  KeyRound,
  ShieldCheck,
  Building2,
  UserRound,
  Fingerprint,
  AlertCircle,
  Info,
  Loader2,
  Save,
  Check,
} from "lucide-react";

import { updateUserAccess } from "../services/access.service";
import { getApplicationById } from "../services/applications.service";

export default function EditAccessModal({ user, access, onClose, onUpdated }) {
  const [rolesText, setRolesText] = useState((access.roles || []).join(", "));

  const [scopes, setScopes] = useState(access.scopes || []);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submittingRef = useRef(false);
  const cancelRef = useRef(null);

  const applicationId =
    typeof access.application === "object"
      ? access.application?._id
      : access.application;

  const applicationName =
    access.application?.name || access.application?.code || "Application";

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  const initials = [user.firstName?.charAt(0), user.lastName?.charAt(0)]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  useEffect(() => {
    let active = true;

    async function loadApplication() {
      setLoading(true);
      setError("");

      try {
        if (!applicationId) {
          throw new Error("Identifiant de l'application manquant.");
        }

        const result = await getApplicationById(applicationId);

        if (!active) return;

        setApplication(result);
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.error?.message ||
            err.message ||
            "Impossible de charger les paramètres de l'application.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadApplication();

    return () => {
      active = false;
    };
  }, [applicationId]);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  const allowedScopes = application?.allowedScopes || [];

  function toggleScope(scope) {
    setScopes((previous) =>
      previous.includes(scope)
        ? previous.filter((item) => item !== scope)
        : [...previous, scope],
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submittingRef.current || loading || !application) return;

    const roles = [
      ...new Set(
        rolesText
          .split(",")
          .map((role) => role.trim())
          .filter(Boolean),
      ),
    ];

    if (roles.length === 0) {
      setError("Veuillez renseigner au moins un rôle applicatif.");
      return;
    }

    const invalidScopes = scopes.filter(
      (scope) => !allowedScopes.includes(scope),
    );

    if (invalidScopes.length > 0) {
      setError(`Scopes non autorisés : ${invalidScopes.join(", ")}`);
      return;
    }

    if (!scopes.includes("openid")) {
      setError("Le scope openid est obligatoire pour une application OIDC.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      await updateUserAccess(user._id, applicationId, {
        roles,
        scopes,
      });

      onUpdated();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Impossible de modifier l'habilitation.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[3px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-access-title"
        aria-describedby="edit-access-description"
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Bandeau supérieur */}
        <div className="h-1.5 shrink-0 bg-[#003B7A]" />

        {/* En-tête */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#003B7A]">
              <KeyRound size={26} strokeWidth={1.8} />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#003B7A]">
                Gestion des habilitations
              </p>

              <h2
                id="edit-access-title"
                className="mt-1 text-xl font-bold text-slate-900"
              >
                Modifier une habilitation
              </h2>

              <p
                id="edit-access-description"
                className="mt-1 text-sm text-slate-500"
              >
                Modifier les droits applicatifs d'un utilisateur.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Fermer"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {/* Utilisateur */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Utilisateur concerné
            </p>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white font-bold text-[#003B7A] ring-1 ring-slate-200">
                {initials || <UserRound size={22} />}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {fullName || "Utilisateur"}
                </p>

                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Fingerprint size={13} />
                  {user.matricule || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Application */}
          <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#003B7A]">
              <Building2 size={21} />
            </div>

            <div>
              <p className="text-xs text-blue-700">Application concernée</p>

              <p className="mt-1 text-sm font-semibold text-blue-950">
                {applicationName}
              </p>

              {access.application?.code && (
                <p className="mt-1 text-xs text-blue-700">
                  Code : {access.application.code}
                </p>
              )}
            </div>
          </div>

          {loading ? (
            <div
              role="status"
              className="flex items-center justify-center gap-3 py-8 text-sm text-slate-500"
            >
              <Loader2 size={20} className="animate-spin text-[#003B7A]" />
              Chargement des autorisations...
            </div>
          ) : (
            <form
              id="edit-access-form"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Rôles */}
              <div>
                <label
                  htmlFor="access-roles"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"
                >
                  <ShieldCheck size={17} className="text-[#003B7A]" />
                  Rôles applicatifs
                </label>

                <input
                  id="access-roles"
                  type="text"
                  value={rolesText}
                  onChange={(event) => setRolesText(event.target.value)}
                  disabled={submitting || !application}
                  placeholder="USER, MANAGER"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#003B7A] focus:outline-none focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Séparez les rôles par des virgules. Exemple : USER, MANAGER.
                </p>
              </div>

              {/* Scopes */}
              <fieldset disabled={submitting || !application}>
                <legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <KeyRound size={17} className="text-[#003B7A]" />
                  Scopes autorisés
                </legend>

                <div className="grid gap-2 sm:grid-cols-2">
                  {allowedScopes.map((scope) => {
                    const selected = scopes.includes(scope);

                    return (
                      <label
                        key={scope}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                          selected
                            ? "border-blue-200 bg-blue-50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleScope(scope)}
                          className="h-4 w-4 accent-[#003B7A]"
                        />

                        <span className="flex-1 text-sm font-medium text-slate-700">
                          {scope}
                        </span>

                        {selected && (
                          <Check size={15} className="text-[#003B7A]" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Information */}
              <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <Info size={18} className="mt-0.5 shrink-0 text-[#003B7A]" />

                <p className="text-xs leading-5 text-blue-900">
                  Les modifications des rôles et scopes affectent les
                  autorisations de cet utilisateur pour cette application. Les
                  autres applications ne sont pas modifiées.
                </p>
              </div>
            </form>
          )}

          {/* Erreurs */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />

              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Pied */}
        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            type="submit"
            form="edit-access-form"
            disabled={submitting || loading || !application}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#003B7A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#002d5c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save size={17} />
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
