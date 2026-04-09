
import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTools } from "@fortawesome/free-solid-svg-icons";
import { faUserCog } from "@fortawesome/free-solid-svg-icons";
import { faPhone } from "@fortawesome/free-solid-svg-icons";

import Footer from "../components/Footer";
import { useAuth } from "../contex/Authconfig";
import { isOwnerEmail } from "../utils/ownerAccess";
import { homeServices } from "../data/services";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const servicesSectionRef = useRef(null);
  const canAccessWorkerPage = isOwnerEmail(user?.email);

  const handleScrollToServices = () => {
    servicesSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo" onClick={() => navigate("/")}>
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
          <li className="nav-link" onClick={() => navigate("/contact")}>
            <FontAwesomeIcon icon={faPhone} className="nav-icon" />
            Contact
          </li>
        </ul>
        <div className="button-container">
          <button className="nav-btn" onClick={() => navigate("/dashboard1")}>
              User dashboard
            </button>

        <button
          className="nav-btn"
          onClick={() => navigate("/booking")}
        >
          Book Now
        </button>
        </div>
      </nav>


      <h1 className="heading">Our Home Services</h1>

      

      <div className="services-container" ref={servicesSectionRef}>
        {homeServices.map((service) => (
          <div className="service-card" key={service.id}>
            <img src={service.image} alt={service.title} />
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            

            <button className="nav-btn" onClick={() => navigate("/booking")}>
              Book Now
            </button>
          </div>
        ))}
      </div>

      <Footer />

    </div>

  );
};

export default Home;
