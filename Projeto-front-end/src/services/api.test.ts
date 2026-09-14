import { api } from "./api";

type MockResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

function makeResponse(ok: boolean, status: number, body: string): Response {
  const response: MockResponse = {
    ok,
    status,
    text: async () => body,
  };
  return response as Response;
}

describe("api service", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("envia token Bearer quando sessao existe", async () => {
    localStorage.setItem(
      "cineMaxSession",
      JSON.stringify({ token: "token-de-teste" })
    );

    const fetchMock = jest.fn().mockResolvedValue(
      makeResponse(true, 200, JSON.stringify({ ok: true }))
    );
    global.fetch = fetchMock;

    await api.get<{ ok: boolean }>("/filmes");

    expect(fetchMock).toHaveBeenCalledWith("https://cinema.local/api/filmes", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-de-teste",
      },
    });
  });

  it("remove sessao e retorna mensagem amigavel em 401", async () => {
    localStorage.setItem(
      "cineMaxSession",
      JSON.stringify({ token: "token-expirado" })
    );

    const fetchMock = jest.fn().mockResolvedValue(
      makeResponse(false, 401, JSON.stringify({ message: "Token invalido." }))
    );
    global.fetch = fetchMock;

    await expect(api.get("/perfil")).rejects.toThrow("Token invalido.");
    expect(localStorage.getItem("cineMaxSession")).toBeNull();
  });

  it("retorna erro de conexao amigavel em falha de rede", async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error("network error"));
    global.fetch = fetchMock;

    await expect(api.get("/filmes")).rejects.toThrow(
      "Nao foi possivel conectar com a API. Verifique se o cinema.local esta acessivel."
    );
  });
});
