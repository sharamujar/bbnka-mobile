import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonImg,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
} from "@ionic/react";
import {
  informationCircleOutline,
  mailOutline,
  callOutline,
  globeOutline,
  locationOutline,
  logoFacebook,
  logoInstagram,
  shieldCheckmarkOutline,
} from "ionicons/icons";
import "./About.css";

const About: React.FC = () => {
  const appVersion = "1.0.0"; // Replace with actual app version

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/account" />
          </IonButtons>
          <IonTitle>About BBNKA</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="about-page">
        <div className="about-wrapper">
          <div className="about-container">
            <div className="about-logo-container">
              <IonImg
                src="/assets/icon/favicon.png"
                alt="BBNKA Logo"
                className="about-logo"
              />
              <h1 className="about-app-name">BBNKA</h1>
              {/* <p className="about-app-version">Version {appVersion}</p> */}
            </div>

            <div className="about-section">
              <h2 className="about-section-title">
                <IonIcon
                  icon={informationCircleOutline}
                  className="about-section-icon"
                />
                Our Mission
              </h2>
              <p className="about-description">
                At BBNKA, our mission is to bring the flavors of tradition
                closer to you through a simple and seamless mobile ordering
                experience. We’re here to support local pride and make your
                favorite treats just a few taps away.
              </p>
            </div>

            {/* <div className="about-section">
              <h2 className="about-section-title">
                <IonIcon
                  icon={shieldCheckmarkOutline}
                  className="about-section-icon"
                />
                Security & Privacy
              </h2>
              <p className="about-description">
                Your security is our priority. BBNKA Mobile employs
                state-of-the-art security measures to protect your financial
                information and transactions. All data is encrypted using
                industry-standard protocols, and we continuously update our
                security practices to safeguard your account.
              </p>
            </div> */}

            {/* <div className="about-section">
              <h2 className="about-section-title">Contact Us</h2>
              <IonList lines="none" className="about-contact-list">
                <IonItem className="about-contact-item">
                  <IonIcon
                    icon={callOutline}
                    slot="start"
                    className="about-contact-icon"
                  />
                  <IonLabel>
                    <h3>Customer Service</h3>
                    <p>+63 (2) 8888-9999</p>
                  </IonLabel>
                </IonItem>

                <IonItem className="about-contact-item">
                  <IonIcon
                    icon={mailOutline}
                    slot="start"
                    className="about-contact-icon"
                  />
                  <IonLabel>
                    <h3>Email Support</h3>
                    <p>support@bbnka.com</p>
                  </IonLabel>
                </IonItem>

                <IonItem className="about-contact-item">
                  <IonIcon
                    icon={globeOutline}
                    slot="start"
                    className="about-contact-icon"
                  />
                  <IonLabel>
                    <h3>Website</h3>
                    <p>www.bbnka.com</p>
                  </IonLabel>
                </IonItem>

                <IonItem className="about-contact-item">
                  <IonIcon
                    icon={locationOutline}
                    slot="start"
                    className="about-contact-icon"
                  />
                  <IonLabel>
                    <h3>Head Office</h3>
                    <p>123 Banking Avenue, Makati City, Philippines</p>
                  </IonLabel>
                </IonItem>
              </IonList>
            </div> */}

            <div className="about-section">
              <h2 className="about-section-title">Connect With Us</h2>
              <div className="about-social-container">
                <a
                  href="https://facebook.com"
                  className="about-social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IonIcon icon={logoFacebook} className="about-social-icon" />
                </a>
                <a
                  href="https://instagram.com"
                  className="about-social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IonIcon icon={logoInstagram} className="about-social-icon" />
                </a>
              </div>
            </div>

            <div className="about-footer">
              <p>© {new Date().getFullYear()} BBNKA. All rights reserved.</p>
              <div className="about-footer-links">
                <a href="#">Terms of Service</a>
                <span className="about-footer-divider">|</span>
                <a href="#">Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default About;
