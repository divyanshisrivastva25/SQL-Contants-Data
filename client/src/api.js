async function request(url, options) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Something went wrong.");
  }
  return res.status === 204 ? null : res.json();
}

export const getContacts = (q = "") => request(`/api/contacts?q=${encodeURIComponent(q)}`);
export const createContact = (data) => request("/api/contacts", { method: "POST", body: JSON.stringify(data) });
export const updateContact = (id, data) => request(`/api/contacts/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteContact = (id) => request(`/api/contacts/${id}`, { method: "DELETE" });
