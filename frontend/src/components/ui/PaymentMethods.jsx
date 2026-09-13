import { useState, useEffect } from "react";
import { getBackendUrl, getAuthHeaders } from "../../utils/auth";
import {
  FiCreditCard,
  FiPlus,
  FiX,
  FiCheck,
  FiTrash2,
  FiShield,
} from "react-icons/fi";

// ---------- Card helpers (validation + formatting) ----------

function detectBrand(digits) {
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]|7[01]|720))/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6(?:011|5)/.test(digits)) return "Discover";
  return "Card";
}

function luhnValid(digits) {
  let sum = 0;
  let doubleUp = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (doubleUp) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    doubleUp = !doubleUp;
  }
  return digits.length > 0 && sum % 10 === 0;
}

function formatCardNumber(value, brand) {
  const digits = value.replace(/\D/g, "").slice(0, brand === "Amex" ? 15 : 16);
  if (brand === "Amex") {
    // 4-6-5 grouping
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 4));
    if (digits.length > 4) parts.push(digits.slice(4, 10));
    if (digits.length > 10) parts.push(digits.slice(10, 15));
    return { display: parts.join(" "), digits };
  }
  return { display: (digits.match(/.{1,4}/g) || []).join(" "), digits };
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function validateCard({ name, number, expiry, cvc }) {
  const errors = {};
  const digits = number.replace(/\D/g, "");
  const brand = detectBrand(digits);
  const expectedLen = brand === "Amex" ? 15 : 16;

  if (!name.trim() || name.trim().length < 2) {
    errors.name = "Enter the name on the card.";
  }
  if (digits.length !== expectedLen) {
    errors.number = `Card number must be ${expectedLen} digits.`;
  } else if (!luhnValid(digits)) {
    errors.number = "This card number looks invalid. Please check it.";
  }

  const m = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!m) {
    errors.expiry = "Use MM/YY format.";
  } else {
    const mm = parseInt(m[1], 10);
    const yy = parseInt(m[2], 10);
    const now = new Date();
    const curYY = now.getFullYear() % 100;
    const curMM = now.getMonth() + 1;
    if (mm < 1 || mm > 12) {
      errors.expiry = "Month must be 01–12.";
    } else if (yy < curYY || (yy === curYY && mm < curMM)) {
      errors.expiry = "This card has expired.";
    }
  }

  const cvcDigits = cvc.replace(/\D/g, "");
  const expectedCvc = brand === "Amex" ? 4 : 3;
  if (cvcDigits.length !== expectedCvc) {
    errors.cvc = brand === "Amex" ? "Amex CVC is 4 digits." : "CVC is 3 digits.";
  }

  return { errors, brand, digits };
}

function brandStyles(brand) {
  switch (brand) {
    case "Visa":
      return "bg-blue-600 text-white";
    case "Mastercard":
      return "bg-gray-900 text-white";
    case "Amex":
      return "bg-teal-600 text-white";
    case "Discover":
      return "bg-orange-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

/**
 * PaymentMethods — add/list/remove cards with full client-side validation.
 * Cards persist via the billing API (brand + last 4 + expiry only);
 * the full PAN and CVC are never sent to or stored on the server.
 */
export default function PaymentMethods({ organizationId = null }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", number: "", expiry: "", cvc: "" });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const scopeQuery = organizationId ? `?organization_id=${organizationId}` : "";
  const scopeBody = organizationId ? { organization_id: organizationId } : {};

  const toUiCard = (c) => ({
    id: c.id,
    brand: c.brand,
    last4: c.last4,
    expMonth: c.exp_month,
    expYear: c.exp_year,
    name: c.cardholder_name,
    isDefault: c.is_default,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${getBackendUrl()}/api/payment-methods${scopeQuery}`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setCards((Array.isArray(data) ? data : []).map(toUiCard));
        }
      } catch (e) {
        console.error("Failed to load payment methods:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const setField = (field, value) => {
    let v = value;
    if (field === "number") {
      const brand = detectBrand(value.replace(/\D/g, ""));
      v = formatCardNumber(value, brand).display;
    } else if (field === "expiry") {
      v = formatExpiry(value);
    } else if (field === "cvc") {
      v = value.replace(/\D/g, "").slice(0, 4);
    }
    setForm((p) => ({ ...p, [field]: v }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const { errors: errs, brand, digits } = validateCard(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const expMatch = form.expiry.match(/^(\d{2})\/(\d{2})$/);
    setActionBusy(true);
    try {
      // NOTE: only safe metadata leaves the browser — never PAN/CVC.
      const res = await fetch(`${getBackendUrl()}/api/payment-methods`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({
          brand,
          last4: digits.slice(-4),
          exp_month: parseInt(expMatch[1], 10),
          exp_year: 2000 + parseInt(expMatch[2], 10),
          cardholder_name: form.name.trim(),
          ...scopeBody,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ type: "error", text: result.error || "Failed to save card." });
        return;
      }
      setCards((prev) => {
        const next = [...prev.map((c) => ({ ...c, isDefault: result.is_default ? false : c.isDefault })), toUiCard(result)];
        return next.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
      });
      setForm({ name: "", number: "", expiry: "", cvc: "" });
      setErrors({});
      setShowForm(false);
      setMsg({ type: "success", text: `${brand} ending in ${digits.slice(-4)} added.` });
    } catch (err) {
      console.error("Failed to save card:", err);
      setMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setActionBusy(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Remove this payment method?")) return;
    setActionBusy(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/payment-methods/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        setMsg({ type: "error", text: result.error || "Failed to remove card." });
        return;
      }
      const removed = cards.find((c) => c.id === id);
      let next = cards.filter((c) => c.id !== id);
      if (removed?.isDefault && next.length > 0) {
        next = next.map((c, i) => ({ ...c, isDefault: i === 0 }));
      }
      setCards(next);
      setMsg({ type: "success", text: "Payment method removed." });
    } catch (err) {
      console.error("Failed to remove card:", err);
      setMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setActionBusy(false);
    }
  };

  const handleSetDefault = async (id) => {
    setActionBusy(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/payment-methods/${id}/default`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        setMsg({ type: "error", text: result.error || "Failed to set default." });
        return;
      }
      setCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));
    } catch (err) {
      console.error("Failed to set default:", err);
      setMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setActionBusy(false);
    }
  };

  const previewBrand = detectBrand(form.number.replace(/\D/g, ""));

  return (
    <div>
      {msg && (
        <div className={`px-4 py-3 text-sm border mb-4 ${msg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><div className="animate-spin h-6 w-6 border-2 border-gray-200 border-t-blue-600 rounded-full" /></div>
      ) : cards.length > 0 ? (
        <div className="space-y-3">
          {cards.map((card) => (
            <div key={card.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-12 h-9 flex items-center justify-center text-[10px] font-bold rounded shrink-0 ${brandStyles(card.brand)}`}>
                  {card.brand === "Mastercard" ? "MC" : card.brand.slice(0, 4).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {card.brand} •••• {card.last4}
                    {card.isDefault && <span className="ml-2 text-[10px] font-bold bg-green-600 text-white px-2 py-0.5 rounded-full">DEFAULT</span>}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{card.name} • Expires {card.expMonth}/{card.expYear}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!card.isDefault && (
                  <button onClick={() => handleSetDefault(card.id)} disabled={actionBusy} className="text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                    Set default
                  </button>
                )}
                <button onClick={() => handleRemove(card.id)} disabled={actionBusy} title="Remove card" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 disabled:opacity-50">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg">
            <FiCreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No payment methods yet</p>
            <p className="text-xs text-gray-400 mt-1">Add a card to upgrade to Pro later</p>
          </div>
        )
      )}

      {showForm ? (
        <form onSubmit={handleAdd} noValidate className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
          {/* Live card preview */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-5">
            <div className="flex items-center justify-between">
              <FiCreditCard className="w-6 h-6 text-white/70" />
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${brandStyles(previewBrand)}`}>{previewBrand.toUpperCase()}</span>
            </div>
            <p className="mt-4 font-mono text-lg tracking-widest">{form.number || "•••• •••• •••• ••••"}</p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-gray-300 uppercase truncate">{form.name || "CARDHOLDER NAME"}</span>
              <span className="text-gray-300 font-mono">{form.expiry || "MM/YY"}</span>
            </div>
          </div>
          <div className="p-5 space-y-4 bg-white">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Name on card</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Jane Doe"
                autoComplete="cc-name"
                className={`w-full px-3 py-2.5 bg-gray-50 border text-sm focus:outline-none focus:bg-white ${errors.name ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-blue-500"}`}
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Card number</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.number}
                onChange={(e) => setField("number", e.target.value)}
                placeholder={previewBrand === "Amex" ? "3782 822463 10005" : "4242 4242 4242 4242"}
                autoComplete="cc-number"
                className={`w-full px-3 py-2.5 bg-gray-50 border text-sm font-mono focus:outline-none focus:bg-white ${errors.number ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-blue-500"}`}
              />
              {errors.number ? <p className="text-xs text-red-600 mt-1">{errors.number}</p> : <p className="text-xs text-gray-400 mt-1">Visa, Mastercard, Amex and Discover accepted.</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Expiry</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.expiry}
                  onChange={(e) => setField("expiry", e.target.value)}
                  placeholder="MM/YY"
                  autoComplete="cc-exp"
                  className={`w-full px-3 py-2.5 bg-gray-50 border text-sm font-mono focus:outline-none focus:bg-white ${errors.expiry ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-blue-500"}`}
                />
                {errors.expiry && <p className="text-xs text-red-600 mt-1">{errors.expiry}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">CVC</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={form.cvc}
                  onChange={(e) => setField("cvc", e.target.value)}
                  placeholder={previewBrand === "Amex" ? "4 digits" : "3 digits"}
                  autoComplete="cc-csc"
                  className={`w-full px-3 py-2.5 bg-gray-50 border text-sm font-mono focus:outline-none focus:bg-white ${errors.cvc ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-blue-500"}`}
                />
                {errors.cvc && <p className="text-xs text-red-600 mt-1">{errors.cvc}</p>}
              </div>
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1.5"><FiShield className="w-3.5 h-3.5 shrink-0" /> Only the brand, last 4 digits and expiry are saved on this device. Full number and CVC are never stored.</p>
            <div className="flex gap-2">
              <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                <FiCheck className="w-4 h-4" /> Save card
              </button>
              <button type="button" onClick={() => { setShowForm(false); setErrors({}); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <FiX className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button onClick={() => { setShowForm(true); setMsg(null); }} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium hover:bg-black transition-colors">
          <FiPlus className="w-4 h-4" /> Add payment method
        </button>
      )}
    </div>
  );
}
