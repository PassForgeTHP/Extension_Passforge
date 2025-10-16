import { useState } from 'react';

function LoginView({ onUnlock }) {
  const [masterPassword, setMasterPassword] = useState('');
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword]=useState(false)
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
try {
    const res = await fetch("http://localhost:3000/users/sign_in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: { email:email, password: masterPassword} })
    });
      if (!res.ok) {
      throw new Error("Login failed");
    }
    const data = await res.json()
    const token = res.headers.get("Authorization")?.split(" ")[1];
    onUnlock(data.user, token)
          onUnlock();
      setError('');
} catch (error) {
  setError(error.message)
}
   

  };

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="logo">PF</div>
        <h1>PassForge</h1>
        <p>Enter your master password to unlock</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <div className='login-extension'>
          <input
            type={showPassword? 'text': 'password'}
            placeholder="Master password"
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            autoFocus
          />
          <button
          type='button'
          onClick={()=>setShowPassword(!showPassword)}
          className='eye-button'
          aria-label="Display password"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="btn-unlock">
          Unlock
        </button>
      </form>
    </div>
  );
}

export default LoginView;
