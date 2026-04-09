import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAddressCard,
  faCalendarCheck,
  faCamera,
  faCircleCheck,
  faClock,
  faEnvelope,
  faHouse,
  faLocationDot,
  faPenToSquare,
  faPhone,
  faPlus,
  faUser,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { db, storage } from "../Firebase/Firebaseconfer";
import {
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";
import { useAuth } from "../contex/Authconfig";

const initialUserState = {
  name: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  email: "",
  profileImage: "",
  profileUpdatedAt: 0
};

const profileFields = [
  "name",
  "phone",
  "address",
  "city",
  "state",
  "pincode",
  "profileImage"
];

const hasValue = (value) => {
  if (typeof value === "string") {
    return value.trim() !== "";
  }

  return Boolean(value);
};

const getStatusTone = (status = "") => {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes("completed")) {
    return "is-completed";
  }

  if (normalizedStatus.includes("cancelled") || normalizedStatus.includes("canceled")) {
    return "is-cancelled";
  }

  if (normalizedStatus.includes("pending")) {
    return "is-pending";
  }

  return "is-default";
};

const getNormalizedBookingStatus = (status = "") => status.trim().toLowerCase();

const isPastBookingStatus = (status = "") => {
  const normalizedStatus = getNormalizedBookingStatus(status);

  return normalizedStatus === "completed" ||
    normalizedStatus === "cancelled" ||
    normalizedStatus === "canceled";
};

const defaultProfileImage = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <defs>
      <linearGradient id="avatarGradient" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop offset="0%" stop-color="#4158d0" />
        <stop offset="55%" stop-color="#c850c0" />
        <stop offset="100%" stop-color="#ffcc70" />
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="28" fill="url(#avatarGradient)" />
    <circle cx="60" cy="46" r="18" fill="rgba(255,255,255,0.92)" />
    <path d="M30 94c6-16 18-24 30-24s24 8 30 24" fill="rgba(255,255,255,0.92)" />
  </svg>
`)}`;

const getProfileCacheKey = (uid) => `dashboard-profile-${uid}`;

const getProfileVersion = (profileData) => Number(profileData?.profileUpdatedAt || 0);

const isDataUrlImage = (value) =>
  typeof value === "string" && value.startsWith("data:image/");

const isDeprecatedPlaceholderImage = (value) =>
  typeof value === "string" && value.includes("via.placeholder.com/120x120.png?text=User");

const sanitizeProfileData = (profileData = {}) => ({
  ...profileData,
  profileImage: isDeprecatedPlaceholderImage(profileData.profileImage)
    ? ""
    : profileData.profileImage || ""
});

const getBookingsCacheKey = (uid) => `dashboard-bookings-${uid}`;

const getBookingSortValue = (booking = {}) =>
  booking.createdAt?.toMillis?.() ||
  booking.createdAtMillis ||
  booking.updatedAt?.toMillis?.() ||
  Date.parse(booking.bookingDate || booking.date || "") ||
  0;

const normalizeBookingData = (booking = {}) => ({
  ...booking,
  createdAtMillis: getBookingSortValue(booking)
});

const sortBookings = (bookingList = []) =>
  [...bookingList].sort(
    (firstBooking, secondBooking) =>
      getBookingSortValue(secondBooking) - getBookingSortValue(firstBooking)
  );

const mergeBookings = (cachedBookings = [], liveBookings = []) => {
  const mergedBookings = new Map();

  cachedBookings.forEach((booking) => {
    if (booking?.id) {
      mergedBookings.set(booking.id, normalizeBookingData(booking));
    }
  });

  liveBookings.forEach((booking) => {
    if (booking?.id) {
      mergedBookings.set(booking.id, normalizeBookingData(booking));
    }
  });

  return sortBookings(Array.from(mergedBookings.values()));
};

const readCachedBookings = (uid) => {
  if (!uid) {
    return [];
  }

  try {
    const cachedBookings = window.localStorage.getItem(getBookingsCacheKey(uid));

    if (!cachedBookings) {
      return [];
    }

    const parsedBookings = JSON.parse(cachedBookings);

    return Array.isArray(parsedBookings)
      ? sortBookings(parsedBookings.map((booking) => normalizeBookingData(booking)))
      : [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

const writeCachedBookings = (uid, bookingList) => {
  if (!uid) {
    return;
  }

  try {
    window.localStorage.setItem(
      getBookingsCacheKey(uid),
      JSON.stringify(sortBookings(bookingList.map((booking) => normalizeBookingData(booking))))
    );
  } catch (error) {
    console.error(error);
  }
};

const readCachedProfile = (uid) => {
  if (!uid) {
    return null;
  }

  try {
    const cachedProfile = window.localStorage.getItem(getProfileCacheKey(uid));

    if (!cachedProfile) {
      return null;
    }

    const parsedProfile = JSON.parse(cachedProfile);

    return parsedProfile && typeof parsedProfile === "object"
      ? sanitizeProfileData(parsedProfile)
      : null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const writeCachedProfile = (uid, profileData) => {
  if (!uid) {
    return;
  }

  try {
    window.localStorage.setItem(
      getProfileCacheKey(uid),
      JSON.stringify({
        ...initialUserState,
        ...sanitizeProfileData(profileData)
      })
    );
  } catch (error) {
    console.error(error);
  }
};

const maxProfileImageSize = 360;
const maxStoredImageCharacters = 520000;
const profileImageQuality = 0.9;

const convertImageToProfileDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const scale = Math.min(1, maxProfileImageSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Could not process the selected image."));
          return;
        }

        canvas.width = width;
        canvas.height = height;
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(image, 0, 0, width, height);

        const imageDataUrl = canvas.toDataURL("image/jpeg", profileImageQuality);

        if (imageDataUrl.length > maxStoredImageCharacters) {
          reject(new Error("Please choose a smaller profile image."));
          return;
        }

        resolve(imageDataUrl);
      };

      image.onerror = () => {
        reject(new Error("Could not read the selected image."));
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      reject(new Error("Could not read the selected image."));
    };

    reader.readAsDataURL(file);
  });

const uploadProfileImage = async (uid, imageDataUrl) => {
  if (!imageDataUrl) {
    return "";
  }

  const imageRef = ref(storage, `profiles/${uid}/profile-${Date.now()}.jpg`);

  await uploadString(imageRef, imageDataUrl, "data_url");

  return getDownloadURL(imageRef);
};

const Dashboard1 = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  // ✅ USER STATE
  const [user, setUser] = useState(initialUserState);
  const [formData, setFormData] = useState(initialUserState);
  const [bookings, setBookings] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState("");
  const [expandedBookingId, setExpandedBookingId] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  // ✅ FETCH USER (REAL-TIME)
  useEffect(() => {
    if (!authUser) {
      setUser(initialUserState);
      setFormData(initialUserState);
      setSelectedProfileImage("");
      setExpandedBookingId("");
      setIsEditingProfile(false);
      setSaveMessage("");
      setSaveError("");
      return;
    }

    const cachedProfile = readCachedProfile(authUser.uid);

    if (cachedProfile) {
      const mergedCachedProfile = {
        ...initialUserState,
        email: authUser.email || "",
        ...sanitizeProfileData(cachedProfile)
      };

      setUser(mergedCachedProfile);
      setFormData(mergedCachedProfile);
    }

    const unsub = onSnapshot(
      doc(db, "users", authUser.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const serverProfile = {
            ...initialUserState,
            email: authUser.email || "",
            ...sanitizeProfileData(docSnap.data())
          };
          const cachedProfileData = readCachedProfile(authUser.uid);
          const latestProfile =
            getProfileVersion(cachedProfileData) > getProfileVersion(serverProfile)
              ? {
                  ...serverProfile,
                  ...cachedProfileData,
                  email: cachedProfileData?.email || serverProfile.email
                }
              : serverProfile;

          setUser(latestProfile);
          writeCachedProfile(authUser.uid, latestProfile);
        } else {
          setUser((currentUser) => {
            const hasStoredProfile = profileFields.some((field) => hasValue(currentUser[field]));

            if (hasStoredProfile) {
              return {
                ...currentUser,
                email: currentUser.email || authUser.email || ""
              };
            }

            return {
              ...initialUserState,
              email: authUser.email || ""
            };
          });
        }
      },
      (error) => {
        console.error(error);
        setSaveError("Failed to sync profile data. Showing your last saved profile.");
      }
    );

    return () => unsub();
  }, [authUser]);

  // ✅ FETCH BOOKINGS (REAL-TIME)
  useEffect(() => {
    if (!authUser) {
      setBookings([]);
      return;
    }

    const cachedBookings = readCachedBookings(authUser.uid);
    const sourceBookings = new Map();
    const unsubscribeCallbacks = [];
    const authEmail = authUser.email || "";
    const emailFields = authEmail ? ["userEmail", "email", "customerEmail"] : [];

    if (cachedBookings.length > 0) {
      setBookings(cachedBookings);
    }

    const syncLiveBookings = () => {
      const liveBookings = mergeBookings(
        readCachedBookings(authUser.uid),
        Array.from(sourceBookings.values()).flat()
      );

      setBookings(liveBookings);
      writeCachedBookings(authUser.uid, liveBookings);
    };

    const subscribeToBookings = (sourceKey, bookingsQuery) => {
      const unsubscribe = onSnapshot(
        bookingsQuery,
        (snapshot) => {
          sourceBookings.set(
            sourceKey,
            snapshot.docs.map((bookingDoc) => ({
              id: bookingDoc.id,
              ...normalizeBookingData(bookingDoc.data())
            }))
          );
          syncLiveBookings();
        },
        (error) => {
          console.error(error);
          sourceBookings.set(sourceKey, []);
          syncLiveBookings();
        }
      );

      unsubscribeCallbacks.push(unsubscribe);
    };

    subscribeToBookings(
      "userId",
      query(collection(db, "bookings"), where("userId", "==", authUser.uid))
    );

    emailFields.forEach((field) => {
      subscribeToBookings(
        field,
        query(collection(db, "bookings"), where(field, "==", authEmail))
      );
    });

    return () => {
      unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
    };
  }, [authUser]);

  useEffect(() => {
    if (!isEditingProfile) {
      setFormData(user);
    }
  }, [user, isEditingProfile]);

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((booking) => booking.status === "Completed").length;
  const pendingBookings = bookings.filter((booking) => booking.status === "Pending").length;
  const activeBookings = bookings.filter((booking) => !isPastBookingStatus(booking.status || ""));
  const bookingHistory = bookings.filter((booking) => isPastBookingStatus(booking.status || ""));
  const profileCompletion = Math.round(
    (profileFields.filter((field) => hasValue(user[field])).length / profileFields.length) * 100
  );
  const profileImageSrc =
    selectedProfileImage || sanitizeProfileData(user).profileImage || defaultProfileImage;

  const statCards = [
    {
      id: "total",
      icon: faCalendarCheck,
      label: "Total Bookings",
      value: totalBookings,
      note: "All your service requests in one place"
    },
    {
      id: "completed",
      icon: faCircleCheck,
      label: "Completed",
      value: completedBookings,
      note: "Finished visits and successful jobs"
    },
    {
      id: "pending",
      icon: faClock,
      label: "Pending",
      value: pendingBookings,
      note: "Requests still waiting for action"
    }
  ];

  const detailCards = [
    {
      id: "name",
      icon: faUser,
      label: "Full Name",
      value: user.name || "Not added yet"
    },
    {
      id: "phone",
      icon: faPhone,
      label: "Phone",
      value: user.phone || "Not added yet"
    },
    {
      id: "email",
      icon: faEnvelope,
      label: "Email",
      value: user.email || "Not added yet"
    },
    {
      id: "address",
      icon: faHouse,
      label: "Address",
      value: user.address || "Not added yet"
    },
    {
      id: "location",
      icon: faLocationDot,
      label: "City / State",
      value:
        [user.city, user.state].filter((item) => hasValue(item)).join(", ") || "Not added yet"
    },
    {
      id: "pincode",
      icon: faAddressCard,
      label: "Pincode",
      value: user.pincode || "Not added yet"
    }
  ];

  // ✅ HANDLE INPUT
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleEditProfile = () => {
    setFormData(user);
    setSelectedProfileImage("");
    setSaveMessage("");
    setSaveError("");
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setFormData(user);
    setSelectedProfileImage("");
    setSaveError("");
    setSaveMessage("");
    setIsEditingProfile(false);
  };

  const toggleBookingDetails = (bookingId) => {
    setExpandedBookingId((currentBookingId) =>
      currentBookingId === bookingId ? "" : bookingId
    );
  };

  // ✅ SAVE PROFILE (INSTANT UI + FIRESTORE)
  const handleSave = async () => {
    if (!authUser) {
      setSaveError("Please login again and try updating your profile.");
      return;
    }

    try {
      setIsSavingProfile(true);
      setSaveMessage("");
      setSaveError("");

      const localPreviewProfile = {
        ...initialUserState,
        ...formData,
        email: authUser.email || formData.email,
        profileImage: selectedProfileImage || sanitizeProfileData(user).profileImage || "",
        profileUpdatedAt: Date.now()
      };

      writeCachedProfile(authUser.uid, localPreviewProfile);
      setUser(localPreviewProfile);
      setFormData(localPreviewProfile);

      let savedProfileImage = localPreviewProfile.profileImage;
      const pendingImageToUpload = selectedProfileImage || (
        isDataUrlImage(localPreviewProfile.profileImage) ? localPreviewProfile.profileImage : ""
      );

      if (pendingImageToUpload) {
        savedProfileImage = await uploadProfileImage(authUser.uid, pendingImageToUpload);
      }

      const updatedData = {
        ...formData,
        email: authUser.email || formData.email,
        profileImage: savedProfileImage,
        profileUpdatedAt: Date.now()
      };
      const savedProfile = {
        ...initialUserState,
        ...updatedData
      };

      writeCachedProfile(authUser.uid, savedProfile);
      setUser(savedProfile);
      setFormData(savedProfile);
      setSelectedProfileImage("");
      setIsEditingProfile(false);
      setSaveMessage("Profile updated and saved.");

      await setDoc(
        doc(db, "users", authUser.uid),
        savedProfile,
        { merge: true }
      );
    } catch (error) {
      console.error(error);
      setSaveError(
        error.message || "Profile saved on this device, but cloud sync failed. Please try again."
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ✅ IMAGE UPLOAD (INSTANT SHOW)
  const handleImageUpload = async (file) => {
    if (!authUser || !file) return;

    if (!file.type.startsWith("image/")) {
      setSaveError("Please select a valid image file.");
      return;
    }

    try {
      setSaveMessage("");
      setSaveError("");

      const imageDataUrl = await convertImageToProfileDataUrl(file);
      const previewProfile = {
        ...initialUserState,
        ...user,
        email: authUser.email || user.email || "",
        profileImage: imageDataUrl,
        profileUpdatedAt: Date.now()
      };

      setSelectedProfileImage(imageDataUrl);
      setUser(previewProfile);
      setFormData((prev) => ({
        ...prev,
        profileImage: imageDataUrl
      }));
      writeCachedProfile(authUser.uid, previewProfile);
      setIsEditingProfile(true);
    } catch (error) {
      console.error(error);
      setSaveError(error.message || "Could not process the selected image.");
    }
  };

  // ✅ CANCEL BOOKING
  const cancelBooking = async (id) => {
    if (!authUser) {
      return;
    }

    const previousBookings = bookings;
    const updatedBookings = bookings.map((booking) =>
      booking.id === id
        ? {
            ...booking,
            status: "Cancelled",
            updatedAt: {
              toMillis: () => Date.now()
            },
            updatedAtMillis: Date.now()
          }
        : booking
    );

    setBookings(updatedBookings);
    writeCachedBookings(authUser.uid, updatedBookings);
    setExpandedBookingId(id);

    try {
      await updateDoc(doc(db, "bookings", id), {
        status: "Cancelled",
        updatedAt: serverTimestamp(),
        cancelledAt: serverTimestamp()
      });
    } catch (error) {
      console.error(error);
      setBookings(previousBookings);
      writeCachedBookings(authUser.uid, previousBookings);
    }
  };

  const renderBookingCards = (bookingList, emptyHeading, emptyMessage) => {
    if (bookingList.length === 0) {
      return (
        <div className="dashboard-booking-empty">
          <h4>{emptyHeading}</h4>
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="dashboard-bookings-grid">
        {bookingList.map((booking) => {
          const isExpanded = expandedBookingId === booking.id;
          const isPastBooking = isPastBookingStatus(booking.status || "");

          return (
            <article
              className={`dashboard-booking-card ${isExpanded ? "is-expanded" : ""}`}
              key={booking.id}
            >
              <button
                type="button"
                className="dashboard-booking-card__surface"
                onClick={() => toggleBookingDetails(booking.id)}
              >
                <div className="dashboard-booking-card__top">
                  <span className="dashboard-service-chip">
                    {booking.service || "Service Request"}
                  </span>
                  <span
                    className={`dashboard-status-pill ${getStatusTone(
                      booking.status || ""
                    )}`}
                  >
                    {booking.status || "Pending"}
                  </span>
                </div>

                <div className="dashboard-booking-card__body">
                  <h4>{booking.service || "Home Service"}</h4>
                  <p>{booking.address || user.address || "Address will be confirmed soon."}</p>
                </div>

                <div className="dashboard-booking-card__meta">
                  <span>
                    <FontAwesomeIcon icon={faCalendarCheck} />
                    {booking.date || booking.bookingDate || "Date not assigned"}
                  </span>
                  <span>
                    <FontAwesomeIcon icon={faLocationDot} />
                    {booking.city || user.city || "Location pending"}
                  </span>
                </div>
              </button>

              <div className="dashboard-booking-card__actions">
                <button
                  type="button"
                  className="dashboard-button dashboard-button--ghost"
                  onClick={() => toggleBookingDetails(booking.id)}
                >
                  {isExpanded ? "Hide Details" : "View Details"}
                </button>

                {!isPastBooking && (
                  <button
                    type="button"
                    className="dashboard-button dashboard-button--danger"
                    onClick={() => cancelBooking(booking.id)}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>

              {isExpanded && (
                <div className="dashboard-booking-details">
                  <div className="dashboard-booking-details__item">
                    <span>Booking ID</span>
                    <strong>{booking.id}</strong>
                  </div>
                  <div className="dashboard-booking-details__item">
                    <span>Customer</span>
                    <strong>{booking.customerName || booking.name || user.name || "Customer"}</strong>
                  </div>
                  <div className="dashboard-booking-details__item">
                    <span>Phone</span>
                    <strong>{booking.phone || user.phone || "Not added yet"}</strong>
                  </div>
                  <div className="dashboard-booking-details__item">
                    <span>Worker</span>
                    <strong>{booking.worker || "Waiting Assignment"}</strong>
                  </div>
                  <div className="dashboard-booking-details__item">
                    <span>Priority</span>
                    <strong>{booking.priority || "Medium"}</strong>
                  </div>
                  <div className="dashboard-booking-details__item">
                    <span>Slot</span>
                    <strong>{booking.slot || "To Be Assigned"}</strong>
                  </div>
                  <div className="dashboard-booking-details__item">
                    <span>Amount</span>
                    <strong>
                      {booking.amount ? `Rs. ${booking.amount}` : "Will be shared soon"}
                    </strong>
                  </div>
                  <div className="dashboard-booking-details__item dashboard-booking-details__item--full">
                    <span>Address</span>
                    <strong>{booking.address || user.address || "Not added yet"}</strong>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <div className="dashboard-shell">
      <div className="dashboard-shell__glow dashboard-shell__glow--one" />
      <div className="dashboard-shell__glow dashboard-shell__glow--two" />

      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <p className="dashboard-brand__eyebrow">G&K Home Services</p>
          <h2>Client Hub</h2>
          <span>Your bookings, profile, and service details in one place.</span>
        </div>

        <nav className="dashboard-nav">
          <a href="#overview" className="dashboard-nav__item">
            <FontAwesomeIcon icon={faHouse} />
            <span>Overview</span>
          </a>
          <a href="#profile-section" className="dashboard-nav__item">
            <FontAwesomeIcon icon={faAddressCard} />
            <span>Profile</span>
          </a>
          <a href="#bookings-section" className="dashboard-nav__item">
            <FontAwesomeIcon icon={faCalendarCheck} />
            <span>Bookings</span>
          </a>
        </nav>

        <div className="dashboard-sidebar__card">
          <p className="dashboard-sidebar__title">Profile Completion</p>
          <div className="dashboard-progress">
            <div
              className="dashboard-progress__bar"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
          <strong>{profileCompletion}% ready</strong>
          <span>
            Complete your profile once and bookings become faster every time.
          </span>
        </div>

        <div className="dashboard-sidebar__actions">
          <button
            type="button"
            className="dashboard-button dashboard-button--ghost"
            onClick={() => navigate("/home")}
          >
            <FontAwesomeIcon icon={faHouse} />
            Back To Home
          </button>
          <button
            type="button"
            className="dashboard-button dashboard-button--primary"
            onClick={() => navigate("/booking")}
          >
            <FontAwesomeIcon icon={faPlus} />
            New Booking
          </button>
        </div>
      </aside>

      <main className="dashboard-content">
        <section className="dashboard-hero" id="overview">
          <div className="dashboard-hero__copy">
            <p className="dashboard-section-tag">Customer Dashboard</p>
            <h1>
              {user.name ? `${user.name}'s Service Space` : "Your Service Space"}
            </h1>
            <p className="dashboard-hero__text">
              Manage personal details, refresh your profile photo, and track every
              service request inside a dashboard designed to match your home page
              theme.
            </p>

            <div className="dashboard-hero__quick">
              <div className="dashboard-quick-card">
                <FontAwesomeIcon icon={faEnvelope} />
                <span>{user.email || "Add your email"}</span>
              </div>
              <div className="dashboard-quick-card">
                <FontAwesomeIcon icon={faLocationDot} />
                <span>{user.city || "Your city"}{user.state ? `, ${user.state}` : ""}</span>
              </div>
            </div>
          </div>

          <div className="dashboard-hero__profile">
            <div className="dashboard-avatar-wrap">
              <div className="dashboard-avatar-ring">
                <img
                  src={profileImageSrc}
                  alt="profile"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = defaultProfileImage;
                  }}
                />
              </div>
            </div>

            <input
              id="dashboard-photo-upload"
              className="dashboard-file-input"
              type="file"
              accept="image/*"
              disabled={isSavingProfile}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  handleImageUpload(file);
                }
                event.target.value = "";
              }}
            />
            <label
              htmlFor="dashboard-photo-upload"
              className={`dashboard-photo-button ${
                isSavingProfile ? "is-disabled" : ""
              }`}
            >
              <FontAwesomeIcon icon={faCamera} />
              <span>{selectedProfileImage ? "Photo Selected" : "Change Photo"}</span>
            </label>
            <p className="dashboard-hero__caption">
              {selectedProfileImage
                ? "Photo preview is ready. Click Update Profile to save it."
                : "Select a new image and it appears in the header instantly."}
            </p>
          </div>
        </section>

        <section className="dashboard-stats">
          {statCards.map((card) => (
            <article className="dashboard-stat-card" key={card.id}>
              <div className="dashboard-stat-card__icon">
                <FontAwesomeIcon icon={card.icon} />
              </div>
              <div className="dashboard-stat-card__body">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <p>{card.note}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="dashboard-panels">
          <article className="dashboard-panel dashboard-panel--profile" id="profile-section">
            <div className="dashboard-panel__header">
              <div>
                <p className="dashboard-section-tag">Profile</p>
                <h3>Personal Details</h3>
              </div>

              {!isEditingProfile ? (
                <button
                  type="button"
                  className="dashboard-button dashboard-button--primary"
                  onClick={handleEditProfile}
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                  Edit Profile
                </button>
              ) : (
                <button
                  type="button"
                  className="dashboard-button dashboard-button--ghost"
                  onClick={handleCancelEdit}
                  disabled={isSavingProfile}
                >
                  <FontAwesomeIcon icon={faXmark} />
                  Cancel
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <div className="dashboard-form-grid">
                <label className="dashboard-field">
                  <span>Name</span>
                  <input
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                </label>
                <label className="dashboard-field">
                  <span>Phone</span>
                  <input
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    placeholder="Enter your mobile number"
                  />
                </label>
                <label className="dashboard-field dashboard-field--full">
                  <span>Address</span>
                  <input
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                    placeholder="Enter your address"
                  />
                </label>
                <label className="dashboard-field">
                  <span>City</span>
                  <input
                    name="city"
                    value={formData.city || ""}
                    onChange={handleChange}
                    placeholder="Enter your city"
                  />
                </label>
                <label className="dashboard-field">
                  <span>State</span>
                  <input
                    name="state"
                    value={formData.state || ""}
                    onChange={handleChange}
                    placeholder="Enter your state"
                  />
                </label>
                <label className="dashboard-field dashboard-field--full">
                  <span>Pincode</span>
                  <input
                    name="pincode"
                    value={formData.pincode || ""}
                    onChange={handleChange}
                    placeholder="Enter your pincode"
                  />
                </label>

                <div className="dashboard-form-actions">
                  <button
                    type="button"
                    className="dashboard-button dashboard-button--primary"
                    onClick={handleSave}
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? "Updating..." : "Update Profile"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="dashboard-detail-grid">
                {detailCards.map((detail) => (
                  <div className="dashboard-detail-card" key={detail.id}>
                    <div className="dashboard-detail-card__label">
                      <FontAwesomeIcon icon={detail.icon} />
                      <span>{detail.label}</span>
                    </div>
                    <strong>{detail.value}</strong>
                  </div>
                ))}
              </div>
            )}

            {saveMessage && (
              <p className="dashboard-message dashboard-message--success">{saveMessage}</p>
            )}
            {saveError && (
              <p className="dashboard-message dashboard-message--error">{saveError}</p>
            )}
          </article>
        </section>

        <section className="dashboard-panel dashboard-panel--bookings" id="bookings-section">
          <div className="dashboard-panel__header">
            <div>
              <p className="dashboard-section-tag">Bookings</p>
              <h3>Your Booking Activity</h3>
            </div>
            <span className="dashboard-count-pill">{totalBookings} records</span>
          </div>

          {bookings.length === 0 ? (
            <div className="dashboard-empty-state">
              <h4>No bookings yet</h4>
              <p>
                Start your first service request and it will appear here with status,
                service name, and quick actions.
              </p>
              <button
                type="button"
                className="dashboard-button dashboard-button--primary"
                onClick={() => navigate("/booking")}
              >
                <FontAwesomeIcon icon={faPlus} />
                Book A Service
              </button>
            </div>
          ) : (
            <div className="dashboard-booking-sections">
              <div className="dashboard-booking-section">
                <div className="dashboard-booking-section__header">
                  <h4>Current Bookings</h4>
                  <span>{activeBookings.length} active</span>
                </div>
                {renderBookingCards(
                  activeBookings,
                  "No active bookings",
                  "Your active or pending services will appear here."
                )}
              </div>

              <div className="dashboard-booking-section">
                <div className="dashboard-booking-section__header">
                  <h4>Booking History</h4>
                  <span>{bookingHistory.length} saved</span>
                </div>
                {renderBookingCards(
                  bookingHistory,
                  "No booking history yet",
                  "Completed and cancelled services will stay here permanently."
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard1;
