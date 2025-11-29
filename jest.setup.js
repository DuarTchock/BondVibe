import "@testing-library/jest-native/extend-expect";

// Mock Firebase completamente
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));

jest.mock("./src/services/firebase", () => ({
  auth: {
    currentUser: { uid: "test-user-id" },
  },
  db: {},
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock expo-status-bar
jest.mock("expo-status-bar", () => ({
  StatusBar: "StatusBar",
}));

// Mock React Navigation
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

// Suppress console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
