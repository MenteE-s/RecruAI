// Page manager -> Page profile.
//
// Edit everything a candidate sees about the company, in one place. Separate
// from the public profile view on purpose: this is a form, not a page.
import { useEffect, useRef, useState } from "react";
import PageManagerLayout from "../../components/page/PageManagerLayout";
import { getCurrentUser, getBackendUrl, getAuthHeaders, getUploadUrl } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import {
  FiImage, FiTrash2, FiUpload, FiGlobe, FiMapPin, FiAlertTriangle,
} from "react-icons/fi";

const inputCls =
  "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors";
const labelCls = "block text-[11px] font-semibold text-gray-600 mb-1.5";

// Mirrors COMPANY_SIZE_OPTIONS / COMPANY_TYPE_OPTIONS in
// backend/api/org/organizations.py.
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+", "1001-5000", "5001-10000", "10000+"];
const COMPANY_TYPES = [
  ["startup", "Startup"], ["private", "Private company"], ["public", "Public company"],
  ["nonprofit", "Non-profit"], ["agency", "Agency / consultancy"],
  ["education", "Education"], ["government", "Government"],
];
const INDUSTRIES = [
  "Software & IT", "Finance", "Healthcare", "Education", "Retail & E-commerce",
  "Manufacturing", "Construction", "Logistics", "Hospitality", "Media & Marketing",
  "Telecommunications", "Energy", "Agriculture", "Legal", "Consulting", "Other",
];

export default function PageProfile() {
  const { showToast } = useToast();
  const [org, setOrg] = useState(null);
  const [form, setForm] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  // Page address, edited independently of the company name.
  const [slugValue, setSlugValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const logoInput = useRef(null);
  const bannerInput = useRef(null);

  useEffect(() => {
    return () => {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview]);

  const load = async () => {
    const user = await getCurrentUser();
    if (!user?.organization_id) return;
    const res = await fetch(`${getBackendUrl()}/api/organizations/${user.organization_id}`, {
      credentials: "include",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Could not load your page");
    const data = await res.json();
    setOrg(data);
    setSlugValue(data.slug || "");
    setForm({
      name: data.name || "",
      description: data.description || "",
      website: data.website || "",
      industry: data.industry || "",
      contact_name: data.contact_name || "",
      contact_email: data.contact_email || "",
      location: data.location || "",
      company_size: data.company_size || "",
      company_type: data.company_type || "",
      employee_count: data.employee_count ?? "",
      founded_year: data.founded_year ?? "",
      mission: data.mission || "",
      vision: data.vision || "",
    });
  };

  useEffect(() => {
    load().catch(() => setError("Could not load your page."));
  }, []);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  // Mirrors slugify_company() in backend/utils/slug.py: lowercase, non
  // alphanumeric runs collapse to a single hyphen, trimmed.
  // Optional chaining matters here: this runs on the first render, before the
  // async load has populated `form`, and `form.name` on a null form throws.
  const slugifyHint = (form?.name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  // The page address is edited here but saved by save(), not by its own
  // button: two buttons on one form invites saving half of it. A separate
  // endpoint on the server is fine; a separate save on the client is not.
  const slugDirty = Boolean(org?.slug) && slugValue.trim().toLowerCase() !== org.slug;

  async function save(e) {
    e.preventDefault();
    setError(null);
    const year = form.founded_year === "" ? null : Number(form.founded_year);
    const currentYear = new Date().getFullYear();
    if (year !== null && (Number.isNaN(year) || year < 1800 || year > currentYear)) {
      setError(`Founded year must be between 1800 and ${currentYear}.`);
      return;
    }
    const count = form.employee_count === "" ? null : Number(form.employee_count);
    if (count !== null && (!Number.isInteger(count) || count < 1)) {
      setError("Employee count must be a whole number of 1 or more.");
      return;
    }

    setSaving(true);
    try {
      // Basic fields then extended fields — two endpoints, each validating
      // its own set. The page name is unique, so a conflict surfaces here.
      const basicRes = await fetch(`${getBackendUrl()}/api/organizations/${org.id}`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description,
          website: form.website.trim(),
          contact_name: form.contact_name.trim(),
          contact_email: form.contact_email.trim(),
          location: form.location.trim(),
        }),
      });
      if (!basicRes.ok) {
        const b = await basicRes.json().catch(() => ({}));
        setError(b.error || "Could not save your page details.");
        return;
      }

      const extRes = await fetch(`${getBackendUrl()}/api/organizations/${org.id}/profile`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({
          company_size: form.company_size,
          company_type: form.company_type,
          employee_count: count,
          founded_year: year,
          industry: form.industry,
          mission: form.mission,
          vision: form.vision,
        }),
      });
      if (!extRes.ok) {
        const b = await extRes.json().catch(() => ({}));
        setError(b.error || "Could not save your company details.");
        return;
      }

      // Address last, and only when it actually changed, so a taken or
      // reserved slug can't silently undo the details that just saved.
      let addressChanged = false;
      if (slugDirty) {
        const slugRes = await fetch(`${getBackendUrl()}/api/organizations/${org.id}/slug`, {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify({ slug: slugValue.trim().toLowerCase() }),
        });
        if (!slugRes.ok) {
          const b = await slugRes.json().catch(() => ({}));
          setError(
            b.error
              ? `${b.error} Your other changes were saved.`
              : "Could not update the page address. Your other changes were saved."
          );
          await load();
          return;
        }
        addressChanged = true;
      }

      showToast({
        message: addressChanged ? "Page profile and address saved" : "Page profile saved",
        type: "success",
        position: "side",
        duration: 2500,
      });
      await load();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function upload(kind, file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Images must be under 2 MB."); return; }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append(kind === "profile" ? "profile_image" : "banner_image", file);
      const res = await fetch(
        `${getBackendUrl()}/api/organizations/${org.id}/upload-${kind}-image`,
        { method: "POST", headers: getAuthHeaders(), credentials: "include", body: fd }
      );
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b.error || "Upload failed.");
        return;
      }
      await load();
      showToast({ message: kind === "profile" ? "Logo updated" : "Cover updated", type: "success", position: "side", duration: 2200 });
    } catch {
      setError("Network error during upload.");
    } finally {
      setUploading(false);
    }
  }

  async function clearImage(kind) {
    setUploading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/organizations/${org.id}/profile`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ [kind === "profile" ? "profile_image" : "banner_image"]: null }),
      });
      if (res.ok) await load();
    } finally {
      setUploading(false);
    }
  }

  if (!form) {
    return (
      <PageManagerLayout title="Page profile">
        <div className="text-xs text-gray-500 py-8 text-center">
          {error || "Loading your page…"}
        </div>
      </PageManagerLayout>
    );
  }

  // `org` arrives with the same async load as `form`, so treat it as nullable
  // here too rather than relying on them always landing together.
  const logoUrl = org?.profile_image ? getUploadUrl(org.profile_image) : null;
  const bannerUrl = bannerPreview || (org?.banner_image ? getUploadUrl(org.banner_image) : null);

  return (
    <PageManagerLayout
      title="Page profile"
      subtitle="What candidates see on your page."
    >
      <form onSubmit={save} className="space-y-4 pb-6">
        {/* Logo + cover */}
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-[13px] font-semibold text-gray-900">Logo &amp; cover</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Square logo, wide cover. PNG or JPG, up to 2 MB.</p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className={labelCls}>Logo</label>
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FiImage className="w-5 h-5 text-gray-300" />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => logoInput.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <FiUpload className="w-3.5 h-3.5" /> {logoUrl ? "Replace" : "Upload"}
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => clearImage("profile")}
                      disabled={uploading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-[12px] font-semibold text-gray-500 hover:bg-gray-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
                <input
                  ref={logoInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => upload("profile", e.target.files?.[0])}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Cover image</label>
              {bannerUrl && (
                <img src={bannerUrl} alt="" className="w-full h-24 object-cover rounded-lg border border-gray-200 mb-2" />
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => bannerInput.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <FiUpload className="w-3.5 h-3.5" /> {bannerUrl ? "Replace cover" : "Upload cover"}
                </button>
                {org?.banner_image && !bannerPreview && (
                  <button
                    type="button"
                    onClick={() => clearImage("banner")}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-[12px] font-semibold text-gray-500 hover:bg-gray-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>
              <input
                ref={bannerInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.type.startsWith("image/") && f.size <= 2 * 1024 * 1024) {
                    setBannerPreview((old) => {
                      if (old) URL.revokeObjectURL(old);
                      return URL.createObjectURL(f);
                    });
                  } else {
                    setError("Cover must be an image under 2 MB.");
                  }
                  upload("banner", f);
                }}
              />
            </div>
          </div>
        </section>

        {/* Basics */}
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-[13px] font-semibold text-gray-900">About</h2>
          </div>
          <div className="p-4 space-y-3.5">
            <div>
              <label htmlFor="pp-name" className={labelCls}>
                Company name <span className="text-red-500">*</span>
              </label>
              <input id="pp-name" className={inputCls} value={form.name} onChange={set("name")} required maxLength={255} />
              <p className="mt-1 text-[11px] text-gray-400">
                Must be unique across RecruAI.
              </p>
            </div>

            {/* Page URL is separate from the name on purpose: the name is a
                display label, the address is a permanent link. Renaming should
                not silently break a URL already shared. */}
            <div>
              <label htmlFor="pp-slug" className={labelCls}>
                Page address
              </label>
              <div className="flex items-stretch gap-2">
                <span className="inline-flex items-center px-2.5 rounded-lg bg-gray-100 border border-gray-200 text-[12px] text-gray-500 shrink-0">
                  recruai.menteeai.org/org/
                </span>
                <input
                  id="pp-slug"
                  className={inputCls}
                  value={slugValue}
                  onChange={(e) => setSlugValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  maxLength={60}
                  placeholder={slugifyHint}
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-400">
                Lowercase letters, numbers and hyphens. Leave it alone to keep your
                current address even if you rename the company — saved with the
                rest of this page.
              </p>
              {slugDirty && (
                <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[11.5px] font-medium text-amber-900">
                  <FiAlertTriangle className="w-3 h-3 shrink-0 text-amber-600" />
                  Your address will change to /org/{slugValue} when you save
                </p>
              )}
            </div>
            <div>
              <label htmlFor="pp-desc" className={labelCls}>Short description</label>
              <textarea
                id="pp-desc"
                className={`${inputCls} resize-none`}
                rows={3}
                value={form.description}
                onChange={set("description")}
                maxLength={2000}
                placeholder="What does your company do?"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="pp-industry" className={labelCls}>Industry</label>
                <select id="pp-industry" className={inputCls} value={form.industry} onChange={set("industry")}>
                  <option value="">Select an industry</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="pp-website" className={labelCls}>Website</label>
                <div className="relative">
                  <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input id="pp-website" className={`${inputCls} pl-9`} value={form.website} onChange={set("website")} placeholder="acme.com" maxLength={255} />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="pp-location" className={labelCls}>Address</label>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input id="pp-location" className={`${inputCls} pl-9`} value={form.location} onChange={set("location")} placeholder="Karachi, Pakistan" maxLength={255} />
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-[13px] font-semibold text-gray-900">Contact</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Private — never shown on your public page.</p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="pp-cname" className={labelCls}>Contact person</label>
              <input id="pp-cname" className={inputCls} value={form.contact_name} onChange={set("contact_name")} maxLength={255} />
            </div>
            <div>
              <label htmlFor="pp-cemail" className={labelCls}>Company email</label>
              <input
                id="pp-cemail"
                type="email"
                className={inputCls}
                value={form.contact_email}
                onChange={set("contact_email")}
                placeholder="jobs@acme.com"
                maxLength={255}
              />
            </div>
          </div>
        </section>

        {/* Company facts */}
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-[13px] font-semibold text-gray-900">Company details</h2>
          </div>
          <div className="p-4 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="pp-size" className={labelCls}>Company size</label>
                <select id="pp-size" className={inputCls} value={form.company_size} onChange={set("company_size")}>
                  <option value="">Not set</option>
                  {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="pp-type" className={labelCls}>Company type</label>
                <select id="pp-type" className={inputCls} value={form.company_type} onChange={set("company_type")}>
                  <option value="">Not set</option>
                  {COMPANY_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="pp-employees" className={labelCls}>Exact employee count</label>
                <input id="pp-employees" type="number" min="1" className={inputCls} value={form.employee_count} onChange={set("employee_count")} placeholder="e.g. 24" />
              </div>
              <div>
                <label htmlFor="pp-founded" className={labelCls}>Date of foundation</label>
                <input
                  id="pp-founded"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  className={inputCls}
                  value={form.founded_year}
                  onChange={set("founded_year")}
                  placeholder={`e.g. ${new Date().getFullYear() - 5}`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="pp-mission" className={labelCls}>Mission</label>
              <textarea id="pp-mission" className={`${inputCls} resize-none`} rows={2} value={form.mission} onChange={set("mission")} placeholder="What you exist to do." />
            </div>
            <div>
              <label htmlFor="pp-vision" className={labelCls}>Vision</label>
              <textarea id="pp-vision" className={`${inputCls} resize-none`} rows={2} value={form.vision} onChange={set("vision")} placeholder="Where you're headed." />
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] font-medium text-red-700">
            <FiAlertTriangle className="w-4 h-4 mt-px shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => load().catch(() => {})}
            disabled={saving}
            className="px-4 py-2 rounded-full border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </form>
    </PageManagerLayout>
  );
}