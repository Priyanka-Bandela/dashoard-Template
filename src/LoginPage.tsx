import { useState } from "react";

type LoginPageProps = {
  onSignIn?: () => void;
};

export default function LoginPage({ onSignIn }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSignIn?.();
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand">Dashboard</div>
        <h1>Sign in</h1>
        <p>Enter your email and password to access the dashboard.</p>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <label>
            Email
            <input
              type="email"
              value={email}
              autoComplete="username"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
            />
          </label>

          <button type="submit">Sign in</button>
        </form>
      </div>
    </div>
  );
}
