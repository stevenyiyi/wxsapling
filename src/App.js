import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/login";
import HeaderBar from "./components/headerbar";
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

  const updateUseNavbar = (f) => {
    setUserContext({ ...userContext, useNavbar: f });
  };

  const [userContext, setUserContext] = React.useState({
    user: props.userCookie,
    updateUser: updateUser,
    updateUseNavbar: updateUseNavbar,
    useNavbar: false
  });

  console.log(userContext);
  return (
    <UserContext.Provider value={userContext}>
      <SnackbarProvider>
        <ClassUsersProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/school" element={<School />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/test" element={<Test />} />
              {userContext.user.is_login ? (
                <div>
                  <HeaderBar />
                  <Route path="/" element={<LivePlayer />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/player" element={<LivePlayer />} />
                </div>
              ) : (
                <>
                  <Route
                    path="/"
                    element={<Navigate to="/login" state={{ from: "/" }} />}
                  />
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/player"
                    element={
                      <Navigate to="/login" state={{ from: "/player" }} />
                    }
                  />
                  <Route
                    path="/chat"
                    element={<Navigate to="/login" state={{ from: "/chat" }} />}
                  />
                </>
              )}
            </Routes>
          </BrowserRouter>
        </ClassUsersProvider>
      </SnackbarProvider>
    </UserContext.Provider>
  );
}
