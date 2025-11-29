module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?@?react-native|@react-native-community|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|firebase|@firebase/.*)",
  ],
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/**/*.test.{js,jsx}",
    "!src/**/__tests__/**",
  ],
  testMatch: ["**/__tests__/**/*.test.{js,jsx}", "**/*.test.{js,jsx}"],
  moduleNameMapper: {
    "^firebase/(.*)$": "<rootDir>/node_modules/firebase/$1",
  },
};
