import { useEffect, useState } from "react";
import { X, UserPlus } from "lucide-react";

import { createUser } from "../services/users.service";
import { getActiveOrganizations } from "../services/organizations.service";

const initialForm = {
  matricule: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  organization: "",
  password: "",
};

export default function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOrganizations() {
      try {
        const data = await getActiveOrganizations();
        if (active) setOrganizations(data);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Impossible de charger les organisations.",
          );
        }
      } finally {
        if (active) setLoadingOrganizations(false);
      }
    }

    loadOrganizations();

    return () => {
      active = false;
    };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setSubmitting(true);

    try {
      await createUser({
        ...form,
        matricule: form.matricule.trim().toUpperCase(),
        roles: ["USER"],
      });

      onCreated();
    } catch (err) {
      setError(
        err.response?.data?.message || "Impossible de créer cet utilisateur.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const fields = [
    { name: "matricule", label: "Matricule", required: true },
    { name: "firstName", label: "Prénom", required: true },
    { name: "lastName", label: "Nom", required: true },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Téléphone", type: "tel" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-user-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2
              id="create-user-title"
              className="flex items-center gap-2 text-xl font-bold text-[#003B7A]"
            >
              <UserPlus size={22} />
              Nouvel utilisateur
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enregistrement dans le référentiel national CHAD-SSO
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Fermer"
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.name} className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  {field.label}
                  {field.required && " *"}
                </span>

                <input
                  name={field.name}
                  type={field.type || "text"}
                  value={form[field.name]}
                  onChange={updateField}
                  required={Boolean(field.required)}
                  disabled={submitting}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0066CC]"
                />
              </label>
            ))}
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Organisation *
            </span>

            <select
              name="organization"
              value={form.organization}
              onChange={updateField}
              required
              disabled={submitting || loadingOrganizations}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">
                {loadingOrganizations
                  ? "Chargement des organisations..."
                  : "Sélectionner une organisation"}
              </option>

              {organizations.map((organization) => (
                <option key={organization._id} value={organization._id}>
                  {organization.shortName || organization.code} —{" "}
                  {organization.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Mot de passe initial *
            </span>

            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              required
              minLength={8}
              autoComplete="new-password"
              disabled={submitting}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            />
          </label>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
            Rôle attribué automatiquement : <strong>USER</strong>. Les
            privilèges administratifs sont gérés séparément.
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={
                submitting || loadingOrganizations || organizations.length === 0
              }
              className="rounded-lg bg-[#003B7A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0066CC] disabled:opacity-50"
            >
              {submitting ? "Enregistrement..." : "Créer l'utilisateur"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
