import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonFooter,
  IonButton,
  IonIcon,
  IonAlert,
  IonText,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import {
  card,
  chevronBackCircleOutline,
  chevronForwardCircle,
} from "ionicons/icons";
import dayjs from "dayjs";
import CheckoutStepProgress from "../components/CheckoutStepProgress";
import "./Schedule.css";

const Schedule: React.FC = () => {
  const history = useHistory();

  const [scheduleType, setScheduleType] = useState<"now" | "later">("later");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep((prevStep) => prevStep + 1);
      const routes = ["/home/cart/schedule", "/home/cart/schedule/payment"];
      history.replace(routes[currentStep + 1]);
    }
  };

  // All possible time slots
  const allTimeSlots = [
    "04:00 AM",
    "06:00 AM",
    "08:00 AM",
    "10:00 AM",
    "12:00 PM",
    "02:00 PM",
    "04:00 PM",
    "06:00 PM",
  ];

  useEffect(() => {
    if (scheduleType === "now") {
      calculateScheduleNow();
    }
  }, [scheduleType]);

  // Update available time slots whenever pickup date changes
  useEffect(() => {
    if (pickupDate) {
      updateAvailableTimeSlots(pickupDate);
    }
  }, [pickupDate]);

  // Clear pickup time when available time slots change
  useEffect(() => {
    // Clear the selected time if it's no longer in the available time slots
    if (pickupTime && !availableTimeSlots.includes(pickupTime)) {
      setPickupTime("");
    }
  }, [availableTimeSlots, pickupTime]);

  const calculateScheduleNow = () => {
    const now = dayjs();
    const lastOrderTime = now.hour(17).minute(55); // 5:55 PM cutoff

    let scheduledDate = now.format("YYYY-MM-DD");
    let scheduledTime = "";

    if (now.isAfter(lastOrderTime)) {
      scheduledDate = now.add(1, "day").format("YYYY-MM-DD");
      scheduledTime = "04:00 AM";
      setShowAlert(true);
    } else {
      let minutes = now.minute();
      let nextMinutes = minutes < 30 ? 30 : 0;
      let nextHour = nextMinutes === 0 ? now.hour() + 1 : now.hour();

      if (nextHour >= 18) {
        scheduledDate = now.add(1, "day").format("YYYY-MM-DD");
        scheduledTime = "04:00 AM";
        setShowAlert(true);
      } else {
        scheduledTime = dayjs()
          .hour(nextHour)
          .minute(nextMinutes)
          .format("hh:mm A");
      }
    }

    setPickupDate(scheduledDate);
    setPickupTime(scheduledTime);
  };

  const updateAvailableTimeSlots = (selectedDate: string) => {
    const today = dayjs().format("YYYY-MM-DD");
    const now = dayjs();

    // If selected date is today, filter out past time slots
    if (selectedDate === today) {
      const availableSlots = allTimeSlots.filter((slot) => {
        const [time, period] = slot.split(" ");
        const [hourStr, minuteStr] = time.split(":");
        let hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        // Convert to 24-hour format
        if (period === "PM" && hour < 12) {
          hour += 12;
        } else if (period === "AM" && hour === 12) {
          hour = 0;
        }

        // Check if the time slot is in the future
        // Adding a buffer of 1 hour to ensure it's not too close to current time
        const slotTime = dayjs().hour(hour).minute(minute);
        return slotTime.isAfter(now.add(1, "hour"));
      });

      setAvailableTimeSlots(availableSlots);
    } else {
      // For future dates, all time slots are available
      setAvailableTimeSlots(allTimeSlots);
    }
  };

  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      dates.push(futureDate.toISOString().split("T")[0]);
    }
    return dates;
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

        {scheduleType === "later" && (
          <div className="schedule-form-container">
            <IonItem className="date-selection-item">
              <IonLabel className="selection-label">Pick a Date</IonLabel>
              <IonSelect
                className="date-select"
                placeholder="Select Date"
                value={pickupDate}
                onIonChange={(e) => setPickupDate(e.detail.value)}
              >
                {generateAvailableDates().map((date) => (
                  <IonSelectOption
                    key={date}
                    value={date}
                    className="date-option"
                  >
                    {new Date(date).toDateString()}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem className="time-selection-item">
              <IonLabel className="selection-label">Pick a Time</IonLabel>
              <IonSelect
                className="time-select"
                placeholder="Select Time"
                value={pickupTime}
                onIonChange={(e) => setPickupTime(e.detail.value)}
                disabled={!pickupDate || availableTimeSlots.length === 0}
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

            {pickupDate && availableTimeSlots.length === 0 && (
              <div className="no-slots-container">
                <IonText className="no-slots-message">
                  No available time slots for today. Please select a different
                  date.
                </IonText>
              </div>
            )}
          </div>
        )}
      </IonContent>

      <IonFooter>
        <IonToolbar className="product-footer">
          <div className="footer-content">
            <div className="footer-back-action-button-container">
              <IonButton
                className="footer-back-action-button"
                routerLink="/home/cart"
                fill="outline"
              >
                <IonIcon icon={chevronBackCircleOutline} slot="start" />
                Back to Cart
              </IonButton>
            </div>
            <div className="footer-action-button-container">
              <IonButton
                className="footer-action-button"
                disabled={
                  scheduleType === "later" && (!pickupDate || !pickupTime)
                }
                onClick={nextStep}
                routerLink="/home/cart/schedule/payment"
              >
                <IonIcon icon={card} slot="start" />
                <IonIcon icon={chevronForwardCircle} slot="end" />
                Payment
              </IonButton>
            </div>
          </div>
        </IonToolbar>
      </IonFooter>

      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Scheduled for Tomorrow"
        message="Your pickup is set for 4:00 AM tomorrow as the store is closing soon."
        buttons={["OK"]}
      />
    </IonPage>
  );
};

export default Schedule;
