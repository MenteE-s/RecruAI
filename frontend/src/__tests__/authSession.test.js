/* P1-02 frontend guardrails: the access token is memory-only, the refresh
   token is an HttpOnly cookie, and post-login redirects cannot leave the app.
   These tests exercise the real module, not a mock of it. */
import {
  clearLocalAuth,
  getAccessToken,
  getAuthHeaders,
  getSafeNextPath,
  setAccessToken,
  setAuthSession,
} from "../utils/auth";

function fakeJwt(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `header.${encoded}.signature`;
}

describe("getSafeNextPath", () => {
  test.each([
    ["?next=/in/jobs", "/in/jobs"],
    ["?next=/org/mentee-ai", "/org/mentee-ai"],
    ["?next=/dashboard&x=1", "/dashboard"],
    ["", null],
    ["?next=", null],
    ["?next=https://evil.example", null],
    ["?next=//evil.example", null],
    ["?next=/\\evil.example", null],
    ["?next=javascript:alert(1)", null],
  ])("%s -> %p", (search, expected) => {
    expect(getSafeNextPath(search)).toBe(expected);
  });
});

describe("in-memory access token", () => {
  beforeEach(() => {
    clearLocalAuth();
  });

  test("stores the token in module memory and never in localStorage", () => {
    const token = fakeJwt({ exp: Math.floor(Date.now() / 1000) + 600 });

    setAccessToken(token);

    expect(getAccessToken()).toBe(token);
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(getAuthHeaders()).toEqual({ Authorization: `Bearer ${token}` });
    expect(getAuthHeaders({ "Content-Type": "application/json" })).toEqual({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    });
  });

  test("clearing auth removes both memory and legacy storage keys", () => {
    setAuthSession(fakeJwt({ exp: 123 }), { role: "organization", plan: "pro" });
    expect(localStorage.getItem("isAuthenticated")).toBe("true");
    expect(localStorage.getItem("authRole")).toBe("organization");

    clearLocalAuth();

    expect(getAccessToken()).toBeNull();
    expect(getAuthHeaders()).toEqual({});
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("isAuthenticated")).toBeNull();
    expect(localStorage.getItem("authRole")).toBeNull();
    expect(localStorage.getItem("authPlan")).toBeNull();
  });

  test("a login response cannot put the token into storage", () => {
    const token = fakeJwt({ exp: Math.floor(Date.now() / 1000) + 60 });

    setAuthSession(token, { role: "individual", plan: "trial" });

    expect(getAccessToken()).toBe(token);
    expect(JSON.stringify(localStorage)).not.toContain(token);
    expect(localStorage.getItem("authRole")).toBe("individual");
  });
});
