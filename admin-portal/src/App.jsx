import { BrowserRouter, Routes, Route } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Users from "./pages/Users";

function Placeholder({ title }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8">
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">
        Module en cours de développement.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route
              path="organizations"
              element={<Placeholder title="Organisations" />}
            />
            <Route
              path="applications"
              element={<Placeholder title="Applications" />}
            />
            <Route
              path="access"
              element={<Placeholder title="Habilitations" />}
            />
            <Route path="sessions" element={<Placeholder title="Sessions" />} />
            <Route
              path="audit"
              element={<Placeholder title="Journal d'audit" />}
            />
            <Route
              path="settings"
              element={<Placeholder title="Paramètres" />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
