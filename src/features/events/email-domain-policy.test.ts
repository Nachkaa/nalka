import assert from "node:assert/strict";
import { test } from "node:test";

import {
  assertEmailDomainAccess,
  EmailDomainListSchema,
  EmailDomainSchema,
  EventEmailDomainError,
  isEmailDomainAllowed,
  parseEventEmailDomainFormData,
} from "./email-domain-policy";

const allowed = ["departement06.fr", "partner.example"];

test("normalizes configured domains and removes duplicates", () => {
  assert.deepEqual(EmailDomainListSchema.parse([" @Departement06.FR ", "departement06.fr"]), [
    "departement06.fr",
  ]);
});

for (const domain of [
  "https://departement06.fr",
  "person@departement06.fr",
  "*.departement06.fr",
  "-company.fr",
  "company..fr",
  "company.fr/path",
  "company.fr.",
  `${"a".repeat(64)}.fr`,
]) {
  test(`rejects invalid domain: ${domain}`, () => {
    assert.equal(EmailDomainSchema.safeParse(domain).success, false);
  });
}

test("accepts exact domains with case-insensitive email matching", () => {
  assert.equal(isEmailDomainAllowed("Person@DEPARTEMENT06.FR", allowed), true);
  assert.equal(isEmailDomainAllowed("person@partner.example", allowed), true);
});

for (const email of [
  "person@gmail.com",
  "person@sub.departement06.fr",
  "person@departement06.fr.evil.test",
  "person@evil-departement06.fr",
  "person@departement06fr",
  "person@departement06.fr@evil.test",
  "departement06.fr",
]) {
  test(`rejects ineligible email: ${email}`, () => {
    assert.equal(isEmailDomainAllowed(email, allowed), false);
  });
}

test("restricted admission requires email verification", () => {
  assert.throws(
    () =>
      assertEmailDomainAccess({ email: "person@departement06.fr", emailVerified: null }, allowed),
    (error: unknown) =>
      error instanceof EventEmailDomainError && error.code === "EMAIL_NOT_VERIFIED",
  );
  assert.doesNotThrow(() =>
    assertEmailDomainAccess(
      { email: "person@departement06.fr", emailVerified: new Date() },
      allowed,
    ),
  );
  assert.throws(
    () =>
      assertEmailDomainAccess({ email: "person@gmail.com", emailVerified: new Date() }, allowed),
    (error: unknown) =>
      error instanceof EventEmailDomainError && error.code === "EMAIL_DOMAIN_NOT_ALLOWED",
  );
});

test("unrestricted events retain existing admission behavior", () => {
  assert.doesNotThrow(() =>
    assertEmailDomainAccess({ email: "person@gmail.com", emailVerified: null }, []),
  );
});

test("enabled restriction cannot be saved without an allowlist", () => {
  const form = new FormData();
  form.set("access.restrictEmailDomains", "on");
  assert.throws(() => parseEventEmailDomainFormData(form));
  form.append("access.allowedEmailDomains", "@Departement06.fr");
  assert.deepEqual(parseEventEmailDomainFormData(form), ["departement06.fr"]);
});

test("disabled restriction discards previously entered domains", () => {
  const form = new FormData();
  form.append("access.allowedEmailDomains", "departement06.fr");
  assert.deepEqual(parseEventEmailDomainFormData(form), []);
});

test("limits the number of domains accepted by the server", () => {
  assert.equal(
    EmailDomainListSchema.safeParse(Array.from({ length: 21 }, (_, index) => `company${index}.fr`))
      .success,
    false,
  );
});
