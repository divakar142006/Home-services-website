import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faLocationDot,
  faPhone,
  faUser
} from "@fortawesome/free-solid-svg-icons";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../Firebase/Firebaseconfer";
import { useAuth } from "../contex/Authconfig";
import { bookingServiceMeta, homeServices } from "../data/services";

const initialFormData = {
  name: "",
  phone: "",
  service: "",
  address: "",
  date: ""
};

const isFormEmpty = (values) =>
  Object.values(values).every((value) => String(value).trim() === "");

function Bookingform() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const isMountedRef = useRef(true);
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackTone, setFeedbackTone] = useState("success");
  const minimumDate = new Date().toISOString().split("T")[0];

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleBooking = async (event) => {
    event.preventDefault();

    if (!formData.name || !formData.phone || !formData.service || !formData.address || !formData.date) {
      setFeedbackTone("error");
      setFeedbackMessage("Please fill all fields before placing the booking.");
      return;
    }

    if (!authUser) {
      setFeedbackTone("error");
      setFeedbackMessage("Please sign in before booking a service.");
      return;
    }

    const pendingFormData = { ...formData };
    const bookingService = bookingServiceMeta[pendingFormData.service] || {
      amount: 600,
      priority: "Medium"
    };
    const createdAtMillis = Date.now();

    try {
      setIsSubmitting(true);
      setFeedbackTone("success");
      setFeedbackMessage("Saving your booking...");

      await addDoc(collection(db, "bookings"), {
        userId: authUser.uid,
        userEmail: authUser.email || "",
        customerName: pendingFormData.name,
        name: pendingFormData.name,
        phone: pendingFormData.phone,
        service: pendingFormData.service,
        address: pendingFormData.address,
        date: pendingFormData.date,
        bookingDate: pendingFormData.date,
        amount: bookingService.amount,
        priority: bookingService.priority,
        worker: "Waiting Assignment",
        slot: "To Be Assigned",
        status: "Pending",
        createdAt: serverTimestamp(),
        createdAtMillis
      });

      if (!isMountedRef.current) return;

      setFormData(initialFormData);
      setFeedbackTone("success");
      setFeedbackMessage("Your booking was added successfully.");
    } catch (error) {
      console.error(error);

      if (!isMountedRef.current) return;

      setFormData((currentValues) =>
        isFormEmpty(currentValues) ? {
          ...pendingFormData
        } : currentValues
      );
      setFeedbackTone("error");
      setFeedbackMessage("Failed to book service. Please try again.");
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="booking-page">
      <div className="booking-page__glow booking-page__glow--one" />
      <div className="booking-page__glow booking-page__glow--two" />

      <div className="booking-layout booking-layout--compact">
        <section className="booking-panel">
          <div className="booking-panel__header">
            <div>
              <p className="booking-eyebrow">Booking Form</p>
              <h2>Book A Service</h2>
              <span>Fill your details once and confirm the visit.</span>
            </div>

            <button
              type="button"
              className="booking-button booking-button--ghost"
              onClick={() => navigate("/home")}
            >
              Back Home
            </button>
          </div>

          <form className="booking-form" onSubmit={handleBooking}>
            <div className="booking-form__grid">
              <label className="booking-field">
                <span>
                  <FontAwesomeIcon icon={faUser} />
                  Name
                </span>
                <input
                  className="booking-input"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                />
              </label>

              <label className="booking-field">
                <span>
                  <FontAwesomeIcon icon={faPhone} />
                  Phone Number
                </span>
                <input
                  className="booking-input"
                  type="text"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(event) => handleFieldChange("phone", event.target.value)}
                />
              </label>

              <label className="booking-field">
                <span>Service</span>
                <select
                  className="booking-input"
                  value={formData.service}
                  onChange={(event) => handleFieldChange("service", event.target.value)}
                >
                  <option value="">Choose Service</option>
                  {homeServices.map((service) => (
                    <option key={service.id} value={service.title}>
                      {service.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="booking-field">
                <span>
                  <FontAwesomeIcon icon={faCalendarCheck} />
                  Booking Date
                </span>
                <input
                  className="booking-input"
                  type="date"
                  min={minimumDate}
                  value={formData.date}
                  onChange={(event) => handleFieldChange("date", event.target.value)}
                />
              </label>

              <label className="booking-field booking-field--full">
                <span>
                  <FontAwesomeIcon icon={faLocationDot} />
                  Address
                </span>
                <textarea
                  className="booking-input booking-input--textarea"
                  placeholder="Enter your full address"
                  value={formData.address}
                  onChange={(event) => handleFieldChange("address", event.target.value)}
                />
              </label>
            </div>

            {feedbackMessage && (
              <p className={`booking-feedback booking-feedback--${feedbackTone}`}>
                {feedbackMessage}
              </p>
            )}

            <div className="booking-form__actions">
              <button
                type="button"
                className="booking-button booking-button--ghost"
                onClick={() => navigate("/dashboard")}
              >
                Go To Dashboard
              </button>

              <button
                type="submit"
                className="booking-button booking-button--primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Bookingform;








