import React, { useState } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../Firebase/Firebaseconfer";

const SignupPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = async (event) => {
    event.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await signOut(auth);
      alert("Account created! Please log in.");
      navigate("/");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="auth-page auth-page--signup">
      <div className="auth-page__glow auth-page__glow--one" />
      <div className="auth-page__glow auth-page__glow--two" />

      <div className="auth-layout auth-layout--compact">
        <section className="auth-form-panel auth-form-panel--solo">
          <div className="auth-form-header">
            <p className="auth-eyebrow">Sign Up</p>
            <h2>Create Your Account</h2>
            <span>Set up your details and begin using G&K Home Services.</span>
          </div>

          <form className="auth-form" onSubmit={handleSignup}>
            <label className="auth-field">
              <span>Full Name</span>
              <input
                type="text"
                className="auth-input"
                placeholder="Your full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <label className="auth-field">
              <span>Email Address</span>
              <input
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                className="auth-input"
                placeholder="Create password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <label className="auth-field">
              <span>Confirm Password</span>
              <input
                type="password"
                className="auth-input"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </label>

            <button className="auth-submit" type="submit">
              Create Account
            </button>
          </form>

          <div className="auth-divider">
            <span>Already have an account?</span>
          </div>

          <button
            type="button"
            className="auth-secondary"
            onClick={() => navigate("/")}
          >
            Sign In Instead
          </button>

          <p className="auth-footer-note">
            After signup, you will return to sign in and enter your new account.
          </p>
        </section>
      </div>
    </div>
  );
};

export default SignupPage;
