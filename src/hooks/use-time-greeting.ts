"use client";

import { useEffect, useState } from "react";

export function getVietnameseTimeGreeting(date: Date) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 11) {
    return "Chào buổi sáng";
  }

  if (hour >= 11 && hour < 14) {
    return "Chào buổi trưa";
  }

  if (hour >= 14 && hour < 18) {
    return "Chào buổi chiều";
  }

  return "Chào buổi tối";
}

export function useTimeGreeting() {
  const [greeting, setGreeting] = useState("Xin chào");

  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getVietnameseTimeGreeting(new Date()));
    };

    const initialTimer = window.setTimeout(updateGreeting, 0);
    const intervalTimer = window.setInterval(updateGreeting, 60000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(intervalTimer);
    };
  }, []);

  return greeting;
}
