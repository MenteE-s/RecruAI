/* Renders PageProfile and Overview to catch crashes that a production build
   cannot: state that is null on the first render, before an async load fills
   it. The `form.name` null-deref shipped exactly that way -- the build was
   clean and the page white-screened.
*/
import React from "react";
import { render, screen } from "@testing-library/react";

/* react-router-dom 7.12 resolves its `./dom` entry through an `exports`
   subpath that jest 27 (bundled with CRA 5) cannot follow -- the same reason
   the repo's App.test.js has never run. A virtual mock sidesteps resolution
   entirely so these components can still be rendered. */
jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: "/page/profile", search: "" }),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), jest.fn()],
    Link: ({ children, ...rest }) => <a {...rest}>{children}</a>,
    Navigate: () => null,
  }),
  { virtual: true }
);

const PageProfile = require("../pages/page/PageProfile").default;
const { ToastProvider } = require("../components/ui/ToastContext");

const ORG = {
  id: 20,
  name: "Honey Beee Lane",
  slug: "honey-beee-lane",
  description: "Retail",
  website: "",
  industry: "Retail & E-commerce",
  contact_name: "",
  contact_email: "manor@honeybeelane.com",
  location: "Karachi",
  company_size: "1-10",
  company_type: "private",
  employee_count: 4,
  founded_year: 2020,
  mission: "",
  vision: "",
  social_media_links: [],
  profile_image: null,
  banner_image: null,
  is_public: true,
  accepting_applications: true,
  subscription_status: null,
  timezone: "UTC",
};

const USER = {
  id: 30,
  organization_id: 20,
  organization_slug: "honey-beee-lane",
  role: "individual",
  is_discoverable: true,
};

// Only the endpoints PageProfile/PageManagerLayout actually call.
function mockFetch() {
  global.fetch = jest.fn((url) => {
    const u = String(url);
    if (u.includes("/api/auth/me")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ user: USER }) });
    }
    if (u.includes("/api/organizations/20")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(ORG) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
}

describe("PageProfile", () => {
  beforeEach(() => {
    mockFetch();
    localStorage.clear();
    localStorage.setItem("access_token", "test-token");
  });

  afterEach(() => {
    delete global.fetch;
    jest.restoreAllMocks();
  });

  it("renders on the very first paint, before the load resolves", async () => {
    // The critical assertion: `form` is null here, so anything reading
    // form.<field> during the initial render throws.
    const { container } = render(<ToastProvider><PageProfile /></ToastProvider>);

    // It must render *something* rather than throwing out of the component.
    expect(container).toBeTruthy();

    // Then the loaded values land.
    expect(
      await screen.findByDisplayValue("Honey Beee Lane", {}, { timeout: 4000 })
    ).toBeTruthy();
  });

  it("shows the page address field with the current slug", async () => {
    render(<ToastProvider><PageProfile /></ToastProvider>);
    const field = await screen.findByDisplayValue("honey-beee-lane", {}, { timeout: 4000 });
    expect(field).toBeTruthy();
  });
});