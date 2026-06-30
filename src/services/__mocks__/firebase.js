// Manual mock for services/firebase — avoids loading the real module (which
// pulls AsyncStorage / expo-constants native config) during jest automock.
export const auth = { currentUser: { uid: "test-uid" } };
export const db = {};
export const storage = {};
export default { auth, db, storage };
