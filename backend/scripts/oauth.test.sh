node --check src/modules/oauth/oauth.service.js
node --test tests/accessPolicy.test.js

# Autres tests
node --check src/modules/oauth/refreshToken.service.js
node --check src/modules/access/userApplicationAccess.service.js
node --check src/modules/access/userApplicationAccess.controller.js

node --test tests/accessPolicy.test.js