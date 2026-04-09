import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faEnvelope,
  faLocationDot,
  faPhone,
  faTools,
  faUserCog
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../contex/Authconfig";
import { isOwnerEmail } from "../utils/ownerAccess";

const contactCards = [
  {
    id: "phone",
    icon: faPhone,
    title: "Call Support",
    value: "+91 98765 43210",
    note: "Reach our team for urgent service or booking help."
  },
  {
    id: "email",
    icon: faEnvelope,
    title: "Email Us",
    value: "support@gkhomeservices.com",
    note: "Share your request details and we will get back quickly."
  },
  {
    id: "location",
    icon: faLocationDot,
    title: "Visit Office",
    value: "Madhapur, Hyderabad",
    note: "Meet our service desk for schedules, billing, and support."
  },
  {
    id: "hours",
    icon: faClock,
    title: "Working Hours",
    value: "08:00 AM - 09:00 PM",
    note: "Available every day for booking and worker coordination."
  }
];

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  message: ""
};

const Contact = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const canAccessWorkerPage = isOwnerEmail(user?.email);
  const handleScrollToServices = () => {
    navigate("/home");
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSubmitted(true);
    setFormData(initialFormState);
  };

  return (
    <div className="contact-page">
      <div className="contact-page__glow contact-page__glow--one" />
      <div className="contact-page__glow contact-page__glow--two" />

      <nav className="navbar contact-navbar">
        <div className="logo" onClick={() => navigate("/home")}>
          🏠 G&K Home services
        </div>

        <ul className="nav-links">
          <li className="nav-link" onClick={handleScrollToServices}>
            <FontAwesomeIcon icon={faTools} className="nav-icon" />
            Services
          </li>
          
          {canAccessWorkerPage && (
            <li className="nav-link" onClick={() => navigate("/workerpage")}>
              <FontAwesomeIcon icon={faUserCog} className="nav-icon" />
              Workers
            </li>
          )}
          <li className="nav-link contact-nav-link--active">
            <FontAwesomeIcon icon={faPhone} className="nav-icon" />
            Contact
          </li>
        </ul>

        <div className="button-container">
          <button className="nav-btn" onClick={() => navigate("/dashboard1")}>
            User dashboard
          </button>
          <button className="nav-btn" onClick={() => navigate("/booking")}>
            Book Now
          </button>
        </div>
      </nav>

      <section className="contact-hero">
        <p className="contact-eyebrow">Contact Page</p>
        <h1>Stay connected with the home service team.</h1>
        <p className="contact-hero__text">
          Reach us for support, service updates, worker coordination, or booking help.
          Everything here follows the same visual style as your home page.
        </p>
      </section>

      <section className="contact-layout">
        <div className="contact-info-panel">
          <div className="contact-section-head">
            <p className="contact-eyebrow">Get In Touch</p>
            <h2>Contact Details</h2>
          </div>

          <div className="contact-card-grid">
            {contactCards.map((card) => (
              <article className="contact-card" key={card.id}>
                <div className="contact-card__icon">
                  <FontAwesomeIcon icon={card.icon} />
                </div>
                <div className="contact-card__content">
                  <span>{card.title}</span>
                  <strong>{card.value}</strong>
                  <p>{card.note}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="contact-form-panel">
          <div className="contact-section-head">
            <p className="contact-eyebrow">Quick Message</p>
            <h2>Send Your Request</h2>
            <span>Leave a message and our team will respond as soon as possible.</span>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <label className="contact-field">
              <span>Name</span>
              <input
                className="contact-input"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(event) => handleChange("name", event.target.value)}
              />
            </label>

            <label className="contact-field">
              <span>Email</span>
              <input
                className="contact-input"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(event) => handleChange("email", event.target.value)}
              />
            </label>

            <label className="contact-field">
              <span>Phone</span>
              <input
                className="contact-input"
                type="text"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
              />
            </label>

            <label className="contact-field contact-field--full">
              <span>Message</span>
              <textarea
                className="contact-input contact-input--textarea"
                placeholder="Write your service request or support message"
                value={formData.message}
                onChange={(event) => handleChange("message", event.target.value)}
              />
            </label>

            {isSubmitted && (
              <p className="contact-feedback">
                Your message is ready. Our team will contact you soon.
              </p>
            )}

            <div className="contact-actions">
              <button
                type="button"
                className="contact-button contact-button--ghost"
                onClick={() => navigate("/home")}
              >
                Back Home
              </button>
              <button type="submit" className="contact-button contact-button--primary">
                Send Message
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Contact;
