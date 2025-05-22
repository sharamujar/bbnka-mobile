// Helper functions for stock management

/**
 * Safely rounds a number down to an integer
 * @param value The number to round
 * @returns Integer rounded down from the value
 */
export const roundStock = (value: number | undefined | null): number => {
  if (value === undefined || value === null) {
    return 0;
  }
  return Math.floor(value);
};

/**
 * Determines the standardized product type from size name or type
 * @param sizeName The name of the size
 * @param existingType Optional existing type to preserve if valid
 * @returns Standardized product type (small, solo, tray, bilao)
 */
export const determineProductType = (
  sizeName: string | null | undefined,
  existingType?: string | null
): string => {
  // If there's an existing valid type, preserve it
  if (existingType) {
    const lowerType = existingType.toLowerCase();
    if (["small", "solo", "tray", "bilao"].includes(lowerType)) {
      return lowerType;
    }
  }

  // If no size name provided, return default
  if (!sizeName) return "bilao";

  // Convert size name to lowercase for comparison
  const lowerSizeName = sizeName.toLowerCase();

  // Determine type based on size name
  if (lowerSizeName.includes("small")) {
    return "small";
  } else if (lowerSizeName.includes("solo")) {
    return "solo";
  } else if (
    lowerSizeName.includes("tray") ||
    lowerSizeName.includes("half-tray")
  ) {
    return "tray";
  } else if (lowerSizeName.includes("bilao")) {
    return "bilao";
  }

  // Default type if none of the above matched
  return "bilao";
};

/**
 * Gets the appropriate color for stock levels
 * @param quantity Current stock quantity
 * @param critical Critical threshold
 * @param minimum Minimum threshold
 * @returns Color class name
 */
export const getStockColor = (
  quantity: number,
  critical = 5,
  minimum = 10
): string => {
  const roundedQuantity = roundStock(quantity);
  if (roundedQuantity <= critical) {
    return "danger";
  } else if (roundedQuantity <= minimum) {
    return "warning";
  }
  return "success";
};
