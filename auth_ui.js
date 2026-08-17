(function () {
  "use strict";

  const COPY = {
    en: {
      title: "Sign in to AIGoalie", intro: "Use Google or any email address.", google: "Continue with Google",
      divider: "or continue with email", email: "Email address", password: "Password", signIn: "Sign in with email",
      create: "Create account", useSignIn: "Already have an account? Sign in", useCreate: "New here? Create an account",
      forgot: "Forgot password?", close: "Close", creating: "Creating account…", signingIn: "Signing in…",
      resetSent: "Password reset email sent.", verifySent: "Verification email sent. Check your inbox, then verify your email before signing in.",
      existing: "An account already uses this email. Sign in instead, or use Google if that is how you registered.",
      invalid: "The email or password is incorrect.", weak: "Use a password with at least 8 characters.",
      generic: "We could not complete sign-in. Please try again.", emailRequired: "Enter your email address first."
    },
    ja: { title:"AIGoalieにログイン", intro:"Googleまたは任意のメールアドレスを使用できます。", google:"Googleで続行", divider:"またはメールで続行", email:"メールアドレス", password:"パスワード", signIn:"メールでログイン", create:"アカウントを作成", useSignIn:"アカウントをお持ちですか？ログイン", useCreate:"初めてですか？アカウントを作成", forgot:"パスワードを忘れた場合", close:"閉じる", creating:"アカウントを作成中…", signingIn:"ログイン中…", resetSent:"パスワード再設定メールを送信しました。", verifySent:"受信メールを確認し、メール認証後にログインしてください。", existing:"このメールのアカウントは既に存在します。ログインするか、Googleで登録した場合はGoogleを使用してください。", invalid:"メールアドレスまたはパスワードが正しくありません。", weak:"8文字以上のパスワードを使用してください。", generic:"ログインを完了できませんでした。もう一度お試しください。", emailRequired:"先にメールアドレスを入力してください。" },
    es: { title:"Inicia sesión en AIGoalie", intro:"Usa Google o cualquier correo electrónico.", google:"Continuar con Google", divider:"o continuar con correo", email:"Correo electrónico", password:"Contraseña", signIn:"Entrar con correo", create:"Crear cuenta", useSignIn:"¿Ya tienes cuenta? Inicia sesión", useCreate:"¿Eres nuevo? Crea una cuenta", forgot:"¿Olvidaste la contraseña?", close:"Cerrar", creating:"Creando cuenta…", signingIn:"Iniciando sesión…", resetSent:"Correo de restablecimiento enviado.", verifySent:"Revisa tu correo y verifica la dirección antes de iniciar sesión.", existing:"Ya existe una cuenta con este correo. Inicia sesión o usa Google si te registraste así.", invalid:"El correo o la contraseña no son correctos.", weak:"Usa una contraseña de al menos 8 caracteres.", generic:"No pudimos completar el inicio de sesión. Inténtalo de nuevo.", emailRequired:"Introduce primero tu correo electrónico." },
    de: { title:"Bei AIGoalie anmelden", intro:"Nutze Google oder eine beliebige E-Mail-Adresse.", google:"Mit Google fortfahren", divider:"oder mit E-Mail fortfahren", email:"E-Mail-Adresse", password:"Passwort", signIn:"Mit E-Mail anmelden", create:"Konto erstellen", useSignIn:"Schon registriert? Anmelden", useCreate:"Neu hier? Konto erstellen", forgot:"Passwort vergessen?", close:"Schließen", creating:"Konto wird erstellt…", signingIn:"Anmeldung läuft…", resetSent:"E-Mail zum Zurücksetzen wurde gesendet.", verifySent:"Prüfe dein Postfach und bestätige deine E-Mail vor der Anmeldung.", existing:"Für diese E-Mail besteht bereits ein Konto. Melde dich an oder nutze Google, falls du dich damit registriert hast.", invalid:"E-Mail oder Passwort ist falsch.", weak:"Verwende ein Passwort mit mindestens 8 Zeichen.", generic:"Die Anmeldung konnte nicht abgeschlossen werden. Bitte erneut versuchen.", emailRequired:"Gib zuerst deine E-Mail-Adresse ein." },
    fr: { title:"Se connecter à AIGoalie", intro:"Utilisez Google ou n’importe quelle adresse e-mail.", google:"Continuer avec Google", divider:"ou continuer par e-mail", email:"Adresse e-mail", password:"Mot de passe", signIn:"Se connecter par e-mail", create:"Créer un compte", useSignIn:"Déjà inscrit ? Se connecter", useCreate:"Nouveau ? Créer un compte", forgot:"Mot de passe oublié ?", close:"Fermer", creating:"Création du compte…", signingIn:"Connexion…", resetSent:"E-mail de réinitialisation envoyé.", verifySent:"Consultez votre boîte mail et confirmez votre adresse avant de vous connecter.", existing:"Un compte utilise déjà cet e-mail. Connectez-vous ou utilisez Google si vous vous êtes inscrit ainsi.", invalid:"L’e-mail ou le mot de passe est incorrect.", weak:"Utilisez un mot de passe d’au moins 8 caractères.", generic:"Connexion impossible. Veuillez réessayer.", emailRequired:"Saisissez d’abord votre adresse e-mail." },
    pt: { title:"Entrar na AIGoalie", intro:"Use o Google ou qualquer endereço de e-mail.", google:"Continuar com Google", divider:"ou continuar com e-mail", email:"Endereço de e-mail", password:"Palavra-passe", signIn:"Entrar com e-mail", create:"Criar conta", useSignIn:"Já tem conta? Entrar", useCreate:"É novo? Criar uma conta", forgot:"Esqueceu a palavra-passe?", close:"Fechar", creating:"A criar conta…", signingIn:"A entrar…", resetSent:"E-mail de recuperação enviado.", verifySent:"Consulte o seu e-mail e confirme o endereço antes de entrar.", existing:"Já existe uma conta com este e-mail. Entre ou use o Google se foi assim que se registou.", invalid:"O e-mail ou a palavra-passe estão incorretos.", weak:"Use uma palavra-passe com pelo menos 8 caracteres.", generic:"Não foi possível concluir o acesso. Tente novamente.", emailRequired:"Introduza primeiro o seu endereço de e-mail." }
  };

  const SPAM_HINT = {
    en: "If it is not there, check your spam or junk folder.",
    ja: "届いていない場合は、迷惑メールフォルダも確認してください。",
    es: "Si no aparece, revisa la carpeta de spam o correo no deseado.",
    de: "Falls sie nicht erscheint, prüfe auch deinen Spam- oder Junk-Ordner.",
    fr: "Si vous ne le trouvez pas, vérifiez le dossier spam ou courrier indésirable.",
    pt: "Se não aparecer, verifique também a pasta de spam ou lixo eletrónico."
  };

  let options = null;
  let mode = "signin";

  function locale() {
    const value = String((options && options.locale) || document.documentElement.lang || "en").toLowerCase().split("-")[0];
    return COPY[value] ? value : "en";
  }

  function copy() { return COPY[locale()]; }

  function verificationMessage() { return `${copy().verifySent} ${SPAM_HINT[locale()]}`; }

  function inject() {
    if (document.getElementById("aigoalieAuthDialog")) return;
    const style = document.createElement("style");
    style.textContent = `.aigoalie-auth{position:fixed;inset:0;z-index:30000;background:rgba(0,0,0,.72);display:grid;place-items:center;padding:18px}.aigoalie-auth[hidden]{display:none}.aigoalie-auth-card{width:min(100%,420px);position:relative;background:#0d1d14;color:#f4f6ef;border:1px solid #254331;border-radius:18px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.5)}.aigoalie-auth-close{position:absolute;right:12px;top:12px;width:34px;height:34px;border-radius:9px;border:1px solid #254331;background:#132a1c;color:#f4f6ef;font-size:20px;cursor:pointer}.aigoalie-auth h2{font-size:23px;line-height:1.2;margin:0 42px 6px 0}.aigoalie-auth-intro{color:#aeb8a9;font-size:14px;margin:0 0 18px}.aigoalie-auth button,.aigoalie-auth input{font:inherit}.aigoalie-auth-google,.aigoalie-auth-submit{width:100%;min-height:46px;border-radius:11px;font-weight:800;cursor:pointer}.aigoalie-auth-google{background:#f4f6ef;color:#102018;border:0}.aigoalie-auth-submit{background:#4ee879;color:#06120c;border:0;margin-top:4px}.aigoalie-auth-divider{display:flex;align-items:center;gap:10px;color:#778578;font-size:12px;margin:16px 0}.aigoalie-auth-divider:before,.aigoalie-auth-divider:after{content:"";height:1px;background:#254331;flex:1}.aigoalie-auth-field{display:grid;gap:6px;margin:11px 0}.aigoalie-auth-field label{font-size:12px;font-weight:800;color:#aeb8a9}.aigoalie-auth-field input{width:100%;border:1px solid #254331;border-radius:10px;background:#132a1c;color:#f4f6ef;padding:11px 12px;outline:none}.aigoalie-auth-field input:focus{border-color:#71f08b;box-shadow:0 0 0 3px rgba(113,240,139,.12)}.aigoalie-auth-links{display:flex;justify-content:space-between;gap:12px;margin-top:12px;flex-wrap:wrap}.aigoalie-auth-link{border:0;background:transparent;color:#71f08b;padding:0;cursor:pointer;font-size:12px}.aigoalie-auth-status{min-height:20px;margin:12px 0 0;color:#ffd35e;font-size:13px}.aigoalie-auth-status.error{color:#ef6f6c}.aigoalie-auth button:disabled{opacity:.58;cursor:wait}@media(max-width:480px){.aigoalie-auth{padding:10px;align-items:end}.aigoalie-auth-card{border-radius:18px 18px 8px 8px;padding:20px 17px 24px}}`;
    document.head.appendChild(style);
    const dialog = document.createElement("div");
    dialog.id = "aigoalieAuthDialog";
    dialog.className = "aigoalie-auth";
    dialog.hidden = true;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.innerHTML = `<div class="aigoalie-auth-card"><button type="button" class="aigoalie-auth-close" data-auth-close></button><h2 data-auth-title></h2><p class="aigoalie-auth-intro" data-auth-intro></p><button type="button" class="aigoalie-auth-google" data-auth-google></button><div class="aigoalie-auth-divider" data-auth-divider></div><form data-auth-form novalidate><div class="aigoalie-auth-field"><label for="aigoalieAuthEmail" data-auth-email-label></label><input id="aigoalieAuthEmail" name="email" type="email" autocomplete="email" required></div><div class="aigoalie-auth-field"><label for="aigoalieAuthPassword" data-auth-password-label></label><input id="aigoalieAuthPassword" name="password" type="password" autocomplete="current-password" minlength="8" required></div><button type="submit" class="aigoalie-auth-submit" data-auth-submit></button></form><div class="aigoalie-auth-links"><button type="button" class="aigoalie-auth-link" data-auth-mode></button><button type="button" class="aigoalie-auth-link" data-auth-reset></button></div><p class="aigoalie-auth-status" data-auth-status aria-live="polite"></p></div>`;
    document.body.appendChild(dialog);
    dialog.addEventListener("click", event => { if (event.target === dialog || event.target.closest("[data-auth-close]")) close(); });
    dialog.querySelector("[data-auth-mode]").addEventListener("click", () => { mode = mode === "signin" ? "create" : "signin"; render(); });
    dialog.querySelector("[data-auth-google]").addEventListener("click", google);
    dialog.querySelector("[data-auth-reset]").addEventListener("click", resetPassword);
    dialog.querySelector("[data-auth-form]").addEventListener("submit", emailSubmit);
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !dialog.hidden) close(); });
  }

  function render() {
    const c = copy();
    const dialog = document.getElementById("aigoalieAuthDialog");
    if (!dialog) return;
    dialog.querySelector("[data-auth-close]").textContent = "×";
    dialog.querySelector("[data-auth-close]").setAttribute("aria-label", c.close);
    dialog.querySelector("[data-auth-title]").textContent = c.title;
    dialog.querySelector("[data-auth-intro]").textContent = c.intro;
    dialog.querySelector("[data-auth-google]").textContent = c.google;
    dialog.querySelector("[data-auth-divider]").textContent = c.divider;
    dialog.querySelector("[data-auth-email-label]").textContent = c.email;
    dialog.querySelector("[data-auth-password-label]").textContent = c.password;
    dialog.querySelector("[data-auth-submit]").textContent = mode === "create" ? c.create : c.signIn;
    dialog.querySelector("[data-auth-mode]").textContent = mode === "create" ? c.useSignIn : c.useCreate;
    dialog.querySelector("[data-auth-reset]").textContent = c.forgot;
    dialog.querySelector("[data-auth-reset]").hidden = mode === "create";
    dialog.querySelector("[data-auth-password-label]").nextElementSibling.autocomplete = mode === "create" ? "new-password" : "current-password";
  }

  function status(message, isError) {
    const element = document.querySelector("[data-auth-status]");
    if (!element) return;
    element.textContent = message || "";
    element.classList.toggle("error", !!isError);
  }

  function errorMessage(error) {
    const code = String(error && error.code || "");
    const c = copy();
    if (code.includes("email-already-in-use") || code.includes("account-exists-with-different-credential")) return c.existing;
    if (code.includes("wrong-password") || code.includes("invalid-credential") || code.includes("user-not-found") || code.includes("invalid-email")) return c.invalid;
    if (code.includes("weak-password")) return c.weak;
    return c.generic;
  }

  function busy(value, label) {
    document.querySelectorAll(".aigoalie-auth-google,.aigoalie-auth-submit,.aigoalie-auth-link").forEach(button => { button.disabled = value; });
    if (label) document.querySelector("[data-auth-submit]").textContent = label;
    if (!value) render();
  }

  async function google() {
    if (!options || !options.auth || !options.googleSignIn) return;
    status(""); busy(true, copy().signingIn);
    try {
      if (options.track) options.track("sign_in_method", { method: "google", source: options.source || "auth_dialog" });
      await options.googleSignIn(options.auth);
      close();
    } catch (error) { status(errorMessage(error), true); }
    finally { busy(false); }
  }

  async function emailSubmit(event) {
    event.preventDefault();
    if (!options || !options.auth) return;
    const form = event.currentTarget;
    const email = form.email.value.trim();
    const password = form.password.value;
    status(""); busy(true, mode === "create" ? copy().creating : copy().signingIn);
    try {
      if (mode === "create") {
        const credential = await options.auth.createUserWithEmailAndPassword(email, password);
        await credential.user.sendEmailVerification();
        if (options.track) options.track("account_created", { method: "email", source: options.source || "auth_dialog" });
        await options.auth.signOut();
        status(verificationMessage(), false);
      } else {
        const credential = await options.auth.signInWithEmailAndPassword(email, password);
        if (!credential.user.emailVerified) {
          try { await credential.user.sendEmailVerification(); } catch (_) {}
          await options.auth.signOut();
          status(verificationMessage(), false);
        } else {
          if (options.track) options.track("sign_in_method", { method: "email", source: options.source || "auth_dialog" });
          close();
        }
      }
    } catch (error) { status(errorMessage(error), true); }
    finally { busy(false); }
  }

  async function resetPassword() {
    if (!options || !options.auth) return;
    const input = document.getElementById("aigoalieAuthEmail");
    const email = input ? input.value.trim() : "";
    if (!email) { status(copy().emailRequired, true); input && input.focus(); return; }
    status(""); busy(true);
    try { await options.auth.sendPasswordResetEmail(email); status(copy().resetSent, false); }
    catch (error) { status(errorMessage(error), true); }
    finally { busy(false); }
  }

  function open(config) {
    inject();
    if (config && config.mode) mode = config.mode;
    render(); status("");
    const dialog = document.getElementById("aigoalieAuthDialog");
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("accountDropdown")?.classList.remove("show");
    setTimeout(() => document.getElementById("aigoalieAuthEmail")?.focus(), 0);
  }

  function close() {
    const dialog = document.getElementById("aigoalieAuthDialog");
    if (dialog) dialog.hidden = true;
    document.body.style.overflow = "";
  }

  function init(config) {
    options = config || {};
    inject(); render();
    try { options.auth && options.auth.useDeviceLanguage(); } catch (_) {}
    return api;
  }

  function isVerified(user) {
    if (!user) return false;
    if (user.emailVerified) return true;
    return (user.providerData || []).some(provider => provider && provider.providerId !== "password");
  }

  const api = { init, open, close, isVerified };
  window.AIGoalieAuthUI = api;

  document.addEventListener("click", event => {
    const trigger = event.target.closest("#dd_signin,#signInBtn,[data-auth-open]");
    if (!trigger) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (options && options.track) options.track("sign_in_click", { source: options.source || "account_menu" });
    open({ mode: "signin" });
  }, true);

  function autoInit() {
    if (options || !window.firebase || !firebase.auth) return;
    let auth;
    try { auth = firebase.auth(); } catch (_) { return; }
    init({
      auth,
      source: "site_account_menu",
      googleSignIn: async currentAuth => {
        const provider = new firebase.auth.GoogleAuthProvider();
        const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "") ||
          (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
        if (mobile) return currentAuth.signInWithRedirect(provider);
        try { return await currentAuth.signInWithPopup(provider); }
        catch (error) {
          if (/popup|redirect|operation-not-supported/i.test(String(error && (error.code || error.message) || ""))) return currentAuth.signInWithRedirect(provider);
          throw error;
        }
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoInit);
  else autoInit();
})();
