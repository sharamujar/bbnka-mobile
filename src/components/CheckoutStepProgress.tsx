import React from "react";
import { IonGrid, IonRow, IonCol, IonIcon } from "@ionic/react";
import { checkmark } from "ionicons/icons";
import "./CheckoutStepProgress.css";

interface CheckoutStepProgressProps {
  currentStep: number;
}

const CheckoutStepProgress: React.FC<CheckoutStepProgressProps> = ({
  currentStep,
}) => {
  const steps = ["Schedule", "Payment", "Confirmation"];

  return (
    <IonGrid className="step-progress">
      <IonRow className="step-row">
        {steps.map((step, index) => (
          <IonCol key={index} className="step-col">
            {/* Step Circle */}
            <div
              className={`step-circle ${
                currentStep > index
                  ? "completed"
                  : currentStep === index
                  ? "active"
                  : ""
              }`}
            >
              {currentStep > index ? (
                <IonIcon icon={checkmark} />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>

            {/* Step Label */}
            <div
              className={`step-label ${
                currentStep === index ? "active-label" : ""
              }`}
            >
              {step}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`step-line ${
                  currentStep > index ? "completed-line" : ""
                }`}
              ></div>
            )}
          </IonCol>
        ))}
      </IonRow>
    </IonGrid>
  );
};

export default CheckoutStepProgress;
