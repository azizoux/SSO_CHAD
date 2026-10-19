import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  X,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Fingerprint,
  Loader2,
  ArrowRight,
  Info,
} from "lucide-react";

import { suspendUser, activateUser } from "../services/users.service";

export default function UserStatusModal({
  user,
  action,
  onClose,
  onCompleted,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submittingRef = useRef(false);
  const cancelButtonRef = useRef(null);

  const isSuspend = action === "SUSPEND";

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  const initials = [user?.firstName?.charAt(0), user?.lastName?.charAt(0)]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  const theme = isSuspend
    ? {
        icon: ShieldAlert,
        iconBg: "bg-red-50",
        iconColor: "text-red-600",
        eyebrow: "ACTION DE SÉCURITÉ",
        eyebrowColor: "text-red-600",
        button: "bg-red-600 hover:bg-red-700 focus:ring-red-200",
        border: "border-red-100",
        noticeBg: "bg-red-50",
        noticeBorder: "border-red-100",
        noticeText: "text-red-800",
        title: "Suspendre le compte",
        description:
          "Vous êtes sur le point de suspendre l'accès de cet utilisateur à CHAD-SSO.",
        confirm: "Confirmer la suspension",
        processing: "Suspension en cours...",
      }
    : {
        icon: ShieldCheck,
        iconBg: "bg-blue-50",
        iconColor: "text-[#003B7A]",
        eyebrow: "GESTION DES ACCÈS",
        eyebrowColor: "text-[#003B7A]",
        button: "bg-[#003B7A] hover:bg-[#002d5c] focus:ring-blue-200",
        border: "border-blue-100",
        noticeBg: "bg-blue-50",
        noticeBorder: "border-blue-100",
        noticeText: "text-blue-900",
        title: "Réactiver le compte",
        description:
          "Vous êtes sur le point de rétablir le statut actif de cet utilisateur dans CHAD-SSO.",
        confirm: "Confirmer la réactivation",
        processing: "Réactivation en cours...",
      };

  const ActionIcon = theme.icon;

  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !submittingRef.current) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  async function handleConfirm() {
    if (submittingRef.current) return;

    submittingRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      const result = isSuspend
        ? await suspendUser(user._id)
        : await activateUser(user._id);

      onCompleted(result);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Impossible de modifier le statut de cet utilisateur.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-[3px]">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="status-modal-title"
        aria-describedby="status-modal-description"
        className="relative w-full max-w-[480px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl"
      >
        {/* Bandeau supérieur */}
        <div
          className={`h-1.5 w-full ${
            isSuspend ? "bg-red-600" : "bg-[#003B7A]"
          }`}
        />

        {/* En-tête */}
        <div className="px-6 pb-0 pt-6 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${theme.iconBg}`}
            >
              <ActionIcon
                size={27}
                strokeWidth={1.8}
                className={theme.iconColor}
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              aria-label="Fermer la fenêtre"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X size={19} />
            </button>
          </div>

          <div className="mt-5">
            <p
              className={`text-[11px] font-bold uppercase tracking-[0.16em] ${theme.eyebrowColor}`}
            >
              {theme.eyebrow}
            </p>

            <h2
              id="status-modal-title"
              className="mt-2 text-[22px] font-bold tracking-tight text-slate-900"
            >
              {theme.title}
            </h2>

            <p
              id="status-modal-description"
              className="mt-2 text-sm leading-6 text-slate-500"
            >
              {theme.description}
            </p>
          </div>
        </div>

        {/* Corps */}
        <div className="space-y-5 px-6 py-6 sm:px-7">
          {/* Identité de l'utilisateur */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Compte concerné
            </p>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#003B7A] shadow-sm ring-1 ring-slate-200">
                {initials || <UserRound size={21} />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {fullName || "Utilisateur"}
                </p>

                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Fingerprint size={13} />
                  <span>Matricule : {user?.matricule || "—"}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-xs text-slate-500">Nouveau statut</span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
                  isSuspend
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isSuspend ? "bg-red-500" : "bg-green-500"
                  }`}
                />

                {isSuspend ? "SUSPENDU" : "ACTIF"}
              </span>
            </div>
          </div>

          {/* Message de sécurité */}
          <div
            className={`flex items-start gap-3 rounded-xl border p-4 ${theme.noticeBg} ${theme.noticeBorder}`}
          >
            {isSuspend ? (
              <AlertTriangle
                size={19}
                className="mt-0.5 shrink-0 text-red-600"
              />
            ) : (
              <Info size={19} className="mt-0.5 shrink-0 text-[#003B7A]" />
            )}

            <div className={`text-sm leading-6 ${theme.noticeText}`}>
              {isSuspend ? (
                <>
                  <p className="font-semibold">Conséquences de la suspension</p>

                  <p className="mt-1 text-xs leading-5">
                    Le compte sera désactivé et ses sessions SSO actives seront
                    révoquées. L'utilisateur devra être réactivé avant de
                    pouvoir se reconnecter.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold">Rétablissement du compte</p>

                  <p className="mt-1 text-xs leading-5">
                    Le compte retrouvera son statut actif. L'utilisateur pourra
                    de nouveau s'authentifier, sous réserve de ses habilitations
                    applicatives.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Erreur API */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertTriangle size={17} className="mt-0.5 shrink-0" />

              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Pied de fenêtre */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${theme.button}`}
          >
            {submitting ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                {theme.processing}
              </>
            ) : (
              <>
                {theme.confirm}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
