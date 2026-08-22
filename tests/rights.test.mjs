import assert from "node:assert/strict";
import test from "node:test";
import { createRightsRecord, isReusableInOutput, validateRightsEvidence, validateRightsStatus } from "../lib/rights.mjs";

test("analysis-only is never reusable in output", () => {
  assert.equal(isReusableInOutput("analysis-only"), false);
  assert.equal(createRightsRecord("analysis-only").reusableInOutput, false);
});

test("recognized user-confirmed statuses can pass the output gate", () => {
  for (const status of ["owned", "public-domain", "cc0"]) assert.equal(isReusableInOutput(status), true);
  assert.equal(createRightsRecord("licensed", { rightsNote: "License receipt recorded by creator" }).reusableInOutput, true);
  assert.equal(createRightsRecord("cc-by", { attribution: "Creator — Source — CC BY 4.0" }).reusableInOutput, true);
});

test("evidence requirements guard licensed and CC BY assets", () => {
  assert.throws(() => validateRightsEvidence("licensed"), /rights-note/);
  assert.throws(() => validateRightsEvidence("cc-by"), /attribution/);
  assert.throws(() => validateRightsStatus("downloaded"), /Invalid rights status/);
});
