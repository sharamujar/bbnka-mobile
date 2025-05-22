import React from "react";
import "./TimeSlotChip.css";

interface TimeSlotChipProps {
  timeSlot: string;
  isSelected: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

const TimeSlotChip: React.FC<TimeSlotChipProps> = ({
  timeSlot,
  isSelected,
  isDisabled = false,
  onClick,
}) => {
  return (
    <div
      className={`time-slot-chip ${isSelected ? "selected" : ""} ${
        isDisabled ? "disabled" : ""
      }`}
      onClick={isDisabled ? undefined : onClick}
    >
      {timeSlot}
    </div>
  );
};

export default TimeSlotChip;
