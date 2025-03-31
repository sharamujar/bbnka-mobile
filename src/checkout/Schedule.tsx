import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonAlert,
  IonFooter,
  IonIcon,
} from "@ionic/react";
import dayjs from "dayjs";
import "../components/CheckoutStepProgress";
import CheckoutStepProgress from "../components/CheckoutStepProgress";
import "./Schedule.css";
import { useHistory } from "react-router";
import {
  arrowBack,
  arrowBackCircle,
  arrowBackCircleOutline,
  arrowBackCircleSharp,
  arrowBackSharp,
  card,
  chevronBackCircle,
  chevronBackCircleOutline,
  chevronForwardCircle,
} from "ionicons/icons";

const Schedule: React.FC = () => {
  const history = useHistory();

  const [scheduleType, setScheduleType] = useState<"now" | "later">("now");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("");
  const [showAlert, setShowAlert] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep((prevStep) => prevStep + 1);
      const routes = ["/home/cart/schedule", "/home/cart/schedule/payment"];
      history.replace(routes[currentStep + 1]);
    }
  };

  useEffect(() => {
    if (scheduleType === "now") {
      calculateScheduleNow();
    }
  }, [scheduleType]);

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

  const timeSlots = [
    "04:00 AM",
    "06:00 AM",
    "08:00 AM",
    "10:00 AM",
    "12:00 PM",
    "02:00 PM",
    "04:00 PM",
    "06:00 PM",
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Schedule</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <CheckoutStepProgress currentStep={currentStep} />
        <IonSegment
          value={scheduleType}
          onIonChange={(e) =>
            setScheduleType(e.detail.value as "now" | "later")
          }
        >
          <IonSegmentButton value="now">
            <IonLabel>Schedule Now</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="later">
            <IonLabel>Schedule Later</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {scheduleType === "now" && (
          <IonItem>
            <IonLabel>
              <strong>Pickup Time:</strong> {pickupDate} at {pickupTime}
            </IonLabel>
          </IonItem>
        )}

        {scheduleType === "later" && (
          <>
            <IonItem>
              <IonLabel>Pick a Date</IonLabel>
              <IonSelect
                placeholder="Select Date"
                onIonChange={(e) => setPickupDate(e.detail.value)}
              >
                {generateAvailableDates().map((date) => (
                  <IonSelectOption key={date} value={date}>
                    {new Date(date).toDateString()}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel>Pick a Time</IonLabel>
              <IonSelect
                placeholder="Select Time"
                onIonChange={(e) => setPickupTime(e.detail.value)}
              >
                {timeSlots.map((time) => (
                  <IonSelectOption key={time} value={time}>
                    {time}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          </>
        )}
      </IonContent>

      <IonFooter>
        <IonToolbar className="product-footer">
          <div className="footer-content">
            <div className="footer-back-action-button-container">
              {/* Back to Cart Button */}
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
              {/* Payment Button */}
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
