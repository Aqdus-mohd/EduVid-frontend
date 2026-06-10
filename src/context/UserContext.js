import { createContext, useState, useEffect } from "react";

const UserContext = createContext({});

export function UserContextProvider({ children }) {

  const [userInfo, setUserInfo] = useState(() => {
    const savedUser = localStorage.getItem('userInfo');
    // IF savedUser exists, parse it. IF NOT, it MUST equal strictly null!
    return savedUser && savedUser !== "undefined" ? JSON.parse(savedUser) : null; 
  });

  // 1. THIS IS THE MISSING PIECE
  // When the app starts (or refreshes), check localStorage for saved data
  useEffect(() => {
    const storedUser = localStorage.getItem("userInfo");

    // console.log("SPY 2 - Raw Storage:", storedUser);

    if (storedUser) {
      try {
        // Parse the JSON string back into an object
        console.log("SPY 2 - Parsed User in Context:", (JSON.parse(storedUser)));
        setUserInfo(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse user info:", err);
        localStorage.removeItem("userInfo"); // Clear bad data
      }
    }
  }, []);

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo }}>
      {children}
    </UserContext.Provider>
  );
}

export default UserContext;