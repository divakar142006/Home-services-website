import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faBroom,
  faCircleCheck,
  faClock,
  faHammer,
  faHouse,
  faLocationDot,
  faPhone,
  faPlus,
  faStar,
  faToolbox,
  faUsersGear,
  faWrench
} from "@fortawesome/free-solid-svg-icons";
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../Firebase/Firebaseconfer";

const workerTeams = [
  {
    id: 1,
    name: "Ajay Kumar",
    role: "Senior Plumber",
    city: "Hyderabad",
    rating: 4.9,
    completedJobs: 128,
    availability: "Available"
  },
  {
    id: 2,
    name: "Karthik Reddy",
    role: "Electrical Specialist",
    city: "Vijayawada",
    rating: 4.8,
    completedJobs: 96,
    availability: "On Duty"
  },
  {
    id: 3,
    name: "Sneha Team",
    role: "Deep Cleaning Crew",
    city: "Hyderabad",
    rating: 4.7,
    completedJobs: 84,
    availability: "Available"
  },
  {
    id: 4,
    name: "Ravi Woodworks",
    role: "Carpentry Lead",
    city: "Amalapuram",
    rating: 4.8,
    completedJobs: 73,
    availability: "Assigned"
  }
];

const shiftBoard = [
  {
    id: 1,
    title: "Morning Dispatch",
    time: "08:00 AM",
    detail: "Route planning and material checks for Hyderabad team."
  },
  {
    id: 2,
    title: "Midday Review",
    time: "01:00 PM",
    detail: "Confirm status updates, spare parts, and urgent booking escalations."
  },
  {
    id: 3,
    title: "Evening Closure",
    time: "07:00 PM",
    detail: "Collect completed-job notes and prepare next-day worker allocation."
  }
];

const serviceCatalog = {
  Plumber: {
    icon: faWrench,
    title: "Plumber",
    text: "Leak repairs, fittings, and urgent pipe work requests."
  },
  Plumbing: {
    icon: faWrench,
    title: "Plumbing",
    text: "Leak repairs, fittings, and urgent pipe work requests."
  },
  Electrician: {
    icon: faBolt,
    title: "Electrician",
    text: "Wiring, switchboard issues, and appliance support."
  },
  Cleaner: {
    icon: faBroom,
    title: "Cleaner",
    text: "Deep cleaning, move-in service, and recurring care."
  },
  Cleaning: {
    icon: faBroom,
    title: "Cleaning",
    text: "Deep cleaning, move-in service, and recurring care."
  },
  Carpenter: {
    icon: faHammer,
    title: "Carpenter",
    text: "Furniture repairs, fittings, and custom wood support."
  },
  Mechanic: {
    icon: faToolbox,
    title: "Mechanic",
    text: "Appliance fixes, machine support, and urgent repair visits."
  }
};

const getAssignmentTone = (status) => {
  if (status === "Completed") return "is-completed";
  if (status === "In Progress") return "is-progress";
  if (status === "Assigned") return "is-assigned";
  return "is-pending";
};

const WorkerOperationsPage = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [assignmentsError, setAssignmentsError] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "bookings"),
      (snapshot) => {
        const liveAssignments = snapshot.docs
          .map((bookingDoc) => {
            const bookingData = bookingDoc.data();

            return {
              id: bookingDoc.id,
              customerName: bookingData.customerName || bookingData.name || "Customer",
              phone: bookingData.phone || "Not added",
              service: bookingData.service || "General Service",
              address: bookingData.address || "Address not added",
              bookingDate: bookingData.bookingDate || bookingData.date || "Date pending",
              slot: bookingData.slot || "To Be Assigned",
              amount: bookingData.amount || 0,
              status: bookingData.status || "Pending",
              priority: bookingData.priority || "Medium",
              worker: bookingData.worker || "Waiting Assignment",
              createdAt:
                bookingData.createdAt?.toMillis?.() ||
                bookingData.createdAtMillis ||
                bookingData.updatedAt?.toMillis?.() ||
                0
            };
          })
          .sort((first, second) => second.createdAt - first.createdAt);

        setAssignments(liveAssignments);
        setAssignmentsError("");
        setIsLoadingAssignments(false);
      },
      (error) => {
        console.error(error);
        setAssignments([]);
        setAssignmentsError("Could not load bookings on the worker page. Check Firestore access rules for the owner account.");
        setIsLoadingAssignments(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const totalJobs = assignments.length;
  const activeJobs = assignments.filter(
    (assignment) => assignment.status === "Assigned" || assignment.status === "In Progress"
  ).length;
  const completedJobs = assignments.filter(
    (assignment) => assignment.status === "Completed"
  ).length;
  const urgentJobs = assignments.filter(
    (assignment) => assignment.priority === "High"
  ).length;

  const metricCards = [
    {
      id: "workers",
      icon: faUsersGear,
      label: "Worker Teams",
      value: workerTeams.length,
      note: "Active technicians and service crews"
    },
    {
      id: "active",
      icon: faToolbox,
      label: "Active Jobs",
      value: activeJobs,
      note: "Assignments currently on field"
    },
    {
      id: "completed",
      icon: faCircleCheck,
      label: "Completed",
      value: completedJobs,
      note: "Jobs closed successfully"
    },
    {
      id: "urgent",
      icon: faClock,
      label: "High Priority",
      value: urgentJobs,
      note: "Requests needing quick attention"
    }
  ];

  const serviceCards =
    assignments.length > 0
      ? Object.entries(
          assignments.reduce((summary, assignment) => {
            const serviceName = assignment.service || "General Service";
            summary[serviceName] = (summary[serviceName] || 0) + 1;
            return summary;
          }, {})
        ).map(([serviceName, count]) => {
          const serviceDetails = serviceCatalog[serviceName] || {
            icon: faToolbox,
            title: serviceName,
            text: "Live bookings arriving from the booking form."
          };

          return {
            id: serviceName,
            count,
            ...serviceDetails
          };
        })
      : [
          {
            id: "empty-plumber",
            count: 0,
            ...serviceCatalog.Plumber
          },
          {
            id: "empty-electrician",
            count: 0,
            ...serviceCatalog.Electrician
          },
          {
            id: "empty-cleaner",
            count: 0,
            ...serviceCatalog.Cleaner
          },
          {
            id: "empty-carpenter",
            count: 0,
            ...serviceCatalog.Carpenter
          }
        ];

  const handleAdvanceStatus = async (assignment) => {
    let nextStatus = assignment.status;
    let nextWorker = assignment.worker;

    if (assignment.status === "Pending") {
      nextStatus = "Assigned";
      nextWorker = "Dispatch Team";
    } else if (assignment.status === "Assigned") {
      nextStatus = "In Progress";
    } else if (assignment.status === "In Progress") {
      nextStatus = "Completed";
    }

    if (nextStatus === assignment.status && nextWorker === assignment.worker) {
      return;
    }

    try {
      await updateDoc(doc(db, "bookings", assignment.id), {
        status: nextStatus,
        worker: nextWorker,
        updatedAt: serverTimestamp(),
        completedAt: nextStatus === "Completed" ? serverTimestamp() : null
      });
    } catch (error) {
      console.error(error);
      alert("Failed to update worker status.");
    }
  };

  return (
    <div className="worker-ops-shell">
      <div className="worker-ops-shell__glow worker-ops-shell__glow--one" />
      <div className="worker-ops-shell__glow worker-ops-shell__glow--two" />

      <section className="worker-ops-hero">
        <div className="worker-ops-hero__copy">
          <p className="worker-ops-tag">Worker Operations</p>
          <h1>Worker Command Center</h1>
          <p className="worker-ops-hero__text">
            Manage field teams, monitor active service calls, and keep every worker
            assignment organized in one page styled to match your home page theme.
          </p>

          <div className="worker-ops-hero__actions">
            <button
              type="button"
              className="worker-ops-button worker-ops-button--ghost"
              onClick={() => navigate("/home")}
            >
              <FontAwesomeIcon icon={faHouse} />
              Back To Home
            </button>
            <button
              type="button"
              className="worker-ops-button worker-ops-button--primary"
              onClick={() => navigate("/booking")}
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Booking
            </button>
          </div>
        </div>

        <div className="worker-ops-hero__spotlight">
          <p className="worker-ops-spotlight__label">Today Overview</p>
          <strong>{totalJobs} Service Requests</strong>
          <span>
            {isLoadingAssignments
              ? "Loading latest bookings..."
              : `${activeJobs} active jobs are moving across teams right now.`}
          </span>

          <div className="worker-ops-service-grid">
            {serviceCards.map((service) => (
              <article className="worker-ops-service-card" key={service.id}>
                <FontAwesomeIcon icon={service.icon} />
                <span className="worker-ops-service-card__count">{service.count} requests</span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="worker-ops-metrics">
        {metricCards.map((card) => (
          <article className="worker-ops-metric-card" key={card.id}>
            <div className="worker-ops-metric-card__icon">
              <FontAwesomeIcon icon={card.icon} />
            </div>
            <div className="worker-ops-metric-card__body">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.note}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="worker-ops-grid">
        <article className="worker-ops-panel">
          <div className="worker-ops-panel__header">
            <div>
              <p className="worker-ops-tag">Teams</p>
              <h2>Available Worker Teams</h2>
            </div>
            <span className="worker-ops-pill">{workerTeams.length} crews</span>
          </div>

          <div className="worker-ops-team-grid">
            {workerTeams.map((worker) => (
              <article className="worker-ops-team-card" key={worker.id}>
                <div className="worker-ops-team-card__top">
                  <div>
                    <h3>{worker.name}</h3>
                    <p>{worker.role}</p>
                  </div>
                  <span className={`worker-ops-availability ${worker.availability.toLowerCase().replace(/\s+/g, "-")}`}>
                    {worker.availability}
                  </span>
                </div>

                <div className="worker-ops-team-card__stats">
                  <span>
                    <FontAwesomeIcon icon={faLocationDot} />
                    {worker.city}
                  </span>
                  <span>
                    <FontAwesomeIcon icon={faStar} />
                    {worker.rating}
                  </span>
                  <span>
                    <FontAwesomeIcon icon={faCircleCheck} />
                    {worker.completedJobs} jobs
                  </span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="worker-ops-panel">
          <div className="worker-ops-panel__header">
            <div>
              <p className="worker-ops-tag">Shift Board</p>
              <h2>Daily Flow</h2>
            </div>
            <span className="worker-ops-pill">3 checkpoints</span>
          </div>

          <div className="worker-ops-shift-list">
            {shiftBoard.map((shift) => (
              <article className="worker-ops-shift-card" key={shift.id}>
                <span className="worker-ops-shift-card__time">{shift.time}</span>
                <div>
                  <h3>{shift.title}</h3>
                  <p>{shift.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="worker-ops-panel worker-ops-panel--assignments">
        <div className="worker-ops-panel__header">
          <div>
            <p className="worker-ops-tag">Assignments</p>
            <h2>Live Worker Assignments</h2>
          </div>
          <span className="worker-ops-pill">{totalJobs} jobs</span>
        </div>

        {isLoadingAssignments ? (
          <div className="worker-ops-empty-state">
            <h3>Loading service requests...</h3>
            <p>The worker page is syncing the latest bookings from Firebase.</p>
          </div>
        ) : assignmentsError ? (
          <div className="worker-ops-empty-state">
            <h3>Bookings unavailable</h3>
            <p>{assignmentsError}</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="worker-ops-empty-state">
            <h3>No bookings yet</h3>
            <p>When a new booking is added, it will appear here automatically.</p>
          </div>
        ) : (
          <div className="worker-ops-assignment-grid">
            {assignments.map((assignment) => (
            <article className="worker-ops-assignment-card" key={assignment.id}>
              <div className="worker-ops-assignment-card__top">
                <div>
                  <span className="worker-ops-job-id">{assignment.id}</span>
                  <h3>{assignment.service}</h3>
                </div>
                <span className={`worker-ops-status-pill ${getAssignmentTone(assignment.status)}`}>
                  {assignment.status}
                </span>
              </div>

              <div className="worker-ops-assignment-card__body">
                <p><strong>Customer:</strong> {assignment.customerName}</p>
                <p><strong>Worker:</strong> {assignment.worker}</p>
                <p><strong>Address:</strong> {assignment.address}</p>
                <p><strong>Date:</strong> {assignment.bookingDate}</p>
                <p><strong>Slot:</strong> {assignment.slot}</p>
                <p><strong>Amount:</strong> Rs. {assignment.amount}</p>
              </div>

              <div className="worker-ops-assignment-card__footer">
                <span className={`worker-ops-priority worker-ops-priority--${assignment.priority.toLowerCase()}`}>
                  {assignment.priority} Priority
                </span>
                <a className="worker-ops-call-link" href={`tel:+91${assignment.phone}`}>
                  <FontAwesomeIcon icon={faPhone} />
                  Contact
                </a>
              </div>

              <button
                type="button"
                className="worker-ops-button worker-ops-button--primary"
                onClick={() => handleAdvanceStatus(assignment)}
                disabled={assignment.status === "Completed"}
              >
                {assignment.status === "Pending" && "Assign Worker"}
                {assignment.status === "Assigned" && "Start Job"}
                {assignment.status === "In Progress" && "Mark Complete"}
                {assignment.status === "Completed" && "Completed"}
              </button>
            </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default WorkerOperationsPage;
