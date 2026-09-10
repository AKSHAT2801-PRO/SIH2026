import React from "react";

const EMBLEM_URL = "https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg";

export default function AppLogo({ size = "md", dark = false }) {
  const dimensions = size === "xl" ? "w-12 h-12" : size === "lg" ? "w-9 h-9" : "w-8 h-8";
  return (
    <span
      className={`${dimensions} border border-[#B8863F] flex items-center justify-center shrink-0 overflow-hidden`}
      style={{
        background: "linear-gradient(to bottom, #FF9933 0 33%, #FFFFFF 33% 66%, #138808 66% 100%)",
      }}
      title="State Emblem of India"
      aria-label="State Emblem of India"
    >
      <img
        src={EMBLEM_URL}
        alt="State Emblem of India"
        className="w-[72%] h-[72%] object-contain"
      />
    </span>
  );
}
