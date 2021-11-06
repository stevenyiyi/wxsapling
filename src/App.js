import "./styles.css";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./components/home_page";
import Login from "./components/login";
import School from "./components/school";
import Teachers from "./components/teachers";
import Recipes from "./components/recipes";
import Chat from "./components/chat";
import { UserContext } from "./user_context";
import SnackbarProvider from "react-simple-snackbar";
export default function App(props) {
  const updateUser = (user) => {
    setUserContext({ ...userContext, user: user });
  };

  const [userContext, setUserContext] = React.useState({
    user: props.user,
    updateUser: updateUser
  });

  return (
    <UserContext.Provider value={userContext}>
      <SnackbarProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                userContext.user.username ? (
                  <HomePage />
                ) : (
                  <Navigate to="/login" state={{ from: "/" }} />
                )
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/school" element={<School />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route
              path="/chat"
              element={
                userContext.user.username ? (
                  <Chat />
                ) : (
                  <Navigate to="/login" state={{ from: "/chat" }} />
                )
              }
            />
            <Route path="/recipes" element={<Recipes />} />
          </Routes>
        </BrowserRouter>
      </SnackbarProvider>
    </UserContext.Provider>
  );
}
