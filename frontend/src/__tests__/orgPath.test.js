/* Executes orgPath for real. The broken version was a template literal
   returning the literal string "orgPath(...)", which still passed lint and
   built cleanly — only running it catches that. */
import { orgPath } from "../utils/auth";

const cases = [
  // [input, expected, why]
  [{ slug: "mentee-ai", id: 3 }, "/org/mentee-ai", "slug wins"],
  [{ id: 3 }, "/org/profile/3", "id-only falls back to the redirect"],
  [{ slug: "naqsh-ltd-2", id: 7 }, "/org/naqsh-ltd-2", "deduped slug preserved"],
  [3, "/org/profile/3", "bare number"],
  [null, "/org/browse", "null"],
  [undefined, "/org/browse", "undefined"],
  [{}, "/org/browse", "empty object"],
  ["", "/org/browse", "empty string"],
];

describe("orgPath", () => {
  test.each(cases)("orgPath(%p) === %s (%s)", (input, expected) => {
    expect(orgPath(input)).toBe(expected);
  });

  test("never returns a template-literal call as text", () => {
    for (const [input] of cases) {
      const out = orgPath(input);
      expect(out).not.toContain("orgPath(");
      expect(out.startsWith("/org/")).toBe(true);
    }
  });

  test("never leaks a raw id into a slug-shaped URL", () => {
    expect(orgPath({ id: 7 })).not.toBe("/org/7");
    expect(orgPath({ slug: "acme", id: 7 })).toBe("/org/acme");
  });
});