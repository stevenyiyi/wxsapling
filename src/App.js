import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/login";
import HeaderBar from "./components/headerbar";
import School from "./components/school";
import Teachers from "./components/teachers";
import Recipes from "./components/recipes";
import Chat from "./components/chat";
import Test from "./components/test";
import Confirm from "./components/confirm";
import LivePlayer from "./components/live_player";
import { UserContext } from "./user_context";
import { default as SnackbarProvider } from "./components/snackbar";
import { ClassUsersProvider } from "./components/use_class_users";
import { useWindowBeforeInstallPromt } from "./utils/hook";
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

  const [PWAInfo, setPWAInfo] = React.useState({
    show: false,
    message: "",
    deferredPrompt: null
  });

  const onPWAInstallCancel = () => {
    setPWAInfo({ ...PWAInfo, show: false });
  };
  const onPWAInstallOK = () => {
    setPWAInfo({ ...PWAInfo, show: false });
    let deferredPrompt = PWAInfo.deferredPrompt;
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the A2HS prompt");
      } else {
        console.log("User dismissed the A2HS prompt");
      }
      deferredPrompt = null;
    });
  };
  const onBeforeInstallPromt = (e) => {
    setPWAInfo({
      ...PWAInfo,
      show: true,
      message: "是否将直播添加到屏幕或桌面？",
      deferredPrompt: e
    });
  };
  useWindowBeforeInstallPromt(onBeforeInstallPromt);
  console.log(userContext);
  return (
    <UserContext.Provider value={userContext}>
      <SnackbarProvider>
        <ClassUsersProvider>
          <BrowserRouter>
            {userContext.user.is_login ? (
              <>
                <HeaderBar />
                <div className="content">
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/school" element={<School />} />
                    <Route path="/teachers" element={<Teachers />} />
                    <Route path="/recipes" element={<Recipes />} />
                    <Route path="/test" element={<Test />} />
                    <Route path="/" element={<LivePlayer />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/player" element={<LivePlayer />} />
                  </Routes>
                </div>
              </>
            ) : (
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/login" state={{ from: "/" }} />}
                />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/player"
                  element={<Navigate to="/login" state={{ from: "/player" }} />}
                />
                <Route
                  path="/chat"
                  element={<Navigate to="/login" state={{ from: "/chat" }} />}
                />
                <Route path="/school" element={<School />} />
                <Route path="/teachers" element={<Teachers />} />
                <Route path="/recipes" element={<Recipes />} />
              </Routes>
            )}

            <Confirm
              show={PWAInfo.show}
              message={PWAInfo.message}
              onOK={onPWAInstallOK}
              onCancel={onPWAInstallCancel}
            />
          </BrowserRouter>
        </ClassUsersProvider>
      </SnackbarProvider>
    </UserContext.Provider>
  );
}
