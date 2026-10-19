import { useEffect, useState } from "react";
import { getApplications } from "../services/applications.service";
import { grantUserAccess } from "../services/access.service";

export default function GrantAccessForm({
  user,
  existingAccesses = [],
  onSuccess,
  onCancel,
}) {
  const [applications, setApplications] = useState([]);
  const [applicationId, setApplicationId] = useState("");
  const [scopes, setScopes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadApplications() {
      setLoading(true);
      setError("");

      try {
        const allApplications = [];
        let page = 1;
        const limit = 100;

        while (true) {
          const result = await getApplications({
            page,
            limit,
            status: "ACTIVE",
          });

          if (!active) return;

          const batch = result.data || [];
          allApplications.push(...batch);

          if (batch.length < limit) break;

          page += 1;
        }

        const existingIds = new Set(
          existingAccesses.map((access) => access.application?._id),
        );

        setApplications(
          allApplications.filter(
            (application) => !existingIds.has(application._id),
          ),
        );
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.error?.message ||
            "Impossible de charger les applications.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadApplications();

    return () => {
      active = false;
    };
  }, [existingAccesses]);

  const selectedApplication = applications.find(
    (application) => application._id === applicationId,
  );

  const allowedScopes = selectedApplication?.allowedScopes || [];

  function handleApplicationChange(id) {
    setApplicationId(id);
    setScopes([]);
    setError("");
  }

  function toggleScope(scope) {
    setScopes((current) =>
      current.includes(scope)
        ? current.filter((item) => item !== scope)
        : [...current, scope],
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!applicationId) {
      setError("Veuillez sélectionner une application.");
      return;
    }

    if (!scopes.includes("openid")) {
      setError("Le scope openid est obligatoire pour cette attribution OIDC.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await grantUserAccess({
        userId: user._id,
        applicationId,
        roles: ["USER"],
        scopes,
      });

      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          "Impossible d'attribuer l'habilitation.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h4 className="font-semibold text-[#003B7A]">Nouvelle habilitation</h4>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="grant-application"
          className="mb-2 block text-sm font-medium"
        >
          Application
        </label>

        <select
          id="grant-application"
          value={applicationId}
          onChange={(event) => handleApplicationChange(event.target.value)}
          disabled={loading || saving}
          className="w-full rounded-lg border border-slate-300 p-3"
        >
          <option value="">
            {loading ? "Chargement..." : "Sélectionner une application"}
          </option>

          {applications.map((application) => (
            <option key={application._id} value={application._id}>
              {application.code} — {application.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Rôle applicatif
        </label>

        <input
          type="text"
          value="USER"
          readOnly
          className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3"
        />

        <p className="mt-1 text-xs text-slate-500">
          Rôle initial fixe, en attendant le catalogue des rôles applicatifs.
        </p>
      </div>

      {selectedApplication && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Scopes autorisés</legend>

          <div className="flex flex-wrap gap-3">
            {allowedScopes.map((scope) => (
              <label key={scope} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={scopes.includes(scope)}
                  onChange={() => toggleScope(scope)}
                  disabled={saving}
                />
                {scope}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex justify-end gap-3 border-t pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={saving || loading || !applicationId}
          className="rounded-lg bg-[#003B7A] px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Attribuer l'habilitation"}
        </button>
      </div>
    </form>
  );
}
