import { useCallback, useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, TextInput } from 'react-native';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { Action, Body, Card, Screen, palette } from '@/components/ui';
import { runtime } from '@/config/runtime';
import { observeActivity } from '@/features/auth/lifecycle';
import { useAuth } from '@/features/auth/provider';
import { validateOwnerSetup, type SetupError } from '@/features/auth/owner-setup';

const invalid: Record<SetupError, string> = {
  email: 'Confira o e-mail do seu acesso.',
  code: 'Informe os 6 números do código de ativação.',
  password: 'Escolha uma senha com pelo menos 12 caracteres.',
  confirmation: 'As senhas precisam ser iguais.',
};
export default function CreateAccountScreen() {
  const auth = useAuth(), router = useRouter();
  const [email, setEmail] = useState(''), [code, setCode] = useState('');
  const [password, setPassword] = useState(''), [confirmation, setConfirmation] = useState('');
  const [notice, setNotice] = useState(''), [complete, setComplete] = useState(false);
  const busy = ['recovering', 'restoring'].includes(auth.snapshot.state);
  const clear = useCallback(() => { setEmail(''); setCode(''); setPassword(''); setConfirmation(''); setNotice(''); setComplete(false); }, []);
  useFocusEffect(useCallback(() => {
    auth.model?.lock();
    return () => { clear(); auth.model?.lock(); };
  }, [auth.model, clear]));
  useEffect(() => observeActivity(AppState, active => { if (!active) clear(); }), [clear]);
  if (!runtime.ownerSetupEnabled || !auth.configured) return <Redirect href="/login" />;
  const submit = async () => {
    if (busy) return;
    const suppliedEmail = email.trim(), suppliedCode = code.trim(), suppliedPassword = password;
    const error = validateOwnerSetup(suppliedEmail, suppliedCode, suppliedPassword, confirmation);
    if (error) { setNotice(invalid[error]); return; }
    setCode(''); setPassword(''); setConfirmation(''); setNotice('');
    if (await auth.model?.resetPassword(suppliedEmail, suppliedCode, suppliedPassword)) {
      setEmail(''); setComplete(true);
    }
  };
  const failure = auth.snapshot.error;
  return <Screen title={complete ? 'Seu acesso está pronto' : 'Criar meu acesso'} subtitle="Configure sua senha pessoal do Orbe. Nunca use a senha do seu banco." demonstration={false}>
    {complete ? <Card title="Senha definida"><Body>Agora entre com seu e-mail e a senha que você acabou de escolher.</Body><Action title="Ir para o login" onPress={() => router.replace('/login')} /></Card> : <Card title="Ativação privada">
      <Body>Por enquanto, o Orbe é exclusivo para você. Use o e-mail e o código temporário do arquivo privado de ativação preparado no seu computador. O código vale por 10 minutos.</Body>
      <Text style={styles.label}>E-mail do Orbe</Text>
      <TextInput accessibilityLabel="E-mail do Orbe" style={styles.input} value={email} onChangeText={setEmail} editable={!busy} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" />
      <Text style={styles.label}>Código de ativação · 6 números</Text>
      <TextInput accessibilityLabel="Código de ativação" style={styles.input} value={code} onChangeText={setCode} editable={!busy} keyboardType="number-pad" maxLength={6} autoComplete="off" textContentType="none" secureTextEntry />
      <Text style={styles.label}>Crie sua senha · mínimo de 12 caracteres</Text>
      <TextInput accessibilityLabel="Crie sua senha do Orbe" style={styles.input} value={password} onChangeText={setPassword} editable={!busy} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" />
      <Text style={styles.label}>Confirme sua senha</Text>
      <TextInput accessibilityLabel="Confirme sua senha do Orbe" style={styles.input} value={confirmation} onChangeText={setConfirmation} editable={!busy} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" />
      {notice !== '' && <Text style={styles.error} accessibilityLiveRegion="polite">{notice}</Text>}
      {failure && <Text style={styles.error} accessibilityLiveRegion="polite">{failure === 'rate_limited' ? 'Muitas tentativas. Aguarde antes de tentar novamente.' : failure === 'unavailable' ? 'Sem conexão ou serviço indisponível. Tente novamente.' : 'Não foi possível ativar. Confira os dados; se o código expirou, gere um novo arquivo de ativação.'}</Text>}
      <Action title={busy ? 'Configurando acesso…' : 'Definir minha senha'} disabled={busy || !email.trim() || code.length !== 6 || !password || !confirmation} onPress={() => { void submit(); }} />
    </Card>}
    {!runtime.publicRegistrationEnabled && <Body>O cadastro de outras pessoas ainda está desabilitado.</Body>}
    {!complete && <Action title="Já tenho senha · entrar" secondary onPress={() => router.replace('/login')} />}
  </Screen>;
}
const styles = StyleSheet.create({
  label: { fontSize: 15, fontWeight: '600', color: palette.ink },
  input: { borderWidth: 1, borderColor: palette.line, color: palette.ink, borderRadius: 10, padding: 14, minHeight: 48, fontSize: 17, backgroundColor: palette.background },
  error: { color: palette.danger, fontSize: 15, lineHeight: 23 },
});
