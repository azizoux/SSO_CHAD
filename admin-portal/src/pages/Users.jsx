import { useEffect, useState } from "react";
import {
  Users as UsersIcon,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  UserPlus,
  Pencil,
  ShieldOff,
  UserRound,
  Fingerprint,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  KeyRound,
  Info,
  AlertCircle,
  Loader2,
} from "lucide-react";

import CreateUserModal from "../components/CreateUserModal";
import EditUserModal from "../components/EditUserModal";
import UserStatusModal from "../components/UserStatusModal";
import UserAccessModal from "../components/UserAccessModal";

import { getUsers, getUserById } from "../services/users.service";

const STATUS_LABELS = {
  ACTIVE: "Actif",
  PENDING: "En attente",
  LOCKED: "Verrouillé",
  SUSPENDED: "Suspendu",
  DISABLED: "Désactivé",
};

const STATUS_CLASSES = {
  ACTIVE: "bg-green-50 text-green-700",
  PENDING: "bg-amber-50 text-amber-700",
  LOCKED: "bg-orange-50 text-orange-700",
  SUSPENDED: "bg-red-50 text-red-700",
  DISABLED: "bg-slate-100 text-slate-600",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        STATUS_CLASSES[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {STATUS_LABELS[status] || status || "Inconnu"}
    </span>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [accessUser, setAccessUser] = useState(null);
  const [statusAction, setStatusAction] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const result = await getUsers({
          page,
          limit: 20,
          search,
          status,
          role,
        });

        if (!active) return;

        setUsers(result.data || []);
        setPagination(
          result.pagination || {
            page,
            limit: 20,
            total: 0,
            pages: 0,
          },
        );
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.message ||
            "Impossible de charger les utilisateurs.",
        );
        setUsers([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [page, search, status, role, reloadKey]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function openDetails(id) {
    setSelectedUser(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const user = await getUserById(id);
      setSelectedUser(user);
    } catch (err) {
      setDetailError(
        err.response?.data?.message ||
          "Impossible de consulter cet utilisateur.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  const showDetails = detailLoading || selectedUser || detailError;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">
            Gestion des utilisateurs
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Répertoire central des identités CHAD-SSO
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-primary hover:bg-slate-50"
          >
            <RefreshCw size={17} />
            Actualiser
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#003B7A] px-4 py-2 text-sm font-medium text-white hover:bg-[#0066CC]"
          >
            <UserPlus size={18} />
            Nouvel utilisateur
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-primary">
            <UsersIcon size={21} />
            <span className="font-semibold">Utilisateurs</span>
          </div>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
            {pagination.total}
          </span>
        </div>

        <form onSubmit={handleSearch} className="mt-5 flex flex-wrap gap-3">
          <div className="relative min-w-52 flex-1">
            <Search
              size={18}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Matricule, nom, prénom ou email..."
              maxLength={100}
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary-light"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Tous les rôles</option>
            {[
              "SUPER_ADMIN",
              "SSO_ADMIN",
              "ORGANIZATION_ADMIN",
              "SECURITY_AUDITOR",
              "USER",
            ].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-light"
          >
            Rechercher
          </button>
        </form>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          {successMessage && (
            <div
              role="status"
              className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
            >
              {successMessage}
            </div>
          )}
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Utilisateur</th>
                <th className="px-5 py-4">Matricule</th>
                <th className="px-5 py-4">Organisation</th>
                <th className="px-5 py-4">Rôles</th>
                <th className="px-5 py-4">Statut</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Chargement des utilisateurs...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {user.email || "Email non renseigné"}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-xs">
                      {user.matricule}
                    </td>

                    <td className="px-5 py-4">
                      {user.organization?.shortName ||
                        user.organization?.name ||
                        "—"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(user.roles || []).map((item) => (
                          <span
                            key={item}
                            className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={user.status} />
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openDetails(user._id)}
                        aria-label={`Consulter ${user.matricule}`}
                        className="rounded-lg p-2 text-primary hover:bg-primary-soft"
                      >
                        <Eye size={19} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingUser(user)}
                        aria-label={`Modifier ${user.matricule}`}
                        className="rounded-lg p-2 text-[#003B7A] hover:bg-blue-50"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccessUser(user)}
                        aria-label={`Gérer les habilitations de ${user.matricule}`}
                        title="Gérer les habilitations"
                        className="rounded-lg p-2 text-indigo-700 hover:bg-indigo-50"
                      >
                        <KeyRound size={18} />
                      </button>
                      {user.status === "ACTIVE" &&
                        !user.roles?.includes("SUPER_ADMIN") && (
                          <button
                            type="button"
                            onClick={() =>
                              setStatusAction({ user, action: "SUSPEND" })
                            }
                            aria-label={`Suspendre ${user.matricule}`}
                            title="Suspendre"
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <ShieldOff size={18} />
                          </button>
                        )}

                      {user.status === "SUSPENDED" && (
                        <button
                          type="button"
                          onClick={() =>
                            setStatusAction({ user, action: "ACTIVATE" })
                          }
                          aria-label={`Réactiver ${user.matricule}`}
                          title="Réactiver"
                          className="rounded-lg p-2 text-green-700 hover:bg-green-50"
                        >
                          <ShieldCheck size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
          <p className="text-xs text-slate-500">
            {pagination.total} utilisateur(s) · Page {pagination.page} sur{" "}
            {Math.max(pagination.pages, 1)}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((value) => value - 1)}
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
              aria-label="Page précédente"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              disabled={loading || page >= pagination.pages}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
              aria-label="Page suivante"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {showDetails && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-[3px]"
          onClick={() => {
            setSelectedUser(null);
            setDetailError("");
            setDetailLoading(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-details-title"
            aria-describedby="user-details-description"
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Bandeau institutionnel */}
            <div className="h-1.5 shrink-0 bg-[#003B7A]" />

            {/* En-tête */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#003B7A]">
                  <UserRound size={26} strokeWidth={1.8} />
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#003B7A]">
                    Gestion des identités
                  </p>

                  <h3
                    id="user-details-title"
                    className="mt-1 text-xl font-bold tracking-tight text-slate-900"
                  >
                    Fiche utilisateur
                  </h3>

                  <p
                    id="user-details-description"
                    className="mt-1 text-sm text-slate-500"
                  >
                    Consultation des informations du compte.
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Fermer la fiche utilisateur"
                onClick={() => {
                  setSelectedUser(null);
                  setDetailError("");
                  setDetailLoading(false);
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <X size={19} />
              </button>
            </div>

            {/* Corps */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
              {detailLoading ? (
                <div
                  role="status"
                  className="flex flex-col items-center justify-center py-16"
                >
                  <Loader2 size={32} className="animate-spin text-[#003B7A]" />

                  <p className="mt-4 text-sm font-medium text-slate-700">
                    Chargement de la fiche utilisateur...
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Récupération des informations du compte
                  </p>
                </div>
              ) : detailError ? (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
                >
                  <AlertCircle
                    size={20}
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Impossible de charger la fiche
                    </p>

                    <p className="mt-1 text-sm text-red-700">{detailError}</p>
                  </div>
                </div>
              ) : selectedUser ? (
                <div className="space-y-7">
                  {/* Carte identité */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-xl font-bold text-[#003B7A] shadow-sm ring-1 ring-slate-200">
                        {[
                          selectedUser.firstName?.charAt(0),
                          selectedUser.lastName?.charAt(0),
                        ]
                          .filter(Boolean)
                          .join("")
                          .toUpperCase() || <UserRound size={27} />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-lg font-bold text-slate-900">
                          {[selectedUser.firstName, selectedUser.lastName]
                            .filter(Boolean)
                            .join(" ") || "Utilisateur"}
                        </h4>

                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                          <Fingerprint size={15} />
                          <span>
                            {selectedUser.matricule || "Matricule indisponible"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                          selectedUser.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : selectedUser.status === "SUSPENDED"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            selectedUser.status === "ACTIVE"
                              ? "bg-green-500"
                              : selectedUser.status === "SUSPENDED"
                                ? "bg-red-500"
                                : "bg-slate-500"
                          }`}
                        />

                        {STATUS_LABELS[selectedUser.status] ||
                          selectedUser.status ||
                          "Non renseigné"}
                      </span>
                    </div>
                  </div>

                  {/* Informations personnelles */}
                  <section>
                    <div className="mb-4 flex items-center gap-2">
                      <UserRound size={18} className="text-[#003B7A]" />

                      <h4 className="text-sm font-bold text-slate-900">
                        Informations personnelles
                      </h4>
                    </div>

                    <dl className="grid gap-4 sm:grid-cols-2">
                      {[
                        {
                          label: "Prénom",
                          value: selectedUser.firstName,
                          icon: UserRound,
                        },
                        {
                          label: "Nom",
                          value: selectedUser.lastName,
                          icon: UserRound,
                        },
                        {
                          label: "Adresse e-mail",
                          value: selectedUser.email,
                          icon: Mail,
                        },
                        {
                          label: "Téléphone",
                          value: selectedUser.phone,
                          icon: Phone,
                        },
                      ].map((field) => {
                        const FieldIcon = field.icon;

                        return (
                          <div
                            key={field.label}
                            className="rounded-xl border border-slate-200 bg-white p-4"
                          >
                            <dt className="flex items-center gap-2 text-xs font-medium text-slate-500">
                              <FieldIcon size={15} className="text-slate-400" />
                              {field.label}
                            </dt>

                            <dd className="mt-2 break-words text-sm font-semibold text-slate-900">
                              {field.value || "—"}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </section>

                  {/* Rattachement administratif */}
                  <section>
                    <div className="mb-4 flex items-center gap-2 border-t border-slate-100 pt-6">
                      <Building2 size={18} className="text-[#003B7A]" />

                      <h4 className="text-sm font-bold text-slate-900">
                        Rattachement administratif
                      </h4>
                    </div>

                    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#003B7A]">
                        <Building2 size={21} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">
                          Organisation de rattachement
                        </p>

                        <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                          {selectedUser.organization?.name ||
                            selectedUser.organization?.shortName ||
                            (typeof selectedUser.organization === "string"
                              ? selectedUser.organization
                              : "Non renseignée")}
                        </p>

                        {selectedUser.organization?.code && (
                          <p className="mt-1 text-xs text-slate-500">
                            Code : {selectedUser.organization.code}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Sécurité et habilitations */}
                  <section>
                    <div className="mb-4 flex items-center gap-2 border-t border-slate-100 pt-6">
                      <ShieldCheck size={18} className="text-[#003B7A]" />

                      <h4 className="text-sm font-bold text-slate-900">
                        Sécurité et habilitations
                      </h4>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
                          <ShieldCheck size={15} />
                          Statut du compte
                        </p>

                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {STATUS_LABELS[selectedUser.status] ||
                            selectedUser.status ||
                            "—"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
                          <KeyRound size={15} />
                          Rôles SSO
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {selectedUser.roles?.length ? (
                            selectedUser.roles.map((role) => (
                              <span
                                key={role}
                                className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#003B7A]"
                              >
                                {role}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-slate-400">
                              Aucun rôle renseigné
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Note */}
                  <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                    <Info
                      size={18}
                      className="mt-0.5 shrink-0 text-[#003B7A]"
                    />

                    <p className="text-xs leading-5 text-blue-900">
                      Cette fiche présente les informations administratives et
                      les rôles globaux du compte CHAD-SSO. Les habilitations
                      propres à SIGFOP, SIGFIP et aux autres applications sont
                      consultables dans la rubrique « Habilitations applicatives
                      ».
                    </p>
                  </div>
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-slate-500">
                  Aucune information utilisateur disponible.
                </p>
              )}
            </div>

            {/* Pied fixe */}
            <div className="flex shrink-0 justify-end border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:px-8">
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setDetailError("");
                  setDetailLoading(false);
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <X size={16} />
                Fermer la fiche
              </button>
            </div>
          </section>
        </div>
      )}

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            setSuccessMessage("Utilisateur créé avec succès.");
            setPage(1);
            setReloadKey((value) => value + 1);
          }}
        />
      )}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={() => {
            setEditingUser(null);
            setSuccessMessage("Fiche utilisateur mise à jour avec succès.");
            setReloadKey((value) => value + 1);
          }}
        />
      )}
      {statusAction && (
        <UserStatusModal
          user={statusAction.user}
          action={statusAction.action}
          onClose={() => setStatusAction(null)}
          onCompleted={(result) => {
            setStatusAction(null);
            setSuccessMessage(
              result.message || "Statut mis à jour avec succès.",
            );
            setReloadKey((value) => value + 1);
          }}
        />
      )}
      {accessUser && (
        <UserAccessModal
          user={accessUser}
          onClose={() => setAccessUser(null)}
        />
      )}
    </div>
  );
}
