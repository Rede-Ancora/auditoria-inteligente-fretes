import { useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Lock, Mail, ShieldAlert, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuditSession } from "./AuditSession";
import { useAuditData } from "./AuditData";

const LOGO_URL =
  "https://cdn.redeancora.com.br/Manual_da_Marca/Logotipo_Oficial/Logotipo_Oficial_Rede_ANCORA.png";
const roleNames: Record<string, string> = {
  admin: "Administrador",
  transportes: "Transportes",
  consulta: "Consulta",
};
type Mode = "signin" | "signup" | "reset";

function authMessage(message: string) {
  const text = message.toLowerCase();
  if (text.includes("invalid login"))
    return "E-mail ou senha incorretos. Se ainda não criou a sua senha, use Primeiro acesso.";
  if (text.includes("not confirmed"))
    return "O seu e-mail ainda não foi confirmado. Abra o link de confirmação que enviamos (confira também a caixa de spam ou lixo eletrônico).";
  if (text.includes("already registered"))
    return "Este e-mail já tem cadastro. Use Esqueci minha senha para criar uma nova senha.";
  if (text.includes("signup") && (text.includes("disabled") || text.includes("not allowed")))
    return "O cadastro de senha está desligado no Lovable Cloud. Peça ao responsável pelo projeto para ativar o login por e-mail.";
  if (text.includes("password should") || text.includes("weak"))
    return "A senha precisa ter pelo menos 8 caracteres, com letras e números.";
  if (
    text.includes("rate limit") ||
    text.includes("too many") ||
    text.includes("security purposes")
  )
    return "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.";
  if (text.includes("sending") && text.includes("email"))
    return "Não foi possível enviar o e-mail de confirmação. Tente de novo em alguns minutos.";
  return `Não foi possível concluir. Detalhe: ${message}`;
}

function GateShell({ children }: { children: ReactNode }) {
  return (
    <main className="gate">
      <div className="gate-card">
        <img className="gate-logo" src={LOGO_URL} alt="Rede ANCORA" />
        <span className="top-eyebrow">Logística · Rede ANCORA</span>
        <h1 className="gate-title">Auditoria Inteligente de Fretes</h1>
        {children}
      </div>
      <p className="gate-foot">Acesso restrito a usuários autorizados pela Rede ANCORA.</p>
    </main>
  );
}

function LoginForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setNotice("");
    setPassword("");
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const address = email.trim().toLowerCase();
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: address, password });
        if (error) setError(authMessage(error.message));
      } else if (mode === "signup") {
        if (password.length < 8) {
          setError("A senha precisa ter pelo menos 8 caracteres.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: address,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) setError(authMessage(error.message));
        else if (data.user && data.user.identities?.length === 0)
          setError(authMessage("already registered"));
        else if (data.session) setNotice("Senha criada.");
        else {
          setNotice(
            `Enviamos um link de confirmação para ${address}. Abra o e-mail (confira também a caixa de spam ou lixo eletrônico), clique no link e depois entre com a senha criada.`,
          );
          setMode("signin");
          setPassword("");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(address, {
          redirectTo: window.location.origin,
        });
        if (error) setError(authMessage(error.message));
        else
          setNotice(
            `Se ${address} tiver acesso, você vai receber um link para criar uma nova senha.`,
          );
      }
    } finally {
      setBusy(false);
    }
  }
  const titles = {
    signin: "Entre com o seu e-mail corporativo",
    signup: "Primeiro acesso: crie a sua senha",
    reset: "Receba um link para criar uma nova senha",
  };
  return (
    <>
      <p className="gate-sub">{titles[mode]}</p>
      <form className="gate-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="gate-email">E-mail</label>
          <div className="gate-input">
            <Mail aria-hidden="true" />
            <input
              id="gate-email"
              type="email"
              autoComplete="email"
              placeholder="nome.sobrenome@redeancora.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        {mode !== "reset" && (
          <div className="field">
            <label htmlFor="gate-password">{mode === "signup" ? "Crie uma senha" : "Senha"}</label>
            <div className="gate-input">
              <Lock aria-hidden="true" />
              <input
                id="gate-password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={mode === "signup" ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
        )}
        {error && (
          <p className="gate-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="gate-notice" role="status">
            {notice}
          </p>
        )}
        <Button
          variant="approved"
          size="approved"
          className="btn-primary gate-submit"
          type="submit"
          disabled={busy}
        >
          {busy && <Loader2 className="spin" />}
          {mode === "signin" ? "Entrar" : mode === "signup" ? "Criar senha" : "Enviar link"}
        </Button>
      </form>
      <div className="gate-links">
        {mode === "signin" ? (
          <>
            <button type="button" onClick={() => switchMode("signup")}>
              Primeiro acesso
            </button>
            <button type="button" onClick={() => switchMode("reset")}>
              Esqueci minha senha
            </button>
          </>
        ) : (
          <button type="button" onClick={() => switchMode("signin")}>
            Voltar para Entrar
          </button>
        )}
      </div>
    </>
  );
}

function NewPasswordForm() {
  const { endRecovery } = useAuditSession();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(authMessage(error.message));
    else endRecovery();
  }
  return (
    <>
      <p className="gate-sub">Crie a sua nova senha</p>
      <form className="gate-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="gate-new-password">Nova senha</label>
          <div className="gate-input">
            <Lock aria-hidden="true" />
            <input
              id="gate-new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>
        {error && (
          <p className="gate-error" role="alert">
            {error}
          </p>
        )}
        <Button
          variant="approved"
          size="approved"
          className="btn-primary gate-submit"
          type="submit"
          disabled={busy}
        >
          Salvar nova senha
        </Button>
      </form>
    </>
  );
}

export function AuditGate({ children }: { children: ReactNode }) {
  const { user, pending, recovery, signOut } = useAuditSession();
  const { data, loading, error } = useAuditData();
  const client = useQueryClient();
  if (pending)
    return (
      <GateShell>
        <p className="gate-sub">Verificando acesso…</p>
      </GateShell>
    );
  if (user && recovery)
    return (
      <GateShell>
        <NewPasswordForm />
      </GateShell>
    );
  if (!user)
    return (
      <GateShell>
        <LoginForm />
      </GateShell>
    );
  if (loading)
    return (
      <GateShell>
        <p className="gate-sub">Carregando permissões…</p>
      </GateShell>
    );
  if (error || !data.roles.length)
    return (
      <GateShell>
        <div className="gate-pending">
          <ShieldAlert aria-hidden="true" />
          <div>
            <b>
              {error ? "Não foi possível verificar o seu acesso" : "Acesso aguardando liberação"}
            </b>
            <p>
              {error
                ? error
                : `O e-mail ${user.email} ainda não foi liberado. Peça a um administrador para autorizar o seu acesso em Configurações › Usuários.`}
            </p>
          </div>
        </div>
        <div className="gate-oauth">
          <Button variant="outline" type="button" onClick={() => void client.invalidateQueries()}>
            Verificar novamente
          </Button>
          <Button variant="outline" type="button" onClick={() => void signOut()}>
            <LogOut />
            Sair
          </Button>
        </div>
      </GateShell>
    );
  return <>{children}</>;
}

export function UserMenu() {
  const { user, signOut } = useAuditSession();
  const { data } = useAuditData();
  if (!user) return null;
  const role = roleNames[data.roles[0] ?? ""] ?? "";
  const initials = (user.email ?? "?").slice(0, 2).toUpperCase();
  return (
    <div className="user-menu">
      <span className="user-avatar" aria-hidden="true">
        {initials}
      </span>
      <span className="user-info">
        <b>{user.email}</b>
        {role && <small>{role}</small>}
      </span>
      <Button
        variant="outline"
        type="button"
        title="Sair"
        aria-label="Sair"
        onClick={() => void signOut()}
      >
        <LogOut />
      </Button>
    </div>
  );
}
