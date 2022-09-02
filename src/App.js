import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./components/home_page";
import Login from "./components/login";
import School from "./components/school";
import Teachers from "./components/teachers";
import Recipes from "./components/recipes";
import Chat from "./components/chat";
import Test from "./components/test";
import LivePlayer from "./components/live_player";
import { UserContext } from "./user_context";
import { default as SnackbarProvider } from "./components/snackbar";
import { ClassUsersProvider } from "./components/use_class_users";
import "./components/normalize.css";
export default function App(props) {
  const updateUser = (user) => {
    setUserContext({ ...userContext, user: user });
  };

  const [userContext, setUserContext] = React.useState({
    user: props.userCookie,
    updateUser: updateUser
  });

  console.log(userContext);
  return (
    <UserContext.Provider value={userContext}>
      <SnackbarProvider>
        <ClassUsersProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  userContext.user.is_login ? (
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
                  userContext.user.is_login ? (
                    <Chat />
                  ) : (
                    <Navigate to="/login" state={{ from: "/chat" }} />
                  )
                }
              />
              <Route
                path="/player"
                element={
                  userContext.user.is_login ? (
                    <LivePlayer />
                  ) : (
                    <Navigate to="/login" state={{ from: "/player" }} />
                  )
                }
              />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/test" element={<Test />} />
            </Routes>
          </BrowserRouter>
        </ClassUsersProvider>
      </SnackbarProvider>
    </UserContext.Provider>
  );
}
