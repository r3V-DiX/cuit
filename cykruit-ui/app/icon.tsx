import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Shield path */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
            fill="white"
            fill-opacity="0.95"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
