import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import MinhasCompras from "./MinhasCompras";
import Pagamento from "./Pagamento";
import Produtos from "./Produtos";
import { api } from "../services/api";

jest.mock("../services/api", () => ({
  api: { get: jest.fn(), patch: jest.fn(), post: jest.fn() },
}));
const mockNavigate = jest.fn();
let mockSearch = "";
jest.mock("react-router-dom", () => ({
  Link: ({ to, children }) => <a href={to}>{children}</a>,
  Navigate: () => null,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ search: mockSearch }),
  useSearchParams: () => [new URLSearchParams(mockSearch)],
}), { virtual: true });

const pendente = {
  id: 18, id_sessao: 2, filme: "Filme de teste", assento: "B1",
  pago: false, podePagar: true, podeCancelar: true, status: "ativo", valor_unitario: 12.51, valor: 12.51,
};
const pago = { ...pendente, id: 19, assento: "B2", pago: true, podePagar: false };
const cancelado = { ...pendente, id: 20, status: "cancelado", podePagar: false, podeCancelar: false };

beforeEach(() => {
  jest.resetAllMocks();
  localStorage.setItem("cineMaxSession", JSON.stringify({ nome: "Teste", email: "e2e@invalid.example" }));
  mockSearch = "";
});

afterEach(() => jest.restoreAllMocks());

it("oferece retomada somente para o ingresso elegível e cancelamento também para o pago autorizado", async () => {
  api.get.mockResolvedValue([pendente, pago, cancelado]);
  render(<MinhasCompras />);

  const acoes = await screen.findAllByRole("button", { name: "Cancelar ingresso" });
  expect(acoes).toHaveLength(2);
  const links = screen.getAllByRole("link", { name: "Continuar pagamento" });
  expect(links).toHaveLength(1);
  expect(links[0].getAttribute("href")).toBe("/pagamento?ingressos=18");
  expect(screen.getByText("Cancelado")).toBeTruthy();
});

it("solicita confirmação e atualiza o histórico após cancelar um ingresso pago", async () => {
  const confirm = jest.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
  const atualizado = { ...pago, status: "cancelado", podeCancelar: false };
  api.get.mockResolvedValueOnce([pago]).mockResolvedValueOnce([atualizado]);
  api.patch.mockResolvedValue(atualizado);
  render(<MinhasCompras />);

  const cancelar = await screen.findByRole("button", { name: "Cancelar ingresso" });
  fireEvent.click(cancelar);
  expect(confirm).toHaveBeenCalledWith(expect.stringContaining("B2"));
  expect(api.patch).not.toHaveBeenCalled();
  fireEvent.click(cancelar);
  expect(await screen.findByText("Ingresso cancelado.")).toBeTruthy();
  expect(api.patch).toHaveBeenCalledWith("/ingressos/19/cancelar");
  expect(api.get).toHaveBeenCalledTimes(2);
  expect(await screen.findByText("Cancelado")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Cancelar ingresso" })).toBeNull();
});

it.each([
  "Você só pode cancelar seus próprios ingressos.",
  "Ingresso não encontrado.",
  "Ingresso já cancelado.",
])("exibe a mensagem da API sem sucesso falso: %s", async (mensagem) => {
  jest.spyOn(window, "confirm").mockReturnValue(true);
  api.get.mockResolvedValue([pago]);
  api.patch.mockRejectedValue(new Error(mensagem));
  render(<MinhasCompras />);
  fireEvent.click(await screen.findByRole("button", { name: "Cancelar ingresso" }));
  expect((await screen.findByRole("alert")).textContent).toBe(mensagem);
  expect(screen.queryByText("Ingresso cancelado.")).toBeNull();
  await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
});

it("restaura o checkout a partir da URL, usa o preço da API e não repete pagamento já gravado", async () => {
  mockSearch = "?ingressos=18,19,18";
  api.get.mockResolvedValue([pendente, pago]);
  api.post.mockResolvedValue({});
  render(<Pagamento />);

  expect(await screen.findByText("R$ 12.51")).toBeTruthy();
  fireEvent.click(screen.getByRole("radio", { name: /Pix/ }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar pagamento" }));

  expect(await screen.findByText(/Pagamento confirmado com sucesso/)).toBeTruthy();
  expect(api.post.mock.calls).toEqual([["/pagamentos", { id_ingresso: 18, metodo_pagamento: "pix" }]]);
});

it.each([cancelado, { ...pendente, podePagar: false }])("não apresenta pagamento para ingresso indisponível", async (compra) => {
  mockSearch = "?ingressos=" + compra.id;
  api.get.mockResolvedValue([compra]);
  render(<Pagamento />);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Confirmar pagamento" })).toBeNull();
  expect(api.post).not.toHaveBeenCalled();
});

it("na grade, distingue assentos da mesma posição em fileiras diferentes e mantém ocupação e resumo", async () => {
  api.get.mockImplementation(async (rota) => ({
    "/catalogo/filmes": [{ id_filme: 1, titulo: "Filme de teste" }],
    "/catalogo/sessoes": [{ id_filme: 1, id_sessao: 2, id_sala: 3, preco: 25 }],
    "/catalogo/assentos": [
      { id_assento: 42, id_sala: 3, fila: "B", numero: 1 },
      { id_assento: 12, id_sala: 3, fila: "A", numero: 2 },
      { id_assento: 11, id_sala: 3, fila: "A", numero: 1 },
    ],
    "/sessoes/2/ocupacao": [{ id_assento: 12 }],
  })[rota]);
  const { container } = render(<Produtos />);
  await screen.findByRole("button", { name: "A1" });
  expect(within(container.querySelector(".assentos-grid")).getAllByRole("button").map((button) => button.textContent)).toEqual(["A1", "A2", "B1"]);
  expect(screen.getByRole("button", { name: "A2" }).disabled).toBe(true);
  fireEvent.click(screen.getAllByRole("button", { name: "+" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "B1" }));
  expect(screen.getByRole("button", { name: "B1" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByDisplayValue("B1")).toBeTruthy();
});
