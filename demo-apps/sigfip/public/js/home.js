const loadUser = async () => {
  try {
    const response = await fetch("/auth/status");

    const data = await response.json();

    if (!data.authenticated) {
      window.location.href = "/login.html";
      return;
    }

    const user = data.user;

    document.getElementById("user-card").innerHTML = `
      <h2>${user.name || "Utilisateur"}</h2>

      <p>
        <strong>Matricule :</strong>
        ${user.matricule || "-"}
      </p>

      <p>
        <strong>Email :</strong>
        ${user.email || "-"}
      </p>

      <p>
        <strong>Authentification :</strong>
        CHAD-SSO
      </p>

      <p>✓ Identité vérifiée</p>
      <p>✓ Session SIGFIP active</p>
      <p>✓ OpenID Connect</p>
    `;
  } catch (error) {
    console.error(error);

    window.location.href = "/login.html";
  }
};

loadUser();
