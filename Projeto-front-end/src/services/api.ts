const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cinema.local/api";

type RequestOptions = RequestInit & { headers?: HeadersInit };

interface ApiErrorPayload {
  message?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const rawSession = localStorage.getItem("cineMaxSession") || "null";
  const session = JSON.parse(rawSession);
  const token = session?.token ? String(session.token) : "";

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch {
    throw new Error("Nao foi possivel conectar com a API. Verifique se o cinema.local esta acessivel.");
  }

  const text = await response.text();
  let data: T | null = null;
  let payloadMessage: string | undefined;

  if (text) {
    try {
      const parsed = JSON.parse(text) as T;
      data = parsed;

      if (typeof parsed === "object" && parsed !== null && "message" in parsed) {
        const message = (parsed as ApiErrorPayload).message;
        if (typeof message === "string") {
          payloadMessage = message;
        }
      }
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const status = Number(response.status || 0);
    const dataMessage = payloadMessage;
    let message = dataMessage || "Erro ao comunicar com o servidor.";

    if (status === 401) {
      message = dataMessage || "Sessao expirada ou invalida. Faca login novamente.";
      if (token) {
        localStorage.removeItem("cineMaxSession");
        window.dispatchEvent(new Event("cineMaxAuthChanged"));
      }
    }

    if (status === 403) {
      message = dataMessage || "Voce nao tem permissao para esta acao.";
    }

    throw new Error(message);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: object) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: <T>(path: string, body: object) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: "DELETE",
    }),
};
