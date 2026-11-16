import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const load = createRequire(import.meta.url);

export function isolatedModule(file, mocks = {}) {
  const source = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const fixtureModule = { exports: {} };
  vm.runInThisContext(`(function(require, module, exports) {${source}\n})`)(
    (name) => (name in mocks ? mocks[name] : load(name)),
    fixtureModule,
    fixtureModule.exports,
  );
  return fixtureModule.exports;
}

export function loadDrawAction({ prisma, access, mail, lock, refresh = () => {} }) {
  const revision = isolatedModule("./draw-revision.ts", { "@/lib/prisma": { prisma } });
  const action = isolatedModule("./mutations.ts", {
    "@react-email/render": { render: async (props) => JSON.stringify(props) },
    "@prisma/client": { EventModuleKey: { SECRET_SANTA: "SECRET_SANTA" } },
    "next/cache": { revalidatePath: refresh },
    "@/emails/SecretSantaAssignedEmail": { default: (props) => props },
    "@/features/events/access": { requireEnabledModule: access },
    "@/lib/mail": { sendMail: mail },
    "@/lib/prisma": { prisma },
    "./draw-revision": revision,
    "./draw-lock": lock ? { withDrawLock: lock } : isolatedModule("./draw-lock.ts"),
  });
  return { ...action, ...revision };
}

export function drawForm(eventId, expectedRevision = "none", confirmReplace = false) {
  const form = new FormData();
  form.set("eventId", eventId);
  form.set("slug", "fixture-santa");
  form.set("expectedRevision", expectedRevision);
  form.set("confirmReplace", String(confirmReplace));
  return form;
}

export function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
