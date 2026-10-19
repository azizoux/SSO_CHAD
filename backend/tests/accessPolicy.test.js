import test from "node:test";
import assert from "node:assert/strict";

import { evaluateApplicationAccess } from "../src/modules/access/accessPolicy.service.js";

const user = {
  status: "ACTIVE",
};

const application = {
  status: "ACTIVE",
  allowedScopes: ["openid", "profile", "email"],
};

const access = {
  status: "ACTIVE",
  roles: ["USER"],
  scopes: ["openid", "profile"],
};

function evaluate(overrides = {}) {
  return evaluateApplicationAccess({
    user,
    application,
    access,
    requestedScopes: ["openid", "profile"],
    ...overrides,
  });
}

test("Autorise une habilitation active", () => {
  const result = evaluate();

  assert.equal(result.allowed, true);
  assert.deepEqual(result.roles, ["USER"]);
});

test("Refuse un utilisateur suspendu", () => {
  const result = evaluate({
    user: { status: "SUSPENDED" },
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "USER_NOT_ACTIVE");
});

test("Refuse une application suspendue", () => {
  const result = evaluate({
    application: {
      ...application,
      status: "SUSPENDED",
    },
  });

  assert.equal(result.allowed, false);
});

test("Refuse une habilitation suspendue", () => {
  const result = evaluate({
    access: {
      ...access,
      status: "SUSPENDED",
    },
  });

  assert.equal(result.reason, "APPLICATION_ACCESS_DENIED");
});

test("Refuse une habilitation révoquée", () => {
  const result = evaluate({
    access: {
      ...access,
      status: "REVOKED",
    },
  });

  assert.equal(result.allowed, false);
});

test("Refuse un scope non attribué", () => {
  const result = evaluate({
    requestedScopes: ["openid", "email"],
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "INSUFFICIENT_SCOPE");
});

test("Refuse une requête sans openid", () => {
  const result = evaluate({
    requestedScopes: ["profile"],
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "OPENID_REQUIRED");
});

test("Déduplique les scopes", () => {
  const result = evaluate({
    requestedScopes: ["openid", "openid", "profile"],
  });

  assert.equal(result.allowed, true);
  assert.deepEqual(result.scopes, ["openid", "profile"]);
});
