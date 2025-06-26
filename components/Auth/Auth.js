import React, { useState } from "react";
import SignIn from "./SignIn.js";
import SignUp from "./SignUp.js";

export default function Auth({ onSignIn }) {
  const [mode, setMode] = useState("signin");

  return (
    <div className="auth-container">
      {mode === "signin" ? (
        <>
          <SignIn onSignIn={onSignIn} />
          <p>Don't have an account? <button onClick={() => setMode("signup")}>Sign Up</button></p>
        </>
      ) : (
        <>
          <SignUp onSignIn={onSignIn} />
          <p>Already have an account? <button onClick={() => setMode("signin")}>Sign In</button></p>
        </>
      )}
    </div>
  );
}
