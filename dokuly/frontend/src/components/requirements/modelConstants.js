// Possible types for the model
export const REQUIREMENT_TYPES = [
  "Functional",
  "Performance",
  "Usability",
  "Interface",
  "Operational",
  "Modes & States",
  "Adaptability",
  "Physical Constraint",
  "Design Constraint",
  "Environmental",
  "Logistical",
  "Policy & Regulation",
  "Cost Constraint",
  "Schedule Constraint",
  "Reliability",
  "Safety",
  "Security",
];

// Possible verification classes for the model
export const VERIFICATION_CLASSES = [
  "Inspection",
  "Analysis",
  "Analogy or Similarity",
  "Demonstration",
  "Test",
  "Sampling",
];

// Possible verification classes for the model
export const REQRUIREMENT_STATES = [
  { state: "Draft", badge: "badge-warning" },
  { state: "Review", badge: "badge-warning" },
  { state: "Approved", badge: "badge-success" },
  { state: "Rejected", badge: "badge-danger" },
  //{ state: "Verified", badge: "badge-success" },  // Use is_approved instead
  //{ state: "Not Compliant", badge: "badge-danger" } // Use is_approved instead
];

export const OBLIGATION_LEVELS = ["Shall", "Should"];

// Export as grouped constants if needed elsewhere
export default {
  REQUIREMENT_TYPES,
  VERIFICATION_CLASSES,
  REQRUIREMENT_STATES,
};
