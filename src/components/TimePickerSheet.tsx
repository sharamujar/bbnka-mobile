import React from "react";
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonText,
} from "@ionic/react";
import { timeOutline } from "ionicons/icons";
import TimeSlotChip from "./TimeSlotChip";
import "./TimePickerSheet.css";

interface TimePickerSheetProps {
  availableTimeSlots: string[];
  selectedTime: string;
  onTimeSelected: (time: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const TimePickerSheet: React.FC<TimePickerSheetProps> = ({
  availableTimeSlots,
  selectedTime,
  onTimeSelected,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  // Group time slots into morning, afternoon, and evening
  const morningSlots = availableTimeSlots.filter((slot) => {
    const startTime = slot.split(" - ")[0];
    return startTime.includes("AM");
  });

  const afternoonSlots = availableTimeSlots.filter((slot) => {
    const startTime = slot.split(" - ")[0];
    return startTime.includes("PM") && parseInt(startTime.split(":")[0]) < 5;
  });

  const eveningSlots = availableTimeSlots.filter((slot) => {
    const startTime = slot.split(" - ")[0];
    return startTime.includes("PM") && parseInt(startTime.split(":")[0]) >= 5;
  });

  return (
    <div className="time-picker-sheet-overlay" onClick={onClose}>
      <div className="time-picker-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="time-picker-header">
          <div className="time-picker-pill"></div>
          <div className="time-picker-title">
            <IonIcon icon={timeOutline} className="time-icon" />
            <h2>Select a Time</h2>
          </div>
          <IonButton fill="clear" className="close-button" onClick={onClose}>
            Done
          </IonButton>
        </div>

        <div className="time-picker-content">
          {availableTimeSlots.length === 0 ? (
            <div className="no-slots-container">
              <IonText className="no-slots-message">
                No available time slots for the selected date.
              </IonText>
            </div>
          ) : (
            <>
              {morningSlots.length > 0 && (
                <div className="time-section">
                  <h3 className="time-section-title">Morning</h3>
                  <div className="time-slots-grid">
                    {morningSlots.map((slot) => (
                      <TimeSlotChip
                        key={slot}
                        timeSlot={slot}
                        isSelected={selectedTime === slot}
                        onClick={() => onTimeSelected(slot)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {afternoonSlots.length > 0 && (
                <div className="time-section">
                  <h3 className="time-section-title">Afternoon</h3>
                  <div className="time-slots-grid">
                    {afternoonSlots.map((slot) => (
                      <TimeSlotChip
                        key={slot}
                        timeSlot={slot}
                        isSelected={selectedTime === slot}
                        onClick={() => onTimeSelected(slot)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {eveningSlots.length > 0 && (
                <div className="time-section">
                  <h3 className="time-section-title">Evening</h3>
                  <div className="time-slots-grid">
                    {eveningSlots.map((slot) => (
                      <TimeSlotChip
                        key={slot}
                        timeSlot={slot}
                        isSelected={selectedTime === slot}
                        onClick={() => onTimeSelected(slot)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimePickerSheet;
