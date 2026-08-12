import { useState } from "react";
import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";

export default function App() {
  const [signedIn, setSignedIn] = useState(false);

  return (
    <div className="app-shell">
      {signedIn ? (
        // <DashboardPage />
        <Dashboard />
      ) : (
        <LoginPage onSignIn={() => setSignedIn(true)} />
      )}
    </div>
  );
}
