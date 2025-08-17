// Feature Flags for Safe Development
// This allows us to enable/disable features without breaking the kitchen app

export const FEATURE_FLAGS = {
  // Multi-room expansion features
  MULTI_ROOM: process.env.NEXT_PUBLIC_ENABLE_MULTI_ROOM === 'true',
  ROOM_SELECTOR: process.env.NEXT_PUBLIC_ENABLE_ROOM_SELECTOR === 'true',
  ROOM_MANAGEMENT: process.env.NEXT_PUBLIC_ENABLE_ROOM_MANAGEMENT === 'true',
  
  // Kitchen-specific features (always enabled)
  KITCHEN_FEATURES: true,
  BARCODE_SCANNING: true,
  SHOPPING_LIST: true,
  HOUSEHOLD_MANAGEMENT: true,
  
  // Development features
  DEBUG_MODE: process.env.NODE_ENV === 'development',
} as const;

// Helper functions for feature checks
export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature];
};

export const isKitchenOnly = (): boolean => {
  return !FEATURE_FLAGS.MULTI_ROOM;
};

export const isMultiRoomEnabled = (): boolean => {
  return FEATURE_FLAGS.MULTI_ROOM;
};

// Safe defaults - if environment variables aren't set, features are disabled
export const getDefaultFeatures = () => ({
  multiRoom: false,
  roomSelector: false,
  roomManagement: false,
  kitchenFeatures: true,
  barcodeScanning: true,
  shoppingList: true,
  householdManagement: true,
});

// Feature groups for easier management
export const FEATURE_GROUPS = {
  KITCHEN_CORE: ['KITCHEN_FEATURES', 'BARCODE_SCANNING', 'SHOPPING_LIST', 'HOUSEHOLD_MANAGEMENT'],
  ROOM_EXPANSION: ['MULTI_ROOM', 'ROOM_SELECTOR', 'ROOM_MANAGEMENT'],
} as const;

// Check if all features in a group are enabled
export const isFeatureGroupEnabled = (group: keyof typeof FEATURE_GROUPS): boolean => {
  return FEATURE_GROUPS[group].every(feature => isFeatureEnabled(feature));
};

// Development helper to log feature status
export const logFeatureStatus = () => {
  if (FEATURE_FLAGS.DEBUG_MODE) {
    console.log('🔧 Feature Flags Status:', FEATURE_FLAGS);
  }
};
