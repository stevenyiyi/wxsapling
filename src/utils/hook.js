import React from "react";
// custom hook for getting previous value
function usePrevious(value) {
  const ref = React.useRef();
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

/**
 * Hook that clicks outside of the passed ref
 */
function useOutsideClick(ref, onOutsideClick) {
  React.useEffect(() => {
    /**
     * Dispatch click event if clicked on outside of element
     */
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onOutsideClick(event);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, onOutsideClick]);
}

/**
 * Hook window onunload event
 */
function useWindowOnUnload(onWindowUnload) {
  React.useEffect(() => {
    function handleWindowOnUnloadBefore(event) {
      onWindowUnload(event);
    }
    window.addEventListener("beforeunload", handleWindowOnUnloadBefore);
    return () =>
      window.removeEventListener("beforeunload", handleWindowOnUnloadBefore);
  }, [onWindowUnload]);
}

/**
 * Hook window beforeinstallprompt event
 */
function useWindowBeforeInstallPromt(onBeforeInstallPromt) {
  React.useEffect(() => {
    function handleBeforeInstallPromt(event) {
      event.preventDefault();
      onBeforeInstallPromt(event);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPromt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPromt
      );
  }, [onBeforeInstallPromt]);
}

export {
  usePrevious,
  useOutsideClick,
  useWindowOnUnload,
  useWindowBeforeInstallPromt
};
