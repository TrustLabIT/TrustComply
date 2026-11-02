import React, { useEffect, useState } from "react";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { useAuth } from "../context/AuthContext";
import { getLoginBrandingApi } from "../api/loginBranding";

// Two-panel glassmorphism login — ported from the TAMS design, re-branded for
// TrustComply and wired to the JWT auth (with first-account signup).
const CSS = `
.tc-login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f766e 0%,#0d9488 25%,#14b8a6 50%,#a7f3d0 75%,#f0fdf4 100%);position:relative;overflow:hidden;font-family:'Segoe UI',system-ui,-apple-system,sans-serif}
.tc-login-wrap::before{content:'';position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(240,199,94,.15) 0%,transparent 70%);top:-150px;right:-150px;border-radius:50%;animation:tc-float 8s ease-in-out infinite}
.tc-login-wrap::after{content:'';position:absolute;width:500px;height:500px;background:radial-gradient(circle,rgba(13,148,136,.12) 0%,transparent 70%);bottom:-100px;left:-100px;border-radius:50%;animation:tc-float 10s ease-in-out infinite reverse}
@keyframes tc-float{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-30px) scale(1.05)}}
.tc-particle{position:absolute;border-radius:50%;opacity:.3;animation:tc-drift linear infinite}
.tc-particle:nth-child(1){width:6px;height:6px;background:#f0c75e;top:20%;left:15%;animation-duration:12s}
.tc-particle:nth-child(2){width:4px;height:4px;background:#fff;top:60%;left:80%;animation-duration:15s;animation-delay:-3s}
.tc-particle:nth-child(3){width:8px;height:8px;background:#14b8a6;top:80%;left:25%;animation-duration:18s;animation-delay:-6s}
.tc-particle:nth-child(4){width:5px;height:5px;background:#f0c75e;top:10%;left:70%;animation-duration:14s;animation-delay:-2s}
.tc-particle:nth-child(5){width:3px;height:3px;background:#fff;top:45%;left:50%;animation-duration:16s;animation-delay:-8s}
.tc-particle:nth-child(6){width:7px;height:7px;background:#0d9488;top:70%;left:60%;animation-duration:20s;animation-delay:-4s}
@keyframes tc-drift{0%{transform:translateY(0) rotate(0deg);opacity:0}10%{opacity:.4}90%{opacity:.4}100%{transform:translateY(-100vh) rotate(720deg);opacity:0}}
.tc-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:60px 60px;z-index:0}
.tc-login-container{display:flex;width:920px;max-width:95vw;min-height:540px;position:relative;z-index:2;box-shadow:0 25px 60px rgba(0,0,0,.15);border-radius:20px}
.tc-login-left{flex:1;background:linear-gradient(160deg,#0f766e 0%,#0d9488 40%,#115e59 100%);border-radius:20px 0 0 20px;padding:50px 40px;display:flex;flex-direction:column;justify-content:center;align-items:center;position:relative;overflow:hidden}
.tc-login-left::before{content:'';position:absolute;width:300px;height:300px;background:radial-gradient(circle,rgba(240,199,94,.12) 0%,transparent 70%);top:-50px;right:-50px;border-radius:50%}
.tc-login-left::after{content:'';position:absolute;width:200px;height:200px;background:radial-gradient(circle,rgba(20,184,166,.15) 0%,transparent 70%);bottom:-30px;left:-30px;border-radius:50%}
.tc-left-content{position:relative;z-index:2;text-align:center;color:#fff}
.tc-main-logo{max-width:320px;width:85%;height:auto;margin-bottom:24px;filter:drop-shadow(0 4px 15px rgba(0,0,0,.2))}
.tc-app-title{font-size:26px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#fff;margin:0 0 6px;text-shadow:0 2px 10px rgba(0,0,0,.25)}
.tc-app-subtitle{font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#f0c75e}
.tc-pulse-dots{display:flex;gap:6px;margin-top:28px;justify-content:center}
.tc-pulse-dots span{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.25);animation:tc-dot-pulse 2s ease-in-out infinite}
.tc-pulse-dots span:nth-child(1){animation-delay:0s;background:#f0c75e}
.tc-pulse-dots span:nth-child(2){animation-delay:.3s}
.tc-pulse-dots span:nth-child(3){animation-delay:.6s}
.tc-pulse-dots span:nth-child(4){animation-delay:.9s}
@keyframes tc-dot-pulse{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.5);opacity:1}}
.tc-login-right{flex:1;background:rgba(255,255,255,.88);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:0 20px 20px 0;padding:48px 42px;display:flex;flex-direction:column;justify-content:center;border:1px solid rgba(255,255,255,.5);border-left:none;position:relative}
.tc-login-right::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#0d9488,#14b8a6,#f0c75e,#fbbf24);border-radius:0 20px 0 0}
.tc-secure-badge{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);color:#0d9488;font-size:11px;font-weight:700;padding:5px 14px;border-radius:20px;border:1px solid #a7f3d0;margin-bottom:22px;letter-spacing:1px;width:fit-content}
.tc-secure-badge svg{font-size:14px}
.tc-form-title{font-size:28px;font-weight:800;color:#1a1a1a;margin-bottom:4px}
.tc-form-title span{color:#0d9488}
.tc-form-subtitle{font-size:13px;color:#6b7280;margin-bottom:28px}
.tc-input-group{margin-bottom:18px}
.tc-input-label{font-size:12px;font-weight:600;color:#374151;margin-bottom:6px;display:block;letter-spacing:.5px}
.tc-input-wrap{position:relative}
.tc-input-wrap .tc-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:19px;transition:color .2s;z-index:2;pointer-events:none}
.tc-input-wrap input{width:100%;padding:12px 42px 12px 42px;border:2px solid #e5e7eb;border-radius:12px;font-size:14px;background:rgba(255,255,255,.8);transition:all .3s ease;outline:none;color:#1f2937;font-family:inherit}
.tc-input-wrap input:focus{border-color:#0d9488;box-shadow:0 0 0 4px rgba(13,148,136,.1);background:#fff}
.tc-input-wrap input:focus~.tc-icon{color:#0d9488}
.tc-eye-toggle{position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;color:#9ca3af;font-size:19px;z-index:2;transition:color .2s}
.tc-eye-toggle:hover{color:#0d9488}
.tc-error{color:#ef4444;font-size:12.5px;margin-bottom:14px;display:block}
.tc-btn-row{display:flex;gap:10px;margin-top:6px;margin-bottom:16px}
.tc-btn-signin{flex:2;padding:13px 0;border:none;border-radius:12px;background:linear-gradient(135deg,#0d9488 0%,#14b8a6 50%,#f0c75e 100%);background-size:200% 100%;color:#fff;font-size:15px;font-weight:700;letter-spacing:.5px;cursor:pointer;transition:all .4s ease;font-family:inherit}
.tc-btn-signin:hover{background-position:right center;box-shadow:0 8px 25px rgba(13,148,136,.3);transform:translateY(-1px)}
.tc-btn-signin:disabled{opacity:.7;cursor:default;transform:none}
.tc-btn-clear{flex:1;padding:13px 0;border:2px solid #e5e7eb;border-radius:12px;background:transparent;color:#6b7280;font-size:14px;font-weight:600;cursor:pointer;transition:all .3s ease;font-family:inherit}
.tc-btn-clear:hover{border-color:#d1d5db;background:#f9fafb;color:#374151}
.tc-toggle-link{text-align:center}
.tc-toggle-link button{background:none;border:none;color:#0d9488;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
.tc-toggle-link button:hover{color:#f0c75e}
.tc-footer-text{text-align:center;margin-top:22px;font-size:11px;color:#9ca3af;display:flex;align-items:center;justify-content:center;gap:6px}
.tc-footer-text svg{color:#0d9488;font-size:12px}
@media(max-width:768px){
  .tc-login-wrap{align-items:flex-start;padding:24px 16px;overflow:hidden;overflow-x:hidden;width:100%;box-sizing:border-box}
  .tc-login-wrap::before{width:360px;height:360px;top:-120px;right:-120px}
  .tc-login-wrap::after{width:300px;height:300px;bottom:-80px;left:-80px}
  .tc-login-container{flex-direction:column;width:92vw;max-width:100%;min-height:auto;margin:auto 0}
  .tc-login-left{border-radius:20px 20px 0 0;padding:32px 22px}
  .tc-main-logo{max-width:180px;margin-bottom:18px}
  .tc-app-title{font-size:22px;letter-spacing:1px;overflow-wrap:anywhere}
  .tc-app-subtitle{letter-spacing:2px;overflow-wrap:anywhere}
  .tc-pulse-dots{margin-top:20px}
  .tc-login-right{border-radius:0 0 20px 20px;padding:28px 22px;border-left:1px solid rgba(255,255,255,.5)}
  .tc-login-right::before{border-radius:0}
  .tc-form-title{font-size:24px}
  .tc-form-subtitle{margin-bottom:22px}
  .tc-input-wrap input{font-size:16px}
}
@media(max-width:480px){
  .tc-main-logo{max-width:150px}
  .tc-login-left{padding:26px 18px}
  .tc-login-right{padding:24px 18px}
}
@media(max-width:380px){
  .tc-btn-row{flex-direction:column}
  .tc-btn-signin,.tc-btn-clear{flex:none;width:100%}
}
`;

// Shown until /login-branding answers (and kept if it can't be reached).
const DEFAULT_BRANDING = { title: "TRUSTCOMPLY", department: "" };

export default function Login() {
  const { login, register } = useAuth();
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isSignup = mode === "signup";

  // Title and department are editable in Settings › Login Page. The read is
  // public; on any failure the defaults simply stay on screen.
  useEffect(() => {
    let active = true;
    getLoginBrandingApi()
      .then((b) => {
        if (!active || !b || typeof b.title !== "string" || !b.title.trim()) return;
        setBranding({ title: b.title, department: typeof b.department === "string" ? b.department : "" });
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isSignup) await register(form);
      else await login(form.email, form.password);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tc-login-wrap">
      <style>{CSS}</style>
      <div className="tc-grid" />
      {[0, 1, 2, 3, 4, 5].map((i) => <div className="tc-particle" key={i} />)}

      <div className="tc-login-container">
        {/* Left panel */}
        <div className="tc-login-left">
          <div className="tc-left-content">
            <img src={process.env.PUBLIC_URL + "/SHLlogo.png"} alt="TrustLab Diagnostics" className="tc-main-logo" />
            <div className="tc-app-title">{branding.title}</div>
            {branding.department.trim() && <div className="tc-app-subtitle">{branding.department}</div>}
            <div className="tc-pulse-dots"><span /><span /><span /><span /></div>
          </div>
        </div>

        {/* Right panel */}
        <div className="tc-login-right">
          <div className="tc-secure-badge"><ShieldOutlinedIcon /> SECURE</div>
          <div className="tc-form-title">
            {isSignup ? <>Create <span>Account</span></> : <>Sign <span>In</span></>}
          </div>
          <div className="tc-form-subtitle">
            {isSignup ? "Set up the first administrator account to get started." : "Welcome back. Enter your credentials to continue."}
          </div>

          <form onSubmit={submit}>
            {isSignup && (
              <div className="tc-input-group">
                <label className="tc-input-label">Full name</label>
                <div className="tc-input-wrap">
                  <input type="text" placeholder="Enter your name" value={form.name} onChange={set("name")} required />
                  <PersonOutlineIcon className="tc-icon" />
                </div>
              </div>
            )}

            <div className="tc-input-group">
              <label className="tc-input-label">Email</label>
              <div className="tc-input-wrap">
                <input type="email" placeholder="Enter your email" value={form.email} onChange={set("email")} autoComplete="email" required />
                <MailOutlineIcon className="tc-icon" />
              </div>
            </div>

            <div className="tc-input-group">
              <label className="tc-input-label">Password</label>
              <div className="tc-input-wrap">
                <input type={showPw ? "text" : "password"} placeholder="Enter your password" value={form.password} onChange={set("password")} autoComplete={isSignup ? "new-password" : "current-password"} required />
                <LockOutlinedIcon className="tc-icon" />
                {showPw
                  ? <VisibilityOffIcon className="tc-eye-toggle" onClick={() => setShowPw(false)} />
                  : <VisibilityIcon className="tc-eye-toggle" onClick={() => setShowPw(true)} />}
              </div>
            </div>

            {error && <span className="tc-error">{error}</span>}

            <div className="tc-btn-row">
              <button type="submit" className="tc-btn-signin" disabled={busy}>
                {busy ? "Please wait…" : isSignup ? "Create account" : "Sign In"}
              </button>
              <button type="button" className="tc-btn-clear" onClick={() => setForm({ name: "", email: "", password: "" })}>Clear</button>
            </div>

            <div className="tc-toggle-link">
              <button type="button" onClick={() => { setMode(isSignup ? "login" : "signup"); setError(""); }}>
                {isSignup ? "Already have an account? Sign in" : "First time here? Create the first account"}
              </button>
            </div>
          </form>

          <div className="tc-footer-text">
            <LockOutlinedIcon /> 256-bit SSL encrypted · Authorized access only
          </div>
        </div>
      </div>
    </div>
  );
}
