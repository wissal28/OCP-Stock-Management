export type CsvUser = {
  id: string;
  matricule: string;
  email: string;
  fullName: string;
  phone: string;
  filiale: string;
  fonction: string;
  departement: string;
  statut: "actif" | "inactif" | "bloque";
  role: string;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Erreur API.");
  }
  return payload as T;
}

export async function loginUser(identifier: string, password: string) {
  const payload = await requestJson<{ user: CsvUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password })
  });
  return payload.user;
}

export async function createUser(input: {
  fullName: string;
  matricule: string;
  email: string;
  phone?: string;
  filiale: string;
  fonction: string;
  departement: string;
  password: string;
}) {
  const payload = await requestJson<{ user: CsvUser }>("/api/users", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return payload.user;
}

export async function listUsers() {
  const payload = await requestJson<{ users: CsvUser[] }>("/api/users");
  return payload.users;
}

export async function getUser(matricule: string) {
  const payload = await requestJson<{ user: CsvUser }>(`/api/users/${encodeURIComponent(matricule)}`);
  return payload.user;
}

export async function updateUser(matricule: string, patch: Partial<CsvUser>) {
  const payload = await requestJson<{ user: CsvUser }>(`/api/users/${encodeURIComponent(matricule)}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
  return payload.user;
}

export async function changeUserPassword(matricule: string, oldPassword: string, newPassword: string) {
  const payload = await requestJson<{ user: CsvUser }>(`/api/users/${encodeURIComponent(matricule)}/password`, {
    method: "PATCH",
    body: JSON.stringify({ oldPassword, newPassword })
  });
  return payload.user;
}
