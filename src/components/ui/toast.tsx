"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

type ToastType = "success" | "error";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  message,
  type = "success",
  duration = 3000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const Icon = type === "success" ? CheckCircle : XCircle;
  const bgColor = type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200";
  const iconColor = type === "success" ? "text-green-500" : "text-red-500";
  const textColor = type === "success" ? "text-green-800" : "text-red-800";

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 ${bgColor} ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <Icon className={`w-5 h-5 ${iconColor}`} />
      <span className={`text-sm font-medium ${textColor}`}>{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className={`p-1 rounded hover:bg-black/5 ${textColor}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
