// Company page creation — a full page, at /page/create.
//
// Signup is individuals-only, so a company comes into existence here: after
// the person has an account. Deliberately its own screen rather than a popup
// dialog, because it's a long multi-step form the user may want to leave and
// come back to, and because a page is the thing being created — the screen
// should feel like that, not a confirmation box on top of somewhere else.
//
// Flow: basics -> contact -> details -> review -> page profile.
// The page is created first and the logo uploaded second: a failed image must
// never cost someone the page they just filled in.
import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiX, FiBriefcase, FiGlobe, FiMapPin, FiInfo, FiAlertTriangle,
  FiCheck, FiArrowRight, FiArrowLeft, FiUpload, FiTrash2, FiMail,
  FiUsers, FiCalendar, FiHome, FiImage, FiLoader,
} from "react-icons/fi";
import { useToast } from "../../components/ui/ToastContext";
import { getBackendUrl, getAuthHeaders, getCurrentUser, orgPath } from "../../utils/auth";

const inputCls =
  "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors";
const labelCls = "block text-[11px] font-semibold text-gray-600 mb-1.5";
const optCls = (sel) =>
  `px-3 py-2 rounded-lg border text-[12.5px] font-medium transition-colors ${
    sel
      ? "border-blue-600 bg-blue-50 text-blue-700"
      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
  }`;

/** Mirrors backend/utils/free_email.py so the hint appears as you type. */
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "yahoo.co.in",
  "yahoo.com.pk", "ymail.com", "rocketmail.com", "hotmail.com",
  "hotmail.co.uk", "hotmail.com.pk", "outlook.com", "outlook.pk", "live.com",
  "live.co.uk", "msn.com", "aol.com", "icloud.com", "me.com", "mac.com",
  "proton.me", "protonmail.com", "pm.me", "tutanota.com", "tuta.io", "gmx.com",
  "gmx.de", "gmx.net", "mail.com", "mail.ru", "yandex.com", "yandex.ru",
  "zoho.com", "fastmail.com", "hushmail.com", "inbox.com", "yandex.by",
  "web.de", "orange.fr", "free.fr", "wanadoo.fr", "libero.it", "virgilio.it",
  "rediffmail.com", "qq.com", "163.com", "126.com", "naver.com", "daum.net",
  "hey.com",
]);
const SOFT_DOMAIN_HINT = new Set(["outlook.pk", "hotmail.com.pk", "yahoo.com.pk"]);

function freeEmailHint(email) {
  const domain = (email || "").trim().toLowerCase().split("@").pop();
  if (!email || !email.includes("@") || !domain) return null;
  const isFree =
    FREE_EMAIL_DOMAINS.has(domain) ||
    // gmail.com.pk / yahoo.com.br style: free provider plus a ccTLD.
    [...FREE_EMAIL_DOMAINS].some((d) => d.split(".")[0] === domain.split(".")[0] && d !== domain);
  if (!isFree) return null;
  return SOFT_DOMAIN_HINT.has(domain)
    ? `${domain} is a personal mailbox, so candidates can't tell it apart from a recruiter's personal address. A company domain looks more trustworthy.`
    : `${domain} is a free personal mailbox. Candidates trust replies from a company domain more, and a shared inbox keeps track of applicants. Try jobs@yourcompany.com.`;
}

// "1000+" is legacy but must stay valid — see COMPANY_SIZE_OPTIONS in
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

const STEPS = [
  { id: 1, label: "Basics", icon: FiBriefcase },
  { id: 2, label: "Contact", icon: FiMail },
  { id: 3, label: "Details", icon: FiHome },
  { id: 4, label: "Review", icon: FiCheck },
];

const EMPTY = {
  name: "", industry: "", website: "", description: "",
  contact_name: "", contact_email: "",
  company_size: "", employee_count: "", company_type: "",
  founded_year: "", location: "",
};

export default function CreatePage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [logo, setLogo] = useState(null); // File
  const [logoPreview, setLogoPreview] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null); // { id, name }
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Revoke object URLs so the blob doesn't outlive the page.
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const emailHint = freeEmailHint(form.contact_email);
  const currentYear = new Date().getFullYear();

  function pickLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Logo must be an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Logo must be under 2 MB.");
      return;
    }
    setError(null);
    setLogo(file);
    setLogoPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  }

  function clearLogo() {
    setLogo(null);
    setLogoPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  const foundedYearInvalid =
    form.founded_year !== "" &&
    (Number(form.founded_year) < 1800 || Number(form.founded_year) > currentYear);
  const employeeCountInvalid =
    form.employee_count !== "" &&
    (!Number.isInteger(Number(form.employee_count)) || Number(form.employee_count) < 1);

  function validateStep(n) {
    setError(null);
    if (n === 1 && form.name.trim().length < 2) {
      setError("Give your company a name of at least 2 characters.");
      return false;
    }
    if (n === 2 && form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email.trim())) {
      setError("That email address doesn't look valid.");
      return false;
    }
    if (n === 3) {
      if (foundedYearInvalid) {
        setError(`Founded year must be between 1800 and ${currentYear}.`);
        return false;
      }
      if (employeeCountInvalid) {
        setError("Employee count must be a whole number of 1 or more.");
        return false;
      }
    }
    return true;
  }

  function next() {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 4));
  }

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      // Drop empty optionals so the API sees "not provided" rather than "".
      const payload = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v != null) payload[k] = typeof v === "string" ? v.trim() : v;
      });

      const res = await fetch(`${getBackendUrl()}/api/organizations/page`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not create the page.");
        return;
      }

      // Page exists. Logo is best-effort — never block the flow on it.
      if (logo) {
        try {
          const fd = new FormData();
          fd.append("profile_image", logo);
          await fetch(`${getBackendUrl()}/api/organizations/${data.id}/upload-profile-image`, {
            method: "POST",
            headers: getAuthHeaders(),
            credentials: "include",
            body: fd,
          });
        } catch {
          // Ignore: they can add a logo later from the page settings.
        }
      }

      await getCurrentUser({ forceRefresh: true });

      const warn = (data.warnings || [])[0];
      showToast({
        message: warn ? `${data.name} created — check the contact email note` : `${data.name} page created — you're the admin`,
        type: warn ? "warning" : "success",
        position: "side",
        duration: 3500,
      });

      setCreated({ id: data.id, name: data.name, warnings: data.warnings || [] });
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function leave() {
    if (saving) return;
    navigate(created ? "/page" : "/feed");
  }

  const reviewRows = [
    ["Company", form.name],
    ["Logo", logo ? logo.name : "Not added — you can add it later"],
    ["Industry", form.industry || "—"],
    ["Website", form.website || "—"],
    ["Contact name", form.contact_name || "—"],
    ["Contact email", form.contact_email || "—"],
    ["Company size", form.company_size || "—"],
    ["Employees", form.employee_count || "—"],
    ["Company type", COMPANY_TYPES.find(([v]) => v === form.company_type)?.[1] || "—"],
    ["Founded", form.founded_year || "—"],
    ["Address", form.location || "—"],
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Page chrome: a real top bar, not a dialog header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
          <Link
            to={created ? "/page" : "/feed"}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-gray-500 hover:text-gray-900 transition-colors shrink-0"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{created ? "Back to page" : "Back"}</span>
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-[14px] font-bold text-gray-900 leading-tight truncate">
              {created ? "Your page is live" : "Create a company page"}
            </h1>
            <p className="text-[11px] text-gray-500 mt-0.5 hidden sm:block truncate">
              {created
                ? "Next step: post your first open role."
                : "Post jobs, hire talent and manage a team — all under your own account."}
            </p>
          </div>
          <span className="text-[12px] font-semibold text-gray-400 shrink-0 w-[52px] text-right">
            Step {Math.min(step, 4)}/4
          </span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Stepper */}
        {!created && (
          <div className="px-6 py-3 border-b border-gray-100 shrink-0">
            <ol className="flex items-center gap-1.5">
              {STEPS.map((s, i) => {
                const done = step > s.id;
                const active = step === s.id;
                return (
                  <li key={s.id} className="flex items-center gap-1.5 flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => (done ? setStep(s.id) : null)}
                      disabled={!done}
                      className={`flex items-center gap-1.5 text-[11.5px] font-semibold transition-colors ${
                        active ? "text-blue-700" : done ? "text-gray-600 hover:text-blue-700" : "text-gray-300"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                          active ? "bg-blue-600 text-white"
                            : done ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {done ? <FiCheck className="w-3 h-3" /> : s.id}
                      </span>
                      <span className="hidden sm:inline">{s.label}</span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <span className={`h-px flex-1 min-w-[8px] ${done ? "bg-green-300" : "bg-gray-200"}`} />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Body */}
        <div className="px-4 sm:px-7 py-5 sm:py-6">
          {created ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5">
                <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0">
                  <FiCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-green-900">
                    {created.name} is ready
                  </p>
                  <p className="text-[12px] text-green-800 mt-0.5">
                    You&rsquo;re the first admin. Add teammates any time.
                  </p>
                </div>
              </div>

              {created.warnings.map((w, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-3 text-[12px] leading-relaxed text-amber-900"
                >
                  <FiAlertTriangle className="w-4 h-4 mt-px shrink-0 text-amber-600" />
                  <span>
                    <strong className="font-semibold">Heads up:</strong> {w.message}
                  </span>
                </div>
              ))}

              <p className="text-[12px] text-gray-500 pt-1">
                A complete page with a logo and description attracts far more applicants.
                You can fill those in from the page settings at any time.
              </p>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0">
                      {logoPreview ? (
                        <div className="relative group">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-20 h-20 rounded-xl object-cover border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={clearLogo}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                            aria-label="Remove logo"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                        >
                          <FiUpload className="w-4 h-4" />
                          <span className="text-[9px] font-semibold uppercase tracking-wide">Logo</span>
                        </button>
                      )}
                    </div>
                    <div className="min-w-0 pt-1">
                      <p className="text-[13px] font-semibold text-gray-900">Company logo</p>
                      <p className="text-[11.5px] text-gray-500 mt-0.5 leading-relaxed">
                        Square images work best. PNG or JPG, up to 2 MB.
                        {logo && (
                          <button
                            type="button"
                            onClick={clearLogo}
                            className="ml-1.5 inline-flex items-center gap-0.5 text-gray-400 hover:text-red-600"
                          >
                            <FiTrash2 className="w-3 h-3" /> Remove
                          </button>
                        )}
                      </p>
                      {logo && (
                        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                          <FiImage className="w-3 h-3" /> {logo.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={pickLogo}
                    className="hidden"
                  />

                  <div>
                    <label htmlFor="page-name" className={labelCls}>
                      Company name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="page-name"
                      className={inputCls}
                      value={form.name}
                      onChange={set("name")}
                      placeholder="Acme Pvt. Ltd."
                      autoComplete="organization"
                      maxLength={255}
                      autoFocus
                    />
                    <p className="mt-1 text-[11px] text-gray-400">
                      This is the public page name candidates see on job listings.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="page-industry" className={labelCls}>Industry</label>
                      <select
                        id="page-industry"
                        className={inputCls}
                        value={form.industry}
                        onChange={set("industry")}
                      >
                        <option value="">Select an industry</option>
                        {INDUSTRIES.map((i) => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="page-website" className={labelCls}>Website</label>
                      <div className="relative">
                        <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        <input
                          id="page-website"
                          className={`${inputCls} pl-9`}
                          value={form.website}
                          onChange={set("website")}
                          placeholder="acme.com"
                          maxLength={255}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="page-desc" className={labelCls}>
                      Short description
                    </label>
                    <textarea
                      id="page-desc"
                      className={`${inputCls} resize-none`}
                      rows={3}
                      value={form.description}
                      onChange={set("description")}
                      placeholder="What does your company do? One or two lines."
                      maxLength={2000}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 rounded-lg bg-blue-50 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-blue-800">
                    <FiInfo className="w-3.5 h-3.5 mt-px shrink-0" />
                    <span>
                      Candidates use this address to reach you about your jobs. It stays
                      private — it is never shown on your public page.
                    </span>
                  </div>

                  <div>
                    <label htmlFor="page-contact-name" className={labelCls}>
                      Contact person
                    </label>
                    <input
                      id="page-contact-name"
                      className={inputCls}
                      value={form.contact_name}
                      onChange={set("contact_name")}
                      placeholder="Who should applicants hear from?"
                      maxLength={255}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label htmlFor="page-contact-email" className={labelCls}>
                      Company email
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <input
                        id="page-contact-email"
                        type="email"
                        className={`${inputCls} pl-9 ${emailHint ? "border-amber-300 bg-amber-50/40" : ""}`}
                        value={form.contact_email}
                        onChange={set("contact_email")}
                        placeholder="jobs@acme.com"
                        maxLength={255}
                      />
                    </div>
                    {emailHint && (
                      <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-900">
                        <FiAlertTriangle className="w-3.5 h-3.5 mt-px shrink-0 text-amber-600" />
                        <span>{emailHint} <span className="text-amber-700">You can still continue — this is only a suggestion.</span></span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>How many people work here?</label>
                    <div className="flex flex-wrap gap-1.5">
                      {COMPANY_SIZES.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, company_size: p.company_size === size ? "" : size }))}
                          className={optCls(form.company_size === size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[11px] text-gray-400">
                      Pick the closest range — candidates filter jobs on this.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="page-employees" className={labelCls}>
                      Exact employee count <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <input
                        id="page-employees"
                        type="number"
                        min="1"
                        className={`${inputCls} pl-9`}
                        value={form.employee_count}
                        onChange={set("employee_count")}
                        placeholder="e.g. 24"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Company type</label>
                    <div className="flex flex-wrap gap-1.5">
                      {COMPANY_TYPES.map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, company_type: p.company_type === value ? "" : value }))}
                          className={optCls(form.company_type === value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="page-founded" className={labelCls}>
                        Date of foundation <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        <input
                          id="page-founded"
                          type="number"
                          min="1800"
                          max={currentYear}
                          className={`${inputCls} pl-9`}
                          value={form.founded_year}
                          onChange={set("founded_year")}
                          placeholder={`e.g. ${currentYear - 5}`}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="page-location" className={labelCls}>
                        Address <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        <input
                          id="page-location"
                          className={`${inputCls} pl-9`}
                          value={form.location}
                          onChange={set("location")}
                          placeholder="Karachi, Pakistan"
                          maxLength={255}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  {emailHint && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-3 text-[12px] leading-relaxed text-amber-900">
                      <FiAlertTriangle className="w-4 h-4 mt-px shrink-0 text-amber-600" />
                      <span>
                        <strong className="font-semibold">Free mailbox detected:</strong>{" "}
                        {emailHint} You can change this later in page settings.
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                    {logoPreview ? (
                      <img src={logoPreview} alt="" className="w-14 h-14 rounded-lg object-cover border border-gray-200 shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                        <FiBriefcase className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-gray-900 truncate">{form.name}</p>
                      <p className="text-[12px] text-gray-500 truncate">
                        {[form.industry, form.location].filter(Boolean).join(" · ") || "Add details to stand out"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="ml-auto text-[11.5px] font-semibold text-blue-600 hover:text-blue-800 shrink-0"
                    >
                      Edit
                    </button>
                  </div>

                  <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                    {reviewRows.map(([k, v]) => (
                      <div key={k} className="flex items-start justify-between gap-4 px-3.5 py-2">
                        <dt className="text-[11.5px] text-gray-500 shrink-0">{k}</dt>
                        <dd className="text-[12.5px] font-medium text-gray-900 text-right break-all min-w-0">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="flex items-start gap-2 rounded-lg bg-neutral-50 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-gray-600">
                    <FiInfo className="w-3.5 h-3.5 mt-px shrink-0" />
                    <span>
                      Your page name is permanent and unique across RecruAI. You can edit
                      everything else later.
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] font-medium text-red-700">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
          {created ? (
            <>
              <button
                type="button"
                onClick={() => navigate(orgPath(created))}
                className="px-3.5 py-2 rounded-lg text-[13px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                View page
              </button>
              <button
                type="button"
                onClick={() => navigate("/page/posts?new=1")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-[13px] font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Post your first job <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={step === 1 ? leave : () => setStep((s) => s - 1)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {step > 1 && <FiArrowLeft className="w-3.5 h-3.5" />}
                {step === 1 ? "Cancel" : "Back"}
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-[13px] font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Continue <FiArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-[13px] font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <FiLoader className="w-3.5 h-3.5 animate-spin" /> Creating…
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-3.5 h-3.5" /> Create page
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}