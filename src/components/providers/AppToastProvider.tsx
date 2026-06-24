"use client";

import { ToastContainer } from "react-toastify";

export function AppToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
      theme="colored"
      toastStyle={{
        borderRadius: "16px",
      }}
    />
  );
}
