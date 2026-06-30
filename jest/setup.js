// Mock the native AsyncStorage module so anything that transitively imports it
// (e.g. services/firebase) can load under jest.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
