import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [signupInProgress, setSignupInProgress] = useState(false);

  return (
    <AuthContext.Provider value={{ signupInProgress, setSignupInProgress }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
