import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminSalaForm from './AdminSalaForm';
import { api } from '../services/api';

jest.mock('../services/api', () => ({ api: { get: jest.fn(), post: jest.fn(), put: jest.fn() } }));
// Isola navegação: CRA/Jest 27 não resolve os exports browser do Router 7.
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate, useParams: () => ({}) }), { virtual: true });
jest.mock('../componentes/common/AdminNav', () => () => null);
const post = api.post as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it('cria sala de 48 lugares e usa a geração transacional A1–F8 da API', async () => {
  post.mockResolvedValueOnce({ id_sala: 7 }).mockResolvedValueOnce({ criados: 48, total: 48 });
  const { container } = render(<AdminSalaForm mode="create" />);
  const capacity = screen.getByRole('spinbutton', { name: 'Capacidade' }) as HTMLInputElement;
  expect(capacity.value).toBe('48');
  expect(capacity.readOnly).toBe(true);
  fireEvent.change(container.querySelector('input[name="nome"]')!, { target: { value: 'Sala de teste' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/salas'));
  expect(post.mock.calls).toEqual([
    ['/salas', { nome: 'Sala de teste', capacidade: 48 }],
    ['/salas/7/assentos/gerar', {}],
  ]);
});

it('não gera assentos quando a opção está desmarcada e informa falha sem repetir escrita', async () => {
  post.mockRejectedValueOnce(new Error('Falha de teste'));
  const { container } = render(<AdminSalaForm mode="create" />);
  fireEvent.change(container.querySelector('input[name="nome"]')!, { target: { value: 'Sala de teste' } });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
  await waitFor(() => expect(screen.getByText('Falha de teste')).toBeTruthy());
  expect(post).toHaveBeenCalledTimes(1);
});
