import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonInput,
  IonTextarea,
  IonToast,
  IonSpinner,
} from "@ionic/react";
import {
  helpCircleOutline,
  chatbubbleOutline,
  callOutline,
  mailOutline,
  chevronDown,
  navigateOutline,
  documentTextOutline,
  send,
} from "ionicons/icons";
import { auth, db } from "../firebase-config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./Help.css";

const Help: React.FC = () => {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmitMessage = async () => {
    const user = auth.currentUser;
    if (!contactMessage) {
      setToastMessage("Please enter a message");
      setShowToast(true);
      return;
    }

    setIsSending(true);

    try {
      await addDoc(collection(db, "contactMessages"), {
        userId: user?.uid || "guest",
        name: contactName || user?.displayName || "Anonymous",
        email: contactEmail || user?.email || "",
        message: contactMessage,
        timestamp: serverTimestamp(),
        status: "pending",
      });

      setContactName("");
      setContactEmail("");
      setContactMessage("");
      setToastMessage("Message sent successfully");
      setShowToast(true);
    } catch (error) {
      console.error("Error sending message:", error);
      setToastMessage("Failed to send message");
      setShowToast(true);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className="help-header ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/account" />
          </IonButtons>
          <IonTitle>Help Center</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="help-content">
        <div className="help-container">
          <div className="help-section">
            <h2 className="help-section-title">
              <IonIcon icon={helpCircleOutline} />
              Frequently Asked Questions
            </h2>
            <IonAccordionGroup className="faq-accordion">
              <IonAccordion value="first">
                <IonItem slot="header" lines="none" className="faq-item">
                  <IonLabel>How do I track my order?</IonLabel>
                </IonItem>
                <div slot="content" className="faq-content">
                  <p>
                    You can track your order by going to the Orders tab and
                    selecting your order. There you will see real-time updates
                    on the status of your order.
                  </p>
                </div>
              </IonAccordion>

              <IonAccordion value="second">
                <IonItem slot="header" lines="none" className="faq-item">
                  <IonLabel>How can I cancel my order?</IonLabel>
                </IonItem>
                <div slot="content" className="faq-content">
                  <p>
                    To cancel an order, go to the Orders tab, select the order
                    you wish to cancel, and tap the "Cancel Order" button. Note
                    that orders can only be cancelled before they are marked as
                    "Preparing".
                  </p>
                </div>
              </IonAccordion>

              <IonAccordion value="third">
                <IonItem slot="header" lines="none" className="faq-item">
                  <IonLabel>What payment methods are accepted?</IonLabel>
                </IonItem>
                <div slot="content" className="faq-content">
                  <p>
                    We currently accept GCash for online payments and Cash for
                    pickup.
                  </p>
                </div>
              </IonAccordion>
            </IonAccordionGroup>
          </div>

          <div className="help-section">
            <h2 className="help-section-title">
              <IonIcon icon={chatbubbleOutline} />
              Contact Us
            </h2>
            <IonList className="contact-list">
              <IonItem
                lines="full"
                className="contact-item"
                href="tel:+639123456789"
              >
                <IonIcon
                  icon={callOutline}
                  slot="start"
                  className="contact-icon"
                />
                <IonLabel>
                  <h3>Phone</h3>
                  <p>(02) 8655 0029</p>
                </IonLabel>
              </IonItem>
            </IonList>
          </div>

          <div className="help-section">
            <h2 className="help-section-title">
              <IonIcon icon={navigateOutline} />
              Visit Us
            </h2>
            <div className="location-info">
              <p className="location-address">
                102 Bonifacio Avenue, Cainta, 1900 Rizal
              </p>
              <p className="location-hours">
                <strong>Opening Hours:</strong>
                <br />
                Monday - Sunday | 4:00 AM - 6:00 PM
              </p>
              <IonButton
                expand="block"
                className="location-map-button"
                href="https://maps.app.goo.gl/hYEa3gbXaYRedCho7"
                target="_blank"
              >
                View on Map
              </IonButton>
            </div>
          </div>

          {/* <div className="help-section">
            <h2 className="help-section-title">
              <IonIcon icon={documentTextOutline} />
              Send a Message
            </h2>
            <div className="message-form">
              <IonItem lines="full" className="message-input">
                <IonLabel position="stacked">Your Name</IonLabel>
                <IonInput
                  value={contactName}
                  placeholder="Enter your name"
                  onIonChange={(e) => setContactName(e.detail.value || "")}
                  className="input-field"
                />
              </IonItem>
              <IonItem lines="full" className="message-input">
                <IonLabel position="stacked">Email Address</IonLabel>
                <IonInput
                  type="email"
                  value={contactEmail}
                  placeholder="Enter your email"
                  onIonChange={(e) => setContactEmail(e.detail.value || "")}
                  className="input-field"
                />
              </IonItem>
              <IonItem lines="none" className="message-input">
                <IonLabel position="stacked">Message</IonLabel>
                <IonTextarea
                  rows={4}
                  value={contactMessage}
                  placeholder="How can we help you?"
                  onIonChange={(e) => setContactMessage(e.detail.value || "")}
                  className="input-field"
                />
              </IonItem>
              <IonButton
                expand="block"
                className="send-message-button"
                onClick={handleSubmitMessage}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    Sending...
                    <IonSpinner name="dots" slot="end" />
                  </>
                ) : (
                  <>
                    Send Message
                    <IonIcon icon={send} slot="end" />
                  </>
                )}
              </IonButton>
            </div>
          </div> */}
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
          color={toastMessage.includes("success") ? "success" : "danger"}
        />
      </IonContent>
    </IonPage>
  );
};

export default Help;
