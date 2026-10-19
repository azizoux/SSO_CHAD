import { useState } from "react";
import { ShieldCheck, LockKeyhole, UserRound, ArrowRight } from "lucide-react";

export default function Login() {
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/v1/auth/browser-login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matricule,
          password,
          return_to: "/",
        }),
      });

      if (!response.ok) {
        setError("Authentification impossible. Vérifiez vos identifiants.");
        return;
      }

      // Le navigateur suit la redirection du backend.
      // Nous vérifions ensuite la session administrateur.
      const adminResponse = await fetch("/api/v1/admin/me", {
        credentials: "include",
      });

      if (!adminResponse.ok) {
        setError("Ce compte ne dispose pas des droits d'administration.");
        return;
      }

      window.location.assign("/");
    } catch {
      setError("Impossible de contacter le serveur CHAD-SSO.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <aside className="hidden w-1/2 flex-col justify-between bg-[#003B7A] p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <ShieldCheck size={38} />
          <div>
            <h1 className="text-2xl font-bold">CHAD-SSO</h1>
            <p className="text-sm text-blue-100">
              Identité numérique nationale
            </p>
          </div>
        </div>

        <div>
          <h2 className="max-w-lg text-4xl font-bold leading-tight">
            Une identité.
            <br />
            Un accès sécurisé.
            <br />
            Une administration connectée.
          </h2>
          <p className="mt-6 max-w-md text-blue-100">
            Plateforme nationale d'authentification unique et de gestion
            centralisée des accès aux systèmes d'information publics.
          </p>
        </div>

        <p className="text-xs text-blue-200">
          CHAD-SSO · Portail d'administration
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <ShieldCheck className="text-[#003B7A]" size={38} />
            <h1 className="mt-3 text-2xl font-bold text-[#003B7A]">CHAD-SSO</h1>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#003B7A]">
                Connexion administrateur
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Accédez à votre espace sécurisé.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="matricule"
                  className="mb-2 block text-sm font-medium"
                >
                  Matricule
                </label>
                <div className="relative">
                  <UserRound
                    size={19}
                    className="absolute left-3 top-3 text-slate-400"
                  />
                  <input
                    id="matricule"
                    type="text"
                    required
                    autoComplete="username"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 outline-none focus:border-[#0066CC]"
                    placeholder="Votre matricule"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="absolute left-3 top-3 text-slate-400"
                  />
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 outline-none focus:border-[#0066CC]"
                    placeholder="Votre mot de passe"
                  />
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#003B7A] py-3 font-semibold text-white hover:bg-[#0066CC] disabled:opacity-60"
              >
                {loading ? "Connexion..." : "Se connecter"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Accès réservé aux administrateurs habilités.
          </p>
        </div>
      </main>
    </div>
  );
}
