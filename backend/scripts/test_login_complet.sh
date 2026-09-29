CLIENT_ID="sigfip-108b342c17efb48c"
CLIENT_SECRET="sso_0595999d25bfba20f2f4d235c257477064532385e68427a7ce4f0791d6b981ad"
REDIRECT_URI="http://localhost:6060/auth/callback"

echo "========================================"
echo "1. LOGIN SSO"
echo "========================================"

LOGIN_RESPONSE=$(curl -s -X POST \
  http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "matricule": "ADMIN001",
    "password": "ChangeMe-2026!"
  }')

echo "$LOGIN_RESPONSE" | jq

SESSION_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.session.sessionToken')

if [ -z "$SESSION_TOKEN" ] || [ "$SESSION_TOKEN" = "null" ]; then
  echo "ERREUR : sessionToken absent"
  return 1 2>/dev/null || exit 1
fi

echo
echo "SESSION_TOKEN obtenu."
echo

echo "========================================"
echo "2. GENERATION PKCE"
echo "========================================"

CODE_VERIFIER=$(openssl rand -hex 32)

CODE_CHALLENGE=$(printf '%s' "$CODE_VERIFIER" \
  | openssl dgst -sha256 -binary \
  | openssl base64 -A \
  | tr '+/' '-_' \
  | tr -d '=')

echo "Verifier length  : ${#CODE_VERIFIER}"
echo "Challenge length : ${#CODE_CHALLENGE}"

echo
echo "========================================"
echo "3. AUTHORIZATION ENDPOINT"
echo "========================================"

AUTHORIZE_RESPONSE=$(curl -s -G \
  http://localhost:4000/api/v1/oauth/authorize \
  -H "x-sso-session: $SESSION_TOKEN" \
  --data-urlencode "client_id=$CLIENT_ID" \
  --data-urlencode "redirect_uri=$REDIRECT_URI" \
  --data-urlencode "response_type=code" \
  --data-urlencode "scope=openid profile email" \
  --data-urlencode "state=test-state-001" \
  --data-urlencode "code_challenge=$CODE_CHALLENGE" \
  --data-urlencode "code_challenge_method=S256")

echo "$AUTHORIZE_RESPONSE" | jq

AUTH_CODE=$(echo "$AUTHORIZE_RESPONSE" | jq -r '.data.code')

if [ -z "$AUTH_CODE" ] || [ "$AUTH_CODE" = "null" ]; then
  echo "ERREUR : Authorization Code absent"
  return 1 2>/dev/null || exit 1
fi

echo
echo "Authorization Code obtenu."
echo

echo "========================================"
echo "4. TOKEN ENDPOINT"
echo "========================================"

TOKEN_RESPONSE=$(curl -s -X POST \
  http://localhost:4000/api/v1/oauth/token \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg grant_type "authorization_code" \
    --arg code "$AUTH_CODE" \
    --arg redirect_uri "$REDIRECT_URI" \
    --arg client_id "$CLIENT_ID" \
    --arg client_secret "$CLIENT_SECRET" \
    --arg code_verifier "$CODE_VERIFIER" \
    '{
      grant_type: $grant_type,
      code: $code,
      redirect_uri: $redirect_uri,
      client_id: $client_id,
      client_secret: $client_secret,
      code_verifier: $code_verifier
    }')")

echo "$TOKEN_RESPONSE" | jq