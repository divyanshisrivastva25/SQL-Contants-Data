import { useEffect, useMemo, useState } from "react";
import { COUNTRIES, getCountry, splitPhone, phoneError } from "./countries";
import { getContacts, createContact, updateContact, deleteContact } from "./api";

const EMPTY = { name: "", email: "", dial: "+91", phone: "", city: "", notes: "" };
const initials = (n) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
const esc = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const lenText = (c) => (c.min === c.max ? `${c.min} digits` : `${c.min} to ${c.max} digits`);

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [showSql, setShowSql] = useState(false);
  const [log, setLog] = useState(["SELECT * FROM contacts ORDER BY name;"]);

  const notify = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };
  const say = (sql) => setLog((l) => [sql, ...l].slice(0, 8));
  const country = getCountry(form.dial);

  const load = async (q = search) => {
    try {
      setContacts(await getContacts(q));
      setError((e) => (e.startsWith("Can't reach") ? "" : e));
    } catch {
      setError("Can't reach the server. Start it with: cd server && npm start");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => load(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const changePhone = (e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, country.max) });
  const changeDial = (e) => setForm({ ...form, dial: e.target.value, phone: form.phone.slice(0, getCountry(e.target.value).max) });
  const reset = () => { setForm(EMPTY); setEditId(null); setError(""); };

  const onSearch = (v) => {
    setSearch(v);
    if (v.trim())
      say(`SELECT * FROM contacts\nWHERE name LIKE '%${v}%' OR email LIKE '%${v}%'\n   OR phone LIKE '%${v}%' OR city LIKE '%${v}%';`);
  };

  const save = async (e) => {
    e.preventDefault();
    const c = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]));
    const pErr = phoneError(form.dial, c.phone);
    c.phone = c.phone ? `${form.dial} ${c.phone}` : "";
    delete c.dial;
    if (!c.name) return setError("Name is required.");
    if (c.email && !/^\S+@\S+\.\S+$/.test(c.email)) return setError("Enter a valid email address.");
    if (pErr) return setError(pErr);
    try {
      if (editId) {
        await updateContact(editId, c);
        say(`UPDATE contacts SET name=${esc(c.name)}, email=${esc(c.email)}, phone=${esc(c.phone)},\n  city=${esc(c.city)}, notes=${esc(c.notes)}\nWHERE id=${editId};`);
        notify("Contact updated");
      } else {
        await createContact(c);
        say(`INSERT INTO contacts (name, email, phone, city, notes)\nVALUES (${esc(c.name)}, ${esc(c.email)}, ${esc(c.phone)}, ${esc(c.city)}, ${esc(c.notes)});`);
        notify("Contact added");
      }
      reset();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (c) => {
    const sp = splitPhone(c.phone || "");
    setEditId(c.id);
    setError("");
    setForm({ name: c.name, email: c.email || "", dial: sp.dial, phone: sp.number, city: c.city || "", notes: c.notes || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async () => {
    const c = toDelete;
    await deleteContact(c.id);
    say(`DELETE FROM contacts WHERE id=${c.id};`);
    if (editId === c.id) reset();
    setToDelete(null);
    notify("Contact deleted");
    load();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="display text-4xl">Contact book</h1>
        <p className="muted mt-1 text-sm">Add, find, edit and remove the people you keep in touch with.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <form onSubmit={save} className="card h-fit space-y-3 rounded-lg p-5">
            <h2 className="display text-xl">{editId ? "Edit contact" : "New contact"}</h2>
            {error && (
              <p role="alert" className="rounded-md px-3 py-2 text-sm"
                style={{ background: "color-mix(in srgb, var(--rust) 15%, transparent)", color: "var(--rust)" }}>{error}</p>
            )}
            <input className="field" name="name" placeholder="Full name *" value={form.name} onChange={change} />
            <input className="field" name="email" placeholder="Email" value={form.email} onChange={change} />
            <div>
              <div className="flex gap-2">
                <select aria-label="Country code" className="field shrink-0" style={{ width: "7.5rem" }} value={form.dial} onChange={changeDial}>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <input className="field" name="phone" type="tel" inputMode="numeric" placeholder="Phone number"
                  maxLength={country.max} value={form.phone} onChange={changePhone} />
              </div>
              <p className="muted mt-1 text-xs">{country.name}: {lenText(country)}</p>
            </div>
            <input className="field" name="city" placeholder="City" value={form.city} onChange={change} />
            <textarea className="field" name="notes" rows="3" placeholder="Notes" value={form.notes} onChange={change} />
            <div className="flex gap-2">
              <button className="btn flex-1">{editId ? "Save changes" : "Add contact"}</button>
              {editId && <button type="button" className="ghost" onClick={reset}>Cancel</button>}
            </div>
          </form>

          <div>
            <button type="button" className="ghost" onClick={() => setShowSql(!showSql)}>
              {showSql ? "Hide SQL log" : "Show SQL log"}
            </button>
            {showSql && <pre className="sql mt-2">{log.join("\n\n")}</pre>}
            <p className="muted mt-2 text-xs">The SQL log lists the statements your last actions ran on the database.</p>
          </div>
        </div>

        <section>
          <input className="field mb-4" placeholder="Search by name, email, phone or city" value={search} onChange={(e) => onSearch(e.target.value)} />
          {loading ? (
            <p className="muted p-8 text-center text-sm">Loading contacts...</p>
          ) : contacts.length === 0 ? (
            <p className="muted rounded-lg p-8 text-center text-sm" style={{ border: "1px dashed var(--mist)" }}>
              {search ? "No contacts match your search." : "No contacts yet. Add your first one using the form."}
            </p>
          ) : (
            <ul className="card overflow-hidden rounded-lg">
              {contacts.map((c) => (
                <li key={c.id} className={"row flex items-start gap-4 p-4" + (editId === c.id ? " active" : "")} style={{ borderTop: "1px solid var(--mist)" }}>
                  <div className="avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">{initials(c.name)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{c.name}</p>
                    <p className="muted break-words text-sm">{[c.email, c.phone, c.city].filter(Boolean).join("  |  ") || "No details"}</p>
                    {c.notes && <p className="muted mt-1 text-sm">{c.notes}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button className="lnk" style={{ color: "var(--pine)" }} onClick={() => edit(c)}>Edit</button>
                    <button className="lnk" style={{ color: "var(--rust)" }} onClick={() => setToDelete(c)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {toDelete && (
        <div className="fixed inset-0 z-10 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.45)" }} onClick={() => setToDelete(null)}>
          <div role="dialog" aria-modal="true" className="card w-full max-w-sm rounded-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="display text-xl">Delete {toDelete.name}?</h3>
            <p className="muted mt-2 text-sm">This removes the contact from the database and can’t be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="ghost" onClick={() => setToDelete(null)}>Keep contact</button>
              <button className="btn" style={{ background: "var(--rust)", color: "#fff" }} onClick={remove}>Delete contact</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-md px-4 py-2 text-sm shadow-lg"
          style={{ background: "var(--ink)", color: "var(--paper)" }}>{toast}</div>
      )}
    </div>
  );
}
