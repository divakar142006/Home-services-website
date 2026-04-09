import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../Firebase/Firebaseconfer";

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignin = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful");
      navigate("/home");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="auth-page auth-page--signin">
      <div className="auth-page__glow auth-page__glow--one" />
      <div className="auth-page__glow auth-page__glow--two" />

      <div className="auth-layout auth-layout--compact">
        <section className="auth-form-panel auth-form-panel--solo">
          <div className="auth-form-header">
            <p className="auth-eyebrow">Sign In</p>
            <h2>Login To Continue</h2>
            <span>Use your email and password to access your account.</span>
          </div>

          <form className="auth-form" onSubmit={handleSignin}>
            <label className="auth-field">
              <span>Email Address</span>
              <input
                required
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <input
                required
                className="auth-input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <button className="auth-submit" type="submit">
              Sign In
            </button>
          </form>

          <div className="auth-divider">
            <span>New to G&K Home Services?</span>
          </div>

          <button
            type="button"
            className="auth-secondary"
            onClick={() => navigate("/signup")}
          >
            Create Account
          </button>

          <p className="auth-footer-note">
            Your bookings, saved profile, and activity stay synced after login.
          </p>
        </section>
      </div>
    </div>
  );
};

export default SignInPage;
