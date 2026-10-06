/* Executes postPath for real. The previous bulk-rewrite bug shipped a
   backtick-wrapped call that returned the literal string "orgPath(...)" and
   still passed eslint plus a clean production build. */
import { postPath, orgPath } from "../utils/auth";

const jobCases = [
  [{ slug: "software-engineer", id: 8 }, "/in/jobs/software-engineer", "slug wins"],
  [{ slug: "ai-ml-engineer", id: 2 }, "/in/jobs/ai-ml-engineer", "punctuation in title"],
  [{ id: 8 }, "/in/jobs/8", "id-only; backend resolves numeric ids too"],
  [8, "/in/jobs/8", "bare number"],
  [null, "/in/jobs", "null"],
  [undefined, "/in/jobs", "undefined"],
  [{}, "/in/jobs", "empty object"],
  ["", "/in/jobs", "empty string"],
];

describe("postPath", () => {
  test.each(jobCases)("postPath(%p) === %s (%s)", (input, expected) => {
    expect(postPath(input)).toBe(expected);
  });

  test("never returns the call source as text", () => {
    for (const [input] of jobCases) {
      const out = postPath(input);
      expect(out).not.toContain("postPath(");
      expect(out).not.toContain("${");
      expect(out.startsWith("/in/jobs")).toBe(true);
    }
  });
});

describe("orgPath (regression guard)", () => {
  test("slug wins, id falls back", () => {
    expect(orgPath({ slug: "mentee-ai", id: 3 })).toBe("/org/mentee-ai");
    expect(orgPath({ id: 3 })).toBe("/org/profile/3");
  });

  test("never returns the call source as text", () => {
    for (const input of [{ slug: "a", id: 1 }, { id: 1 }, 1, null, {}]) {
      expect(orgPath(input)).not.toContain("orgPath(");
    }
  });
});