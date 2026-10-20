import { useEffect, useState } from 'react';
import { AppState, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Action, Body, Card, Screen, palette } from '@/components/ui';
import { observeActivity } from '@/features/auth/lifecycle';
import { useAuth } from '@/features/auth/provider';
import { runtime } from '@/config/runtime';
import { recoveryEnabled } from '@/config/auth';
import type { AuthCode } from '@/features/auth/gateway';
const messages: Record<AuthCode, string> = {
  invalid_configuration: 'O login ainda não está disponível.',
  invalid_credentials: 'Não foi possível entrar. Confira seus dados e tente novamente.',
  rate_limited: 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.',
  unavailable: 'Serviço indisponível ou sem conexão. Tente novamente.',
  cancelled: 'Operação cancelada. Tente novamente.',
  expired_code: 'Código inválido ou expirado. Solicite um novo código.',
  secure_storage: 'Não foi possível acessar o armazenamento seguro do iPhone. Confira se o aparelho tem um código de desbloqueio. Se ocorreu ao sair, tente remover o acesso salvo novamente.',
  weak_password: 'Use uma senha com pelo menos 12 caracteres.',
};
export default function LoginScreen() {
  const auth = useAuth(), router = useRouter();
  const [mode, setMode] = useState<'login' | 'recover' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');
  const [remember, setRemember] = useState(true);
  const busy = ['authenticating', 'sending_code', 'recovering', 'restoring'].includes(auth.snapshot.state);
  useEffect(() => () => { if (auth.model?.getSnapshot().state !== 'unlocked') auth.model?.lock(); }, [auth.model]);
  useEffect(() => observeActivity(AppState, active => {
    if (!active) { setEmail(''); setPassword(''); setCode(''); setNotice(''); setMode('login'); }
  }), []);
  if (auth.snapshot.state === 'unlocked') return <Redirect href="/account" />;
  if (!auth.configured) return <Screen title="Login indisponível" subtitle="O acesso ainda está em configuração." demonstration={false}><Action title="Voltar ao início" onPress={() => router.replace('/')} /></Screen>;
  const changeMode = (next: typeof mode) => { auth.model?.lock(); setPassword(''); setCode(''); setNotice(''); setMode(next); };
  const submit = async () => {
    if (busy) return;
    const suppliedPassword = password;
    setPassword(''); setNotice('');
    if (mode === 'login') {
      await auth.model?.login(email.trim(), suppliedPassword, remember);
    } else if (mode === 'recover' && recoveryEnabled) {
      if (await auth.model?.requestRecovery(email.trim())) { setNotice('Se houver uma conta habilitada, você receberá um código no e-mail informado.'); setMode('reset'); }
    } else if (mode === 'reset' && recoveryEnabled) {
      const suppliedCode = code; setCode('');
      if (await auth.model?.resetPassword(email.trim(), suppliedCode, suppliedPassword)) { setMode('login'); setNotice('Senha atualizada. Entre novamente com sua nova senha.'); }
    }
  };
  return <Screen title={mode === 'login' ? 'Entre no seu Orbe' : mode === 'recover' ? 'Recuperar acesso' : 'Redefinir sua senha'} subtitle="Use sua conta do Orbe. Nunca informe a senha do seu banco." demonstration={false}>
    <Card title={mode === 'login' ? 'Sua conta' : 'Recuperação por código'}>
      <Text style={styles.label}>E-mail do Orbe</Text>
      <TextInput style={styles.input} accessibilityLabel="E-mail do Orbe" value={email} onChangeText={setEmail} editable={!busy} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" />
      {mode === 'reset' && <><Text style={styles.label}>Código recebido por e-mail</Text><TextInput style={styles.input} accessibilityLabel="Código de recuperação" value={code} onChangeText={setCode} editable={!busy} keyboardType="number-pad" maxLength={6} autoComplete="one-time-code" textContentType="oneTimeCode" /></>}
      {mode !== 'recover' && <><Text style={styles.label}>{mode === 'reset' ? 'Nova senha · mínimo de 12 caracteres' : 'Senha do Orbe'}</Text><TextInput style={styles.input} accessibilityLabel={mode === 'reset' ? 'Nova senha do Orbe' : 'Senha do Orbe'} value={password} onChangeText={setPassword} editable={!busy} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete={mode === 'reset' ? 'new-password' : 'current-password'} textContentType={mode === 'reset' ? 'newPassword' : 'password'} /></>}
      {mode === 'login' && auth.model?.canRemember && <View style={styles.remember}><Text style={styles.rememberLabel}>Manter meu acesso neste iPhone</Text><Switch accessibilityLabel="Manter meu acesso neste iPhone" value={remember} onValueChange={setRemember} disabled={busy} /></View>}
      {mode === 'login' && auth.model?.canRemember && <Body>O Orbe guarda um token protegido pelo iPhone, sem salvar sua senha. Quem tiver o aparelho desbloqueado poderá retomar seu acesso.</Body>}
      {auth.snapshot.error && <Text style={styles.error} accessibilityLiveRegion="polite">{messages[auth.snapshot.error]}</Text>}
      {notice !== '' && <Body>{notice}</Body>}
      <Action title={busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : mode === 'recover' ? 'Enviar código' : 'Atualizar senha'} disabled={busy || !email.trim() || (mode !== 'recover' && !password) || (mode === 'reset' && code.length !== 6)} onPress={() => { void submit(); }} />
      {mode === 'login' && auth.model?.hasRememberedAccess() && <>{auth.model.canResumeSavedAccess() && <Action title="Tentar retomar meu acesso" secondary disabled={busy} onPress={() => { void auth.model?.resume(); }} />}<Action title="Esquecer acesso neste iPhone" secondary disabled={busy} onPress={() => { void auth.model?.logout(); }} /></>}
      {recoveryEnabled ? <Action title={mode === 'login' ? 'Esqueci minha senha' : 'Voltar ao login'} secondary disabled={busy} onPress={() => changeMode(mode === 'login' ? 'recover' : 'login')} /> : <Body>A recuperação de senha por e-mail ainda está em configuração nesta versão.</Body>}
    </Card>
    {runtime.ownerSetupEnabled && <Action title="Criar meu acesso" secondary disabled={busy} onPress={() => { auth.model?.lock(); setPassword(''); setCode(''); router.push('/create-account'); }} />}
    <Body>Face ID não está disponível no Expo Go. Sua senha nunca fica salva no Orbe.</Body>
    <Action title="Voltar ao início" secondary onPress={() => { auth.model?.lock(); setPassword(''); setCode(''); router.replace('/'); }} />
  </Screen>;
}
const styles = StyleSheet.create({
  remember: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rememberLabel: { flex: 1, fontSize: 15, color: palette.ink },
  label: { fontSize: 15, fontWeight: '600', color: palette.ink },
  input: { borderWidth: 1, borderColor: palette.line, color: palette.ink, borderRadius: 10, padding: 14, minHeight: 48, fontSize: 17, backgroundColor: palette.background },
  error: { color: '#8B2424', fontSize: 15, lineHeight: 23 },
});
