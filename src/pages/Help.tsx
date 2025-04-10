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
} from "@ionic/react";
import {
  helpCircleOutline,
  chatbubbleOutline,
  callOutline,
  mailOutline,
  logoWhatsapp,
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

  const handleSubmitMessage = async () => {
    const user = auth.currentUser;
    if (!contactMessage) {
      setToastMessage("Please enter a message");
      setShowToast(true);
      return;
    }

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
    }
  };

  return (
    <IonPage>
      <IonHeader className="help-header ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/account" />
          </IonButtons>
          <IonTitle>Help & Support</IonTitle>
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
                  <IonIcon icon={chevronDown} slot="end" className="faq-icon" />
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
                  <IonIcon icon={chevronDown} slot="end" className="faq-icon" />
                </IonItem>
                <div slot="content" className="faq-content">
                  <p>
                    To cancel an order, go to the Orders tab, select the order
                    you wish to cancel, and tap the "Cancel Order" button. Note
                    that orders can only be cancelled within 15 minutes of
                    placing or before they are marked as "preparing".
                  </p>
                </div>
              </IonAccordion>

              <IonAccordion value="third">
                <IonItem slot="header" lines="none" className="faq-item">
                  <IonLabel>What payment methods are accepted?</IonLabel>
                  <IonIcon icon={chevronDown} slot="end" className="faq-icon" />
                </IonItem>
                <div slot="content" className="faq-content">
                  <p>
                    We currently accept GCash for online payments. Cash on
                    delivery is also available for select locations.
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
                  <p>+63 912 345 6789</p>
                </IonLabel>
              </IonItem>
              <IonItem
                lines="full"
                className="contact-item"
                href="mailto:support@bbnka.com"
              >
                <IonIcon
                  icon={mailOutline}
                  slot="start"
                  className="contact-icon"
                />
                <IonLabel>
                  <h3>Email</h3>
                  <p>support@bbnka.com</p>
                </IonLabel>
              </IonItem>
              <IonItem
                lines="none"
                className="contact-item"
                href="https://wa.me/639123456789"
              >
                <IonIcon
                  icon={logoWhatsapp}
                  slot="start"
                  className="contact-icon"
                />
                <IonLabel>
                  <h3>WhatsApp</h3>
                  <p>+63 912 345 6789</p>
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
                123 Main Street, Barangay Example
                <br />
                Quezon City, Metro Manila
                <br />
                Philippines
              </p>
              <p className="location-hours">
                <strong>Opening Hours:</strong>
                <br />
                Monday - Saturday: 8:00 AM - 8:00 PM
                <br />
                Sunday: 9:00 AM - 5:00 PM
              </p>
              <IonButton
                expand="block"
                className="location-map-button"
                href="https://maps.google.com/?q=Quezon+City,Philippines"
                target="_blank"
              >
                View on Map
              </IonButton>
            </div>
          </div>

          <div className="help-section">
            <h2 className="help-section-title">
              <IonIcon icon={documentTextOutline} />
              Send a Message
            </h2>
            <div className="message-form">
              <IonItem lines="full" className="message-input">
                <IonLabel position="floating">Your Name</IonLabel>
                <IonInput
                  value={contactName}
                  onIonChange={(e) => setContactName(e.detail.value || "")}
                />
              </IonItem>
              <IonItem lines="full" className="message-input">
                <IonLabel position="floating">Email Address</IonLabel>
                <IonInput
                  type="email"
                  value={contactEmail}
                  onIonChange={(e) => setContactEmail(e.detail.value || "")}
                />
              </IonItem>
              <IonItem lines="none" className="message-input">
                <IonLabel position="floating">Message</IonLabel>
                <IonTextarea
                  rows={4}
                  value={contactMessage}
                  onIonChange={(e) => setContactMessage(e.detail.value || "")}
                />
              </IonItem>
              <IonButton
                expand="block"
                className="send-message-button"
                onClick={handleSubmitMessage}
              >
                Send Message
                <IonIcon icon={send} slot="end" />
              </IonButton>
            </div>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default Help;
