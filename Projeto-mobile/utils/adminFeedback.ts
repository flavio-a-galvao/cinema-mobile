import { Alert, Platform } from 'react-native';
import { isAxiosError } from 'axios';
export function adminError(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) return 'Não foi possível conectar ao servidor.';
    if (error.response.status === 401 || error.response.status === 403) return 'Esta ação exige uma sessão de administrador válida.';
    if ([400, 404, 409].includes(error.response.status) && typeof error.response.data?.message === 'string') return error.response.data.message;
  }
  return 'Não foi possível concluir a operação. Tente novamente.';
}
export function confirmAdminDelete(name: string, action: () => void): void {
  const message = 'Excluir “' + name + '”? Esta ação não pode ser desfeita.';
  if (Platform.OS === 'web') { if (window.confirm(message)) action(); return; }
  Alert.alert('Confirmar exclusão', message, [{ text: 'Voltar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: action }]);
}
