import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonText,
  IonAlert,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonRadioGroup,
  IonRadio,
} from "@ionic/react";
import {
  chevronBackCircleOutline,
  card,
  chevronForwardCircle,
  timeOutline,
  calendarOutline,
  storefront,
  walk,
  walkOutline,
} from "ionicons/icons";
import dayjs from "dayjs";
import CheckoutStepProgress from "../components/CheckoutStepProgress";
import "./Schedule.css";

const Schedule: React.FC = () => {
  const history = useHistory();

  // Initialize pickupOption from localStorage, but we'll update this based on store hours
  const [pickupOption, setPickupOption] = useState<"now" | "later">(() => {
    const saved = localStorage.getItem("pickupOption");
    return saved ? (saved === "now" ? "now" : "later") : "later";
  });

  const [pickupDate, setPickupDate] = useState<string>(() => {
    return localStorage.getItem("pickupDate") || "";
  });

  const [pickupTime, setPickupTime] = useState<string>(() => {
    return localStorage.getItem("pickupTime") || "";
  });

  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertHeader, setAlertHeader] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  // All possible time slots with 15-minute intervals (updated to use ranges)
  const generateAllTimeSlots = () => {
    const slots = [];
    const startHour = 4; // 4:00 AM
    const endHour = 18; // 6:00 PM

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const startTime = dayjs().hour(hour).minute(minute);
        const endTime = startTime.add(15, "minute");

        const formattedStartTime = startTime.format("h:mm A");
        const formattedEndTime = endTime.format("h:mm A");

        const timeRange = `${formattedStartTime} - ${formattedEndTime}`;
        slots.push({
          display: timeRange,
          startTime: startTime,
          value: timeRange,
        });
      }
    }
    return slots;
  };

  const allTimeSlots = generateAllTimeSlots();

  // Check if store is currently open and auto-select appropriate pickup option
  const checkStoreHours = () => {
    const now = dayjs();
    const hour = now.hour();

    // Store hours: 4:00 AM - 6:00 PM (4-18 in 24-hour format)
    const isOpen = hour >= 4 && hour < 18;
    setIsStoreOpen(isOpen);

    // Auto-select "Pickup Now" if store is open
    if (isOpen) {
      setPickupOption("now");
      localStorage.setItem("pickupOption", "now");

      // Set today's date when auto-selecting "Pickup Now"
      const today = dayjs().format("YYYY-MM-DD");
      setPickupDate(today);
      localStorage.setItem("pickupDate", today);

      // Update available time slots for today
      updateAvailableTimeSlots(today);
    } else {
      // Auto-select "Pickup Tomorrow" if store is closed
      setPickupOption("later");
      localStorage.setItem("pickupOption", "later");

      // Set tomorrow's date when auto-selecting "Pickup Tomorrow"
      const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");
      setPickupDate(tomorrow);
      localStorage.setItem("pickupDate", tomorrow);

      // Update available time slots for tomorrow
      updateAvailableTimeSlots(tomorrow);
    }
  };

  // Check store hours on component mount and periodically
  useEffect(() => {
    checkStoreHours();

    // Re-check store hours every minute
    const interval = setInterval(checkStoreHours, 60000);

    return () => clearInterval(interval);
  }, []);

  // Save to localStorage whenever values change
  useEffect(() => {
    localStorage.setItem("pickupOption", pickupOption);

    // When switching to pickup today, automatically select today's date
    if (pickupOption === "now") {
      const today = dayjs().format("YYYY-MM-DD");
      setPickupDate(today);
      localStorage.setItem("pickupDate", today);

      // Update time slots for today (only future times)
      updateAvailableTimeSlots(today);

      // Clear any previously selected time
      setPickupTime("");
      localStorage.removeItem("pickupTime");
    }
    // When switching to schedule pickup, automatically select tomorrow's date
    else if (pickupOption === "later") {
      const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");
      setPickupDate(tomorrow);
      localStorage.setItem("pickupDate", tomorrow);

      // Update time slots for tomorrow (all times)
      updateAvailableTimeSlots(tomorrow);

      // Clear any previously selected time
      setPickupTime("");
      localStorage.removeItem("pickupTime");
    }
  }, [pickupOption]);

  useEffect(() => {
    localStorage.setItem("pickupDate", pickupDate);
  }, [pickupDate]);

  useEffect(() => {
    if (pickupTime) {
      localStorage.setItem("pickupTime", pickupTime);
    }
  }, [pickupTime]);

  // Effect to load available time slots on initial mount
  useEffect(() => {
    if (pickupOption === "now") {
      const today = dayjs().format("YYYY-MM-DD");
      updateAvailableTimeSlots(today);
    } else if (pickupOption === "later") {
      const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");
      updateAvailableTimeSlots(tomorrow);
    }
  }, []); // Empty dependency array means this runs once on mount

  // Update available time slots whenever pickup date changes
  useEffect(() => {
    if (pickupDate && pickupOption === "later") {
      updateAvailableTimeSlots(pickupDate);
    }
  }, [pickupDate, pickupOption]);

  // Clear pickup time when available time slots change
  useEffect(() => {
    // Only clear the selected time if it's no longer in the available time slots
    // AND if there are available time slots (to prevent clearing on initial load)
    if (
      pickupTime &&
      availableTimeSlots.length > 0 &&
      !availableTimeSlots.includes(pickupTime) &&
      pickupOption === "later"
    ) {
      setPickupTime("");
      localStorage.removeItem("pickupTime");
    }
  }, [availableTimeSlots, pickupTime, pickupOption]);

  const updateAvailableTimeSlots = (selectedDate: string) => {
    const today = dayjs().format("YYYY-MM-DD");
    const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");
    const now = dayjs();

    // If selected date is today, filter out past time slots
    if (selectedDate === today) {
      const availableSlots = allTimeSlots.filter((slot) => {
        // Add a buffer of 30 minutes to the current time
        const bufferTime = now.add(30, "minute");
        return slot.startTime.isAfter(bufferTime);
      });

      setAvailableTimeSlots(availableSlots.map((slot) => slot.value));
    }
    // If selected date is tomorrow, all time slots are available
    else if (selectedDate === tomorrow) {
      setAvailableTimeSlots(allTimeSlots.map((slot) => slot.value));
    }
    // For any other future dates (fallback)
    else {
      setAvailableTimeSlots(allTimeSlots.map((slot) => slot.value));
    }
  };

  const generateAvailableDates = () => {
    const dates = [];
    // Use dayjs for consistent date handling
    const today = dayjs();
    const tomorrow = today.add(1, "day");

    // Only add today and tomorrow
    dates.push(today.format("YYYY-MM-DD"));
    dates.push(tomorrow.format("YYYY-MM-DD"));

    return dates;
  };

  // Helper function to format a date nicely
  const formatDateToDisplay = (dateString: string) => {
    const date = dayjs(dateString);
    // Format as: "Monday, April 5, 2023"
    return date.format("dddd, MMMM D, YYYY");
  };

  const nextStep = () => {
    // Prevent navigation if required conditions are not met
    if (pickupOption === "later") {
      if (!pickupDate) {
        setAlertHeader("Date Required");
        setAlertMessage("Please select a pickup date before proceeding.");
        setShowAlert(true);
        return;
      }

      if (availableTimeSlots.length === 0) {
        setAlertHeader("No Available Time Slots");
        setAlertMessage(
          "There are no available time slots for the selected date. Please select a different date."
        );
        setShowAlert(true);
        return;
      }

      if (!pickupTime) {
        setAlertHeader("Time Required");
        setAlertMessage("Please select a pickup time before proceeding.");
        setShowAlert(true);
        return;
      }
    }

    if (currentStep < 2) {
      setCurrentStep((prevStep) => prevStep + 1);
      const routes = ["/home/cart/schedule", "/home/cart/schedule/payment"];
      history.replace(routes[currentStep + 1]);
    }
  };

  const handlePickupOptionChange = (value: "now" | "later") => {
    // If trying to select "now" but store is closed, show alert and keep "later" selected
    if (value === "now" && !isStoreOpen) {
      setAlertHeader("Store Closed");
      setAlertMessage(
        "Our store is currently closed. Store hours are 4:00 AM to 6:00 PM. Please select 'Schedule Pickup' to schedule a pickup during business hours."
      );
      setShowAlert(true);
      return;
    }

    setPickupOption(value);

    // Always set initial status to "scheduled" (Order Placed)
    // Payment method will determine final status in the Payment step
    localStorage.setItem("status", "scheduled");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Schedule</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="schedule-content">
        <div className="checkout-progress-container">
          <CheckoutStepProgress currentStep={currentStep} />
        </div>

        {/* Pickup Option Selection Cards */}
        <div className="schedule-container">
          <IonCard className="schedule-card">
            <IonCardHeader>
              <IonCardTitle>Pickup Options</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonRadioGroup
                value={pickupOption}
                onIonChange={(e) => handlePickupOptionChange(e.detail.value)}
              >
                <IonCard
                  className={`pickup-option-card clickable-card ${
                    pickupOption === "now" ? "selected" : ""
                  } ${!isStoreOpen ? "disabled-option" : ""}`}
                  onClick={() => handlePickupOptionChange("now")}
                >
                  <IonCardContent>
                    <IonItem
                      className="pickup-option-item"
                      lines="none"
                      button
                      disabled={!isStoreOpen}
                    >
                      <IonLabel>
                        <IonText>
                          <strong>Pickup Today</strong>
                        </IonText>
                        <IonText color="medium">
                          <small>
                            {isStoreOpen
                              ? "Select a pickup time for later today"
                              : "Store is currently closed (4:00 AM - 6:00 PM)"}
                          </small>
                        </IonText>
                      </IonLabel>
                      <IonRadio
                        slot="end"
                        value="now"
                        disabled={!isStoreOpen}
                      />
                      <IonIcon
                        icon={walkOutline}
                        slot="start"
                        className="pickup-icon"
                      />
                    </IonItem>
                  </IonCardContent>
                </IonCard>

                <IonCard
                  className={`pickup-option-card clickable-card ${
                    pickupOption === "later" ? "selected" : ""
                  }`}
                  onClick={() => handlePickupOptionChange("later")}
                >
                  <IonCardContent>
                    <IonItem className="pickup-option-item" lines="none" button>
                      <IonLabel>
                        <IonText>
                          <strong>Pickup Tomorrow</strong>
                        </IonText>
                        <IonText color="medium">
                          <small>Schedule your pickup for tomorrow</small>
                        </IonText>
                      </IonLabel>
                      <IonRadio slot="end" value="later" />
                      <IonIcon
                        icon={calendarOutline}
                        slot="start"
                        className="pickup-icon"
                      />
                    </IonItem>
                  </IonCardContent>
                </IonCard>
              </IonRadioGroup>
            </IonCardContent>
          </IonCard>
        </div>

        {/* If Pickup Today is selected */}
        {pickupOption === "now" && (
          <div className="schedule-form-container">
            <IonItem className="date-selection-item">
              <IonLabel className="selection-label">Date</IonLabel>
              <IonText slot="end" color="medium">
                {pickupDate ? formatDateToDisplay(pickupDate) : "Today"}
              </IonText>
            </IonItem>

            <IonItem className="time-selection-item">
              <IonLabel className="selection-label">Pick a Time</IonLabel>
              <IonSelect
                className="time-select"
                placeholder="Select Time"
                value={pickupTime}
                onIonChange={(e) => {
                  setPickupTime(e.detail.value);
                  localStorage.setItem("pickupTime", e.detail.value);
                }}
                disabled={availableTimeSlots.length === 0}
                interface="action-sheet"
                justify="end"
              >
                {availableTimeSlots.map((time) => (
                  <IonSelectOption
                    key={time}
                    value={time}
                    className="time-option"
                  >
                    {time}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            {availableTimeSlots.length === 0 && (
              <div className="no-slots-container">
                <IonText className="no-slots-message">
                  No available time slots for today. Please use Schedule Pickup
                  option.
                </IonText>
              </div>
            )}
          </div>
        )}

        {/* If Schedule Pickup is selected */}
        {pickupOption === "later" && (
          <div className="schedule-form-container">
            <IonItem className="date-selection-item">
              <IonLabel className="selection-label">Date</IonLabel>
              <IonText slot="end" color="medium">
                {pickupDate ? formatDateToDisplay(pickupDate) : "Tomorrow"}
              </IonText>
            </IonItem>

            <IonItem className="time-selection-item">
              <IonLabel className="selection-label">Pick a Time</IonLabel>
              <IonSelect
                className="time-select"
                placeholder="Select Time"
                value={pickupTime}
                onIonChange={(e) => {
                  setPickupTime(e.detail.value);
                  localStorage.setItem("pickupTime", e.detail.value);
                }}
                disabled={availableTimeSlots.length === 0}
                interface="action-sheet"
                justify="end"
              >
                {availableTimeSlots.map((time) => (
                  <IonSelectOption
                    key={time}
                    value={time}
                    className="time-option"
                  >
                    {time}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            {availableTimeSlots.length === 0 && (
              <div className="no-slots-container">
                <IonText className="no-slots-message">
                  No available time slots for tomorrow.
                </IonText>
              </div>
            )}
          </div>
        )}
      </IonContent>

      <IonFooter>
        <IonToolbar>
          <div className="modal-footer-buttons">
            <IonButton
              className="footer-back-action-button"
              routerLink="/home/cart"
              fill="outline"
              onClick={() => {
                // Reset schedule-related data when going back to cart
                localStorage.removeItem("pickupOption");
                localStorage.removeItem("pickupDate");
                localStorage.removeItem("pickupTime");
              }}
            >
              <IonIcon icon={chevronBackCircleOutline} slot="start" />
              Back
            </IonButton>

            <IonButton
              className="footer-action-button payment-button"
              disabled={!pickupTime}
              onClick={nextStep}
              routerLink="/home/cart/schedule/payment"
            >
              <IonIcon icon={card} slot="start" />
              Payment
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>

      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header={alertHeader}
        message={alertMessage}
        buttons={["OK"]}
      />
    </IonPage>
  );
};

export default Schedule;
