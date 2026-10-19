import { useEffect, useRef, useState } from "react";
import {
  Pencil,
  X,
  UserRound,
  Mail,
  Phone,
  Building2,
  Fingerprint,
  ShieldCheck,
  Loader2,
  Save,
  AlertCircle,
  Info,
} from "lucide-react";

import { updateUserProfile } from "../services/users.service";
import { getActiveOrganizations } from "../services/organizations.service";

export default function EditUserModal({ user, onClose, onUpdated }) {
  const [form, setForm] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    phone: user.phone || "",
    organization:
      typeof user.organization === "object" && user.organization !== null
        ? user.organization._id || ""
        : user.organization || "",
  });

  const [organizations, setOrganizations] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [organizationsError, setOrganizationsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submittingRef = useRef(false);
  const firstNameRef = useRef(null);

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  const initials = [user.firstName?.charAt(0), user.lastName?.charAt(0)]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 " +
    "placeholder:text-slate-400 transition-all " +
    "focus:border-[#003B7A] focus:outline-none focus:ring-4 focus:ring-blue-50 " +
    "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

  const labelClass =
    "mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600";

  useEffect(() => {
    let active = true;

    async function loadOrganizations() {
      setLoadingOrganizations(true);
      setOrganizationsError(false);

      try {
        const data = await getActiveOrganizations();

        if (!active) return;

        setOrganizations(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!active) return;

        setOrganizationsError(true);

        setError(
          err.response?.data?.error?.message ||
            "Impossible de charger les organisations.",
        );
      } finally {
        if (active) {
          setLoadingOrganizations(false);
        }
      }
    }

    loadOrganizations();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    firstNameRef.current?.focus();
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

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error && !organizationsError) {
      setError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submittingRef.current) return;

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();

    if (!firstName || !lastName) {
      setError("Le prénom et le nom sont obligatoires.");
      return;
    }

    if (!form.organization) {
      setError("Veuillez sélectionner une organisation.");
      return;
    }

    if (loadingOrganizations || organizationsError) {
      setError(
        "Les organisations ne sont pas disponibles. Veuillez réessayer.",
      );
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      await updateUserProfile(user._id, {
        firstName,
        lastName,
        email: form.email.trim().toLowerCase() || null,
        phone: form.phone.trim() || null,
        organization: form.organization,
      });

      onUpdated();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Impossible de modifier cet utilisateur.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const fields = [
    {
      name: "firstName",
      label: "Prénom",
      placeholder: "Prénom de l'utilisateur",
      type: "text",
      required: true,
      autoComplete: "given-name",
    },
    {
      name: "lastName",
      label: "Nom",
      placeholder: "Nom de l'utilisateur",
      type: "text",
      required: true,
      autoComplete: "family-name",
    },
    {
      name: "email",
      label: "Adresse e-mail",
      placeholder: "nom@administration.td",
      type: "email",
      required: false,
      autoComplete: "email",
      icon: Mail,
    },
    {
      name: "phone",
      label: "Téléphone",
      placeholder: "+235 XX XX XX XX",
      type: "tel",
      required: false,
      autoComplete: "tel",
      icon: Phone,
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-[3px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-title"
        aria-describedby="edit-user-description"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl"
      >
        {/* Bandeau supérieur */}
        <div className="h-1.5 shrink-0 bg-[#003B7A]" />

        {/* En-tête */}
        <div className="shrink-0 border-b border-slate-100 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#003B7A]">
                <Pencil size={25} strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#003B7A]">
                  Gestion des identités
                </p>

                <h2
                  id="edit-user-title"
                  className="mt-1 text-xl font-bold tracking-tight text-slate-900"
                >
                  Modifier le profil
                </h2>

                <p
                  id="edit-user-description"
                  className="mt-1 text-sm text-slate-500"
                >
                  Mettre à jour les informations de l'utilisateur.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              aria-label="Fermer la fenêtre"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-40"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Corps défilant */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {/* Carte d'identité */}
          <div className="mb-7 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#003B7A] shadow-sm ring-1 ring-slate-200">
                {initials || <UserRound size={22} />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {fullName || "Utilisateur"}
                </p>

                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Fingerprint size={13} />
                  <span>Matricule : {user.matricule || "—"}</span>
                </div>
              </div>

              <span className="hidden rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-[#003B7A] sm:inline-flex">
                CHAD-SSO
              </span>
            </div>
          </div>

          <form
            id="edit-user-form"
            onSubmit={handleSubmit}
            className="space-y-7"
          >
            {/* Informations personnelles */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <UserRound size={17} className="text-[#003B7A]" />

                <h3 className="text-sm font-bold text-slate-900">
                  Informations personnelles
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((field) => {
                  const FieldIcon = field.icon;

                  return (
                    <div key={field.name}>
                      <label
                        htmlFor={`edit-${field.name}`}
                        className={labelClass}
                      >
                        {field.label}

                        {field.required && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </label>

                      <div className="relative">
                        {FieldIcon && (
                          <FieldIcon
                            size={17}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                        )}

                        <input
                          ref={
                            field.name === "firstName"
                              ? firstNameRef
                              : undefined
                          }
                          id={`edit-${field.name}`}
                          name={field.name}
                          type={field.type}
                          value={form[field.name]}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          autoComplete={field.autoComplete}
                          required={field.required}
                          disabled={submitting}
                          className={`${inputClass} ${
                            FieldIcon ? "pl-10" : ""
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Organisation */}
            <div>
              <div className="mb-4 flex items-center gap-2 border-t border-slate-100 pt-6">
                <Building2 size={17} className="text-[#003B7A]" />

                <h3 className="text-sm font-bold text-slate-900">
                  Rattachement administratif
                </h3>
              </div>

              <label htmlFor="edit-organization" className={labelClass}>
                Organisation
                <span className="ml-1 text-red-500">*</span>
              </label>

              <div className="relative">
                <Building2
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  id="edit-organization"
                  name="organization"
                  value={form.organization}
                  onChange={handleChange}
                  required
                  disabled={
                    submitting || loadingOrganizations || organizationsError
                  }
                  className={`${inputClass} pl-11`}
                >
                  <option value="">
                    {loadingOrganizations
                      ? "Chargement des organisations..."
                      : "Sélectionner une organisation"}
                  </option>

                  {organizations.map((organization) => (
                    <option key={organization._id} value={organization._id}>
                      {organization.shortName || organization.code}
                      {" — "}
                      {organization.name}
                    </option>
                  ))}
                </select>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                L'organisation détermine le rattachement administratif de cet
                utilisateur.
              </p>
            </div>

            {/* Information de sécurité */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-[#003B7A]"
              />

              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Périmètre de la modification
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-800">
                  Cette opération met à jour uniquement les informations du
                  profil et le rattachement administratif. Le matricule, les
                  rôles, les habilitations applicatives, le statut et le mot de
                  passe restent inchangés.
                </p>
              </div>
            </div>

            {/* Erreur API */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
              >
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <p className="text-sm leading-5 text-red-700">{error}</p>
              </div>
            )}

            <p className="flex items-center gap-2 text-xs text-slate-400">
              <Info size={14} />
              Les champs marqués d'un astérisque sont obligatoires.
            </p>
          </form>
        </div>

        {/* Pied de fenêtre fixe */}
        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            type="submit"
            form="edit-user-form"
            disabled={submitting || loadingOrganizations || organizationsError}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#003B7A] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#002d5c] focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
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
