import { useEffect, useRef, useState } from "react";
import {
  X,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  UserRound,
  Fingerprint,
  KeyRound,
  Loader2,
  ArrowRight,
} from "lucide-react";

import {
  suspendUserAccess,
  reactivateUserAccess,
  revokeUserAccess,
} from "../services/access.service";

const ACTIONS = {
  SUSPEND: {
    title: "Suspendre l'habilitation",
    subtitle: "Suspension temporaire de l'accès applicatif",
    label: "Confirmer la suspension",
    loading: "Suspension en cours...",
    icon: ShieldAlert,
    iconStyle: "bg-amber-50 text-amber-700",
    buttonStyle: "bg-amber-600 hover:bg-amber-700",
    bannerStyle: "bg-amber-500",
    noticeStyle: "border-amber-200 bg-amber-50 text-amber-900",
    notice:
      "L'habilitation sera suspendue. L'utilisateur ne devra plus pouvoir obtenir de nouveaux accès autorisés à cette application tant que la suspension reste en vigueur.",
  },
  REACTIVATE: {
    title: "Réactiver l'habilitation",
    subtitle: "Rétablissement de l'accès applicatif",
    label: "Confirmer la réactivation",
    loading: "Réactivation en cours...",
    icon: ShieldCheck,
    iconStyle: "bg-blue-50 text-[#003B7A]",
    buttonStyle: "bg-[#003B7A] hover:bg-[#002d5c]",
    bannerStyle: "bg-[#003B7A]",
    noticeStyle: "border-blue-200 bg-blue-50 text-blue-900",
    notice:
      "L'habilitation retrouvera son statut actif. L'accès effectif restera soumis au statut du compte utilisateur et aux contrôles de sécurité de CHAD-SSO.",
  },
  REVOKE: {
    title: "Révoquer l'habilitation",
    subtitle: "Retrait définitif de l'accès applicatif",
    label: "Confirmer la révocation",
    loading: "Révocation en cours...",
    icon: ShieldX,
    iconStyle: "bg-red-50 text-red-700",
    buttonStyle: "bg-red-600 hover:bg-red-700",
    bannerStyle: "bg-red-600",
    noticeStyle: "border-red-200 bg-red-50 text-red-900",
    notice:
      "Cette opération retire définitivement l'habilitation dans le modèle actuel. Une nouvelle attribution pourra nécessiter une procédure administrative spécifique.",
  },
};

export default function AccessActionModal({
  user,
  access,
  action,
  onClose,
  onCompleted,
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submittingRef = useRef(false);
  const cancelRef = useRef(null);

  const config = ACTIONS[action];

  const applicationId =
    typeof access?.application === "object"
      ? access.application?._id
      : access?.application;

  const applicationName =
    typeof access?.application === "object"
      ? access.application?.name || access.application?.code || "Application"
      : "Application";

  const applicationCode =
    typeof access?.application === "object" ? access.application?.code : null;

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  const initials = [user?.firstName?.charAt(0), user?.lastName?.charAt(0)]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !submittingRef.current) {
        event.stopPropagation();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!config) return null;

  const ActionIcon = config.icon;

  async function handleConfirm(event) {
    event.preventDefault();

    if (submittingRef.current) return;

    if (!user?._id || !applicationId) {
      setError("Identifiant utilisateur ou application manquant.");
      return;
    }

    if (action === "REVOKE" && !reason.trim()) {
      setError("Le motif de révocation est obligatoire.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      let result;

      if (action === "SUSPEND") {
        result = await suspendUserAccess(user._id, applicationId);
      } else if (action === "REACTIVATE") {
        result = await reactivateUserAccess(user._id, applicationId);
      } else if (action === "REVOKE") {
        result = await revokeUserAccess(user._id, applicationId, reason.trim());
      }

      onCompleted(result);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Impossible d'exécuter cette opération.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-[3px]">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="access-action-title"
        aria-describedby="access-action-description"
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className={`h-1.5 shrink-0 ${config.bannerStyle}`} />

        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${config.iconStyle}`}
            >
              <ActionIcon size={27} strokeWidth={1.8} />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
                Sécurité des accès
              </p>

              <h2
                id="access-action-title"
                className="mt-1 text-xl font-bold text-slate-900"
              >
                {config.title}
              </h2>

              <p
                id="access-action-description"
                className="mt-2 text-sm leading-5 text-slate-500"
              >
                {config.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Fermer"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-40"
          >
            <X size={19} />
          </button>
        </div>

        {/* Corps */}
        <form
          id="access-action-form"
          onSubmit={handleConfirm}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6"
        >
          {/* Utilisateur */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Utilisateur concerné
            </p>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white font-bold text-[#003B7A] ring-1 ring-slate-200">
                {initials || <UserRound size={21} />}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {fullName || "Utilisateur"}
                </p>

                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Fingerprint size={13} />
                  {user?.matricule || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Application */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#003B7A]">
                <KeyRound size={20} />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-blue-700">Application concernée</p>

                <p className="mt-1 break-words text-sm font-semibold text-blue-950">
                  {applicationName}
                </p>

                {applicationCode && (
                  <p className="mt-1 text-xs text-blue-700">
                    Code : {applicationCode}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Conséquences */}
          <div
            className={`flex items-start gap-3 rounded-xl border p-4 ${config.noticeStyle}`}
          >
            <AlertTriangle size={19} className="mt-0.5 shrink-0" />

            <div>
              <p className="text-sm font-semibold">
                Conséquences de l'opération
              </p>

              <p className="mt-1 text-xs leading-5">{config.notice}</p>
            </div>
          </div>

          {/* Motif obligatoire pour révocation */}
          {action === "REVOKE" && (
            <div>
              <label
                htmlFor="access-revoke-reason"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Motif de révocation
                <span className="ml-1 text-red-600">*</span>
              </label>

              <textarea
                id="access-revoke-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
                minLength={3}
                maxLength={500}
                rows={3}
                disabled={submitting}
                placeholder="Précisez le motif administratif de cette révocation..."
                className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-[#003B7A] focus:outline-none focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
              />

              <p className="mt-2 text-xs text-slate-500">
                Ce motif sera transmis au service de révocation.
              </p>
            </div>
          )}

          {/* Erreurs */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
            >
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </form>

        {/* Pied fixe */}
        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            type="submit"
            form="access-action-form"
            disabled={
              submitting || (action === "REVOKE" && reason.trim().length < 3)
            }
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${config.buttonStyle}`}
          >
            {submitting ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                {config.loading}
              </>
            ) : (
              <>
                {config.label}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
