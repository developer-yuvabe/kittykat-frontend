import * as React from "react";
import { SVGProps } from "react";

type CustomIconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  color?: string;
  height?: number | string;
  width?: number | string;
};

export const HomeIcon: React.FC<CustomIconProps> = ({
  size = 24,
  color = "currentColor",
  className = "home-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className="home-icon-path"
      stroke={color}
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M2.54 11.16 12 3.42l9.46 7.74M10.28 21.44v-5.16h3.44v5.16"
    />
    <path
      className="home-icon-path-2"
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M5.12 12.84v6.88c0 .95.77 1.72 1.72 1.72h10.32c.95 0 1.72-.77 1.72-1.72v-6.88"
    />
  </svg>
);

export const ChatBubbleIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "chat-bubble-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className="chat-bubble-icon-path"
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M19.74 3.4H4.26c-.95 0-1.72.77-1.72 1.72v9.46c0 .95.77 1.72 1.72 1.72h4.3L12 20.6l3.44-4.3h4.3c.95 0 1.72-.77 1.72-1.72V5.12c0-.95-.77-1.72-1.72-1.72Z"
    />
    <path
      className="chat-bubble-icon-path-2"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M7.7 7.71h8.6M7.71 12h5.16"
    />
  </svg>
);

export const NotificationIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "notification-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className="notification-icon-path"
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M18.02 11.14V8.56a6.02 6.02 0 1 0-12.04 0v2.58c0 2.838-2.58 3.526-2.58 5.16 0 1.462 3.354 2.58 8.6 2.58 5.246 0 8.6-1.118 8.6-2.58 0-1.634-2.58-2.322-2.58-5.16Z"
    />
    <path
      className="notification-icon-fill"
      fill={color}
      d="M12 20.563c-.87 0-1.687-.03-2.456-.086a2.573 2.573 0 0 0 4.911 0c-.769.056-1.586.086-2.455.086Z"
    />
  </svg>
);

export const CatIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "cat-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className="cat-icon-fill"
      fill={color}
      d="M9.12 13.1a1.08 1.08 0 1 1-2.16 0 1.08 1.08 0 0 1 2.16 0Zm6.84-1.08a1.08 1.08 0 1 0 0 2.16 1.08 1.08 0 0 0 0-2.16Zm5.4-7.2v7.92c0 4.764-4.198 8.64-9.36 8.64-5.161 0-9.36-3.876-9.36-8.64V4.82a1.44 1.44 0 0 1 2.492-.98L6.69 5.63a10.01 10.01 0 0 1 10.63 0l1.548-1.79a1.44 1.44 0 0 1 2.492.981Zm-1.44 0-1.94 2.232a.72.72 0 0 1-.973.108 7.997 7.997 0 0 0-1.407-.832V8.42a.72.72 0 1 1-1.44 0V5.815a8.768 8.768 0 0 0-1.44-.245v2.85a.72.72 0 1 1-1.44 0V5.57a8.77 8.77 0 0 0-1.44.245V8.42a.72.72 0 1 1-1.44 0V6.328a7.998 7.998 0 0 0-1.407.832.72.72 0 0 1-.972-.105L4.08 4.82v7.92c0 3.75 3.168 6.84 7.2 7.17v-1.832l-1.23-1.23a.72.72 0 0 1 1.018-1.017l.931.93.93-.93a.72.72 0 0 1 1.02 1.018l-1.23 1.23v1.831c4.031-.332 7.2-3.42 7.2-7.17V4.82Z"
    />
  </svg>
);

export const GalleryIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "gallery-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className="gallery-icon-fill"
      fill={color}
      d="M19.2 3.36H7.68A1.44 1.44 0 0 0 6.24 4.8v1.44H4.8a1.44 1.44 0 0 0-1.44 1.44V19.2c0 .796.645 1.44 1.44 1.44h11.52a1.44 1.44 0 0 0 1.44-1.44v-1.44h1.44a1.44 1.44 0 0 0 1.44-1.44V4.8a1.44 1.44 0 0 0-1.44-1.44ZM7.68 4.8H19.2v6.245l-1.503-1.503a1.44 1.44 0 0 0-2.036 0L8.883 16.32H7.68V4.8Zm8.64 14.4H4.8V7.68h1.44v8.64c0 .796.645 1.44 1.44 1.44h8.64v1.44Zm2.88-2.88h-8.28l5.76-5.76 2.52 2.52v3.24Zm-7.92-5.76a2.16 2.16 0 1 0 0-4.32 2.16 2.16 0 0 0 0 4.32Zm0-2.88a.72.72 0 1 1 0 1.44.72.72 0 0 1 0-1.44Z"
    />
  </svg>
);

export const PlayIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "play-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className="play-icon-fill"
      fill={color}
      d="M12 2.64A9.36 9.36 0 1 0 21.36 12 9.37 9.37 0 0 0 12 2.64Zm0 17.28A7.92 7.92 0 1 1 19.92 12 7.929 7.929 0 0 1 12 19.92Zm2.88-12.24a.72.72 0 0 0-.72.72v2.3L9.502 7.79A.72.72 0 0 0 8.4 8.4v7.2a.72.72 0 0 0 1.102.61l4.658-2.912V15.6a.72.72 0 1 0 1.44 0V8.4a.72.72 0 0 0-.72-.72ZM9.84 14.3V9.699L13.522 12 9.84 14.3Z"
    />
  </svg>
);

export const MenuIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "menu-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className="menu-icon-fill"
      fill={color}
      d="M20.64 12a.72.72 0 0 1-.72.72H4.08a.72.72 0 1 1 0-1.44h15.84a.72.72 0 0 1 .72.72ZM4.08 6.96h15.84a.72.72 0 0 0 0-1.44H4.08a.72.72 0 0 0 0 1.44Zm15.84 10.08H4.08a.72.72 0 0 0 0 1.44h15.84a.72.72 0 0 0 0-1.44Z"
    />
  </svg>
);

export const QuestionIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "question-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <rect
      className="question-icon-bg"
      width={24}
      height={24}
      fill="#F3F4F6"
      rx={12}
    />
    <path
      className="question-icon-path"
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={1.218}
      d="M10.64 7.83c1.42-.63 3.26-.55 3.89.46.63 1.01.19 2.19-.88 3.1-.07.06-1.08.91-1.48 2.12"
    />
    <path
      className="question-icon-fill"
      fill={color}
      d="M12 17.06a.76.76 0 1 0 0-1.52.76.76 0 0 0 0 1.52Z"
    />
  </svg>
);

export const ExpandIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "expand-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className="expand-icon-path"
      stroke={color}
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M20.58 3.42 13.7 10.3"
    />
    <path
      className="expand-icon-path-2"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M13.7 3.42h6.88v6.88"
    />
    <path
      className="expand-icon-path-3"
      stroke={color}
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="m3.42 20.58 6.88-6.88"
    />
    <path
      className="expand-icon-path-4"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M3.42 13.7v6.88h6.88"
    />
  </svg>
);

export const EditIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "edit-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className="edit-icon-path"
      stroke={color}
      strokeMiterlimit={10}
      strokeWidth={2.045}
      d="M13.722 6.0192L17.97 10.2672"
    />
    <path
      className="edit-icon-path-2"
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={2.045}
      d="M9.444 18.816 3.48 20.52l1.704-5.964 10.5768-10.5768a1.704 1.704 0 0 1 2.4096 0l1.8504 1.8504a1.704 1.704 0 0 1 0 2.4096L9.444 18.816Z"
    />
  </svg>
);

export const MoreIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "more-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className="more-icon-path"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.045}
      d="M12 13.704a1.704 1.704 0 1 0 0-3.408 1.704 1.704 0 0 0 0 3.408ZM4.284 13.704a1.704 1.704 0 1 0 0-3.408 1.704 1.704 0 0 0 0 3.408ZM19.716 13.704a1.704 1.704 0 1 0 0-3.408 1.704 1.704 0 0 0 0 3.408Z"
    />
  </svg>
);

export const UploadIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "upload-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className="upload-icon-path"
      stroke={color}
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M12 3.75v11.54"
    />
    <path
      className="upload-icon-path-2"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M8.56 7.07 12 3.75l3.44 3.32"
    />
    <path
      className="upload-icon-path-3"
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M16.3 10.34h2.58c.95 0 1.72.74 1.72 1.65v6.6c0 .91-.77 1.65-1.72 1.65H5.12c-.95 0-1.72-.74-1.72-1.65v-6.6c0-.91.77-1.65 1.72-1.65H7.7"
    />
  </svg>
);

export const SendIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "send-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className="send-icon-path"
      stroke={color}
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M20.59 3.75 10.27 13.66"
    />
    <path
      className="send-icon-path-2"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="m20.6 3.74-6.02 16.51-4.3-6.6-6.88-4.13L20.6 3.74Z"
    />
  </svg>
);

export const SaveIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "save-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className="save-icon-path"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M6.84 17.15v-5.16h10.32v5.16"
    />
    <path
      className="save-icon-path-2"
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M18.88 20.6H5.12c-.95 0-1.72-.77-1.72-1.72V5.12c0-.95.77-1.72 1.72-1.72H16.3l4.3 4.3v11.18c0 .95-.77 1.72-1.72 1.72Z"
    />
    <path
      className="save-icon-path-3"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M14.57 6.85v1.72"
    />
  </svg>
);

export const SearchIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "search-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 14 14"
    className={className}
    {...props}
  >
    <path
      className="search-icon-path"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={1.368}
      d="m12.71 12.71-2.28-2.28M5.86 10.42a4.56 4.56 0 1 0 0-9.12 4.56 4.56 0 0 0 0 9.12Z"
    />
    <path
      className="search-icon-path-2"
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={1.368}
      d="M3.57 5.85a2.28 2.28 0 0 1 2.28-2.28"
    />
  </svg>
);

export const PinIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "pin-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className={className}
      stroke={color}
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M5.13 11.16 16.17 5M12.84 18.869 19 7.83"
    />
    <path
      className={className}
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="m14.56 3.42 6.02 6.02M9.005 14.995l-5.59 5.59M3.41 9.41l11.18 11.18"
    />
  </svg>
);

export const ZoomIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "zoom-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className="zoom-icon-path"
      stroke={color}
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="m8.155 8.155-4.73-4.73"
    />
    <path
      className="zoom-icon-path-2"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M8.58 3.42H3.42v5.16"
    />
    <path
      className="zoom-icon-path-3"
      stroke={color}
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="m8.155 15.845-4.73 4.73"
    />
    <path
      className="zoom-icon-path-4"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M3.42 15.42v5.16h5.16"
    />
    <path
      className="zoom-icon-path-5"
      stroke={color}
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="m15.845 15.845 4.73 4.73"
    />
    <path
      className="zoom-icon-path-6"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M15.42 20.58h5.16v-5.16"
    />
    <path
      className="zoom-icon-path-7"
      stroke={color}
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="m15.845 8.155 4.73-4.73"
    />
    <path
      className="zoom-icon-path-8"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M20.58 8.58V3.42h-5.16"
    />
    <path
      className="zoom-icon-path-9"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.064}
      d="M12 14.58a2.58 2.58 0 1 0 0-5.16 2.58 2.58 0 0 0 0 5.16Z"
    />
  </svg>
);

export const DashboardIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "dashboard-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className="dashboard-icon-path"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M18.88 3.4H5.12c-.95 0-1.72.77-1.72 1.72v13.76c0 .95.77 1.72 1.72 1.72h13.76c.95 0 1.72-.77 1.72-1.72V5.12c0-.95-.77-1.72-1.72-1.72ZM14.57 8.57h2.58M6.85 8.57h1.72"
    />
    <path
      className="dashboard-icon-path-2"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M10.29 10.29a1.72 1.72 0 1 0 0-3.44 1.72 1.72 0 0 0 0 3.44ZM6.85 15.43h2.58M15.43 15.43h1.72M13.71 17.15a1.72 1.72 0 1 0 0-3.44 1.72 1.72 0 0 0 0 3.44Z"
    />
  </svg>
);

export const CloudUploadIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "cloud-upload-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 40 40"
    className={className}
    {...props}
  >
    <path
      className="cloud-upload-icon-path"
      stroke={color}
      strokeMiterlimit={10}
      strokeWidth={2.4}
      d="M20 32V20"
    />
    <path
      className="cloud-upload-icon-path-2"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.4}
      d="m15 25 5-5 5 5"
    />
    <path
      className="cloud-upload-icon-path-3"
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={2.4}
      d="M25 31.83A12 12 0 1 0 11.179 18.1a7.046 7.046 0 0 0-6.1 7.8 6.924 6.924 0 0 0 6.9 6.1h3.02"
    />
  </svg>
);

export const DeleteIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "delete-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className="delete-icon-path"
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M18.88 9.41v10.32c0 .95-.77 1.72-1.72 1.72H6.84c-.95 0-1.72-.77-1.72-1.72V9.41"
    />
    <path
      className="delete-icon-path-2"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M2.54 6h18.92M12 11.99v5.16M8.57 11.99v5.16M15.43 11.99v5.16"
    />
    <path
      className="delete-icon-path-3"
      stroke={color}
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M8.56 6.01V2.57h6.88v3.44"
    />
  </svg>
);

export const ShareIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "share-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className="share-icon-path"
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M12.865 18.02v-4.3c-6.02 0-7.23 1.182-10.32 5.16 0-8.428 5.504-10.32 10.32-10.32v-4.3l8.17 6.88-8.17 6.88Z"
    />
  </svg>
);

export const DownloadIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "download-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      className="download-icon-path"
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M3.4 15.42v3.44c0 .95.77 1.72 1.72 1.72h13.76c.95 0 1.72-.77 1.72-1.72v-3.44"
    />
    <path
      className="download-icon-path-2"
      stroke={color}
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M12 2.55v12.9"
    />
    <path
      className="download-icon-path-3"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="m7.7 11.14 4.3 4.3 4.3-4.3"
    />
  </svg>
);

export const LikeIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "like-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 22 22"
    className={className}
    {...props}
  >
    <path
      className="like-icon-fill"
      fill={color}
      d="M4.72 10.185H2.35a.79.79 0 0 0-.79.79v8.69c0 .436.354.79.79.79h2.37v-10.27ZM19.313 9.736a3.16 3.16 0 0 0-2.4-1.106h-5.135V4.68c0-1.743-.628-3.16-2.37-3.16a.79.79 0 0 0-.763.582L6.248 10.21v10.27h9.816a3.143 3.143 0 0 0 3.124-2.68l.85-5.53a3.16 3.16 0 0 0-.725-2.534Z"
    />
  </svg>
);

export const DislikeIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className = "dislike-icon",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 22 22"
    className={className}
    {...props}
  >
    <path
      className="dislike-icon-fill"
      fill={color}
      d="M4.72 11.815H2.35a.79.79 0 0 1-.79-.79v-8.69a.79.79 0 0 1 .79-.79h2.37v10.27ZM19.313 12.268a3.16 3.16 0 0 1-2.4 1.102h-5.135v3.95c0 1.743-.628 3.16-2.37 3.16a.79.79 0 0 1-.763-.582L6.248 11.79V1.52h9.816a3.143 3.143 0 0 1 3.124 2.68l.85 5.53a3.16 3.16 0 0 1-.725 2.538Z"
    />
  </svg>
);

export const LibraryIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    color={color}
    className={className}
    fill="none"
    {...props}
  >
    <path
      stroke={color}
      strokeMiterlimit={10}
      strokeWidth={1.368}
      d="M8.57 3.491v9.69"
    />
    <path
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={1.368}
      d="M11.706 2.346c-1.71 0-3.135.741-3.135 1.71 0-.969-1.425-1.71-3.135-1.71-1.71 0-3.135.741-3.135 1.71v9.69c0-.969 1.425-1.71 3.135-1.71 1.71 0 3.135.741 3.135 1.71 0-.969 1.425-1.71 3.135-1.71 1.71 0 3.135.741 3.135 1.71v-9.69c0-.969-1.425-1.71-3.135-1.71Z"
    />
  </svg>
);

export const ImageIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      stroke={color}
      d="M12.588 11.646a1.5 1.5 0 1 1-2.97.418 1.5 1.5 0 0 1 2.97-.418Z"
    ></path>
    <path
      stroke={color}
      d="M11.297 1.03c-1.732-.232-3.403.918-3.66 2.674L7.04 7.759l-3.33.468a3.148 3.148 0 0 0-2.68 3.555l1.197 8.508a3.148 3.148 0 0 0 3.555 2.68l8.508-1.197a3.148 3.148 0 0 0 2.68-3.555l-.2-1.42 1.285.172c1.732.233 3.403-.918 3.661-2.674l1.251-8.508c.26-1.766-1.03-3.329-2.769-3.562L11.297 1.03Zm5.183 13.71 1.842.248c.727.097 1.328-.389 1.415-.983l1.252-8.508c.085-.582-.338-1.192-1.057-1.289l-8.901-1.196c-.727-.097-1.329.389-1.416.983l-.51 3.474 3.113-.438a3.148 3.148 0 0 1 3.555 2.68l.707 5.03Zm-2.687-4.752a1.148 1.148 0 0 0-1.297-.977l-8.508 1.196a1.148 1.148 0 0 0-.977 1.297l.619 4.4 1.068-1.063a3.148 3.148 0 0 1 4.115-.283l6.08 4.582c.09-.195.128-.416.096-.644l-1.196-8.508Zm-1.109 9.991L7.61 16.155a1.148 1.148 0 0 0-1.5.103L3.978 18.38l.23 1.632a1.148 1.148 0 0 0 1.296.977l7.18-1.01Z"
    ></path>
  </svg>
);

export const FileAttachmentVertical: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  className,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path
      stroke={color}
      d="M9 7a5 5 0 0 1 10 0v8a7 7 0 1 1-14 0V9a1 1 0 0 1 2 0v6a5 5 0 0 0 10 0V7a3 3 0 1 0-6 0v8a1 1 0 1 0 2 0V9a1 1 0 1 1 2 0v6a3 3 0 1 1-6 0V7Z"
    ></path>
  </svg>
);

export const FacebookIcon: React.FC<CustomIconProps> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 45 46"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M44.8197 23.0051C44.8197 10.6751 34.8297 0.685059 22.4997 0.685059C10.1697 0.685059 0.179687 10.6751 0.179687 23.0051C0.179687 34.1453 8.34179 43.3793 19.0122 45.0551L19.0122 29.4572H13.3422L13.3422 23.0051H19.0122L19.0122 18.0875C19.0122 12.494 22.3422 9.40426 27.4425 9.40426C29.8851 9.40426 32.4393 9.83986 32.4393 9.83986L32.4393 15.3299H29.6241C26.8521 15.3299 25.9872 17.0507 25.9872 18.8156L25.9872 23.0051H32.1774L31.1874 29.4572H25.9872L25.9872 45.0551C36.6576 43.3793 44.8197 34.1453 44.8197 23.0051Z"
      fill="#636AE8"
    />
  </svg>
);

export const InstagramIcon: React.FC<CustomIconProps> = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 102 102"
    id="instagram"
  >
    <defs>
      <radialGradient
        id="a"
        cx="6.601"
        cy="99.766"
        r="129.502"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset=".09" stopColor="#fa8f21"></stop>
        <stop offset=".78" stopColor="#d82d7e"></stop>
      </radialGradient>
      <radialGradient
        id="b"
        cx="70.652"
        cy="96.49"
        r="113.963"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset=".64" stopColor="#8c3aaa" stopOpacity="0"></stop>
        <stop offset="1" stopColor="#8c3aaa"></stop>
      </radialGradient>
    </defs>
    <path
      fill="url(#a)"
      d="M25.865,101.639A34.341,34.341,0,0,1,14.312,99.5a19.329,19.329,0,0,1-7.154-4.653A19.181,19.181,0,0,1,2.5,87.694,34.341,34.341,0,0,1,.364,76.142C.061,69.584,0,67.617,0,51s.067-18.577.361-25.14A34.534,34.534,0,0,1,2.5,14.312,19.4,19.4,0,0,1,7.154,7.154,19.206,19.206,0,0,1,14.309,2.5,34.341,34.341,0,0,1,25.862.361C32.422.061,34.392,0,51,0s18.577.067,25.14.361A34.534,34.534,0,0,1,87.691,2.5a19.254,19.254,0,0,1,7.154,4.653A19.267,19.267,0,0,1,99.5,14.309a34.341,34.341,0,0,1,2.14,11.553c.3,6.563.361,8.528.361,25.14s-.061,18.577-.361,25.14A34.5,34.5,0,0,1,99.5,87.694,20.6,20.6,0,0,1,87.691,99.5a34.342,34.342,0,0,1-11.553,2.14c-6.557.3-8.528.361-25.14.361s-18.577-.058-25.134-.361"
    ></path>
    <path
      fill="url(#b)"
      d="M25.865,101.639A34.341,34.341,0,0,1,14.312,99.5a19.329,19.329,0,0,1-7.154-4.653A19.181,19.181,0,0,1,2.5,87.694,34.341,34.341,0,0,1,.364,76.142C.061,69.584,0,67.617,0,51s.067-18.577.361-25.14A34.534,34.534,0,0,1,2.5,14.312,19.4,19.4,0,0,1,7.154,7.154,19.206,19.206,0,0,1,14.309,2.5,34.341,34.341,0,0,1,25.862.361C32.422.061,34.392,0,51,0s18.577.067,25.14.361A34.534,34.534,0,0,1,87.691,2.5a19.254,19.254,0,0,1,7.154,4.653A19.267,19.267,0,0,1,99.5,14.309a34.341,34.341,0,0,1,2.14,11.553c.3,6.563.361,8.528.361,25.14s-.061,18.577-.361,25.14A34.5,34.5,0,0,1,99.5,87.694,20.6,20.6,0,0,1,87.691,99.5a34.342,34.342,0,0,1-11.553,2.14c-6.557.3-8.528.361-25.14.361s-18.577-.058-25.134-.361"
    ></path>
    <path
      fill="#fff"
      d="M461.114,477.413a12.631,12.631,0,1,1,12.629,12.632,12.631,12.631,0,0,1-12.629-12.632m-6.829,0a19.458,19.458,0,1,0,19.458-19.458,19.457,19.457,0,0,0-19.458,19.458m35.139-20.229a4.547,4.547,0,1,0,4.549-4.545h0a4.549,4.549,0,0,0-4.547,4.545m-30.99,51.074a20.943,20.943,0,0,1-7.037-1.3,12.547,12.547,0,0,1-7.193-7.19,20.923,20.923,0,0,1-1.3-7.037c-.184-3.994-.22-5.194-.22-15.313s.04-11.316.22-15.314a21.082,21.082,0,0,1,1.3-7.037,12.54,12.54,0,0,1,7.193-7.193,20.924,20.924,0,0,1,7.037-1.3c3.994-.184,5.194-.22,15.309-.22s11.316.039,15.314.221a21.082,21.082,0,0,1,7.037,1.3,12.541,12.541,0,0,1,7.193,7.193,20.926,20.926,0,0,1,1.3,7.037c.184,4,.22,5.194.22,15.314s-.037,11.316-.22,15.314a21.023,21.023,0,0,1-1.3,7.037,12.547,12.547,0,0,1-7.193,7.19,20.925,20.925,0,0,1-7.037,1.3c-3.994.184-5.194.22-15.314.22s-11.316-.037-15.309-.22m-.314-68.509a27.786,27.786,0,0,0-9.2,1.76,19.373,19.373,0,0,0-11.083,11.083,27.794,27.794,0,0,0-1.76,9.2c-.187,4.04-.229,5.332-.229,15.623s.043,11.582.229,15.623a27.793,27.793,0,0,0,1.76,9.2,19.374,19.374,0,0,0,11.083,11.083,27.813,27.813,0,0,0,9.2,1.76c4.042.184,5.332.229,15.623.229s11.582-.043,15.623-.229a27.8,27.8,0,0,0,9.2-1.76,19.374,19.374,0,0,0,11.083-11.083,27.716,27.716,0,0,0,1.76-9.2c.184-4.043.226-5.332.226-15.623s-.043-11.582-.226-15.623a27.786,27.786,0,0,0-1.76-9.2,19.379,19.379,0,0,0-11.08-11.083,27.748,27.748,0,0,0-9.2-1.76c-4.041-.185-5.332-.229-15.621-.229s-11.583.043-15.626.229"
      transform="translate(-422.637 -426.196)"
    ></path>
  </svg>
);

export const PinterestIcon: React.FC<CustomIconProps> = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fillRule="evenodd"
    clipRule="evenodd"
    imageRendering="optimizeQuality"
    shapeRendering="geometricPrecision"
    textRendering="geometricPrecision"
    viewBox="0 0 512 512"
    id="pinterest"
  >
    <defs>
      <linearGradient
        id="a"
        x1="67.83"
        x2="474.19"
        y1="82.42"
        y2="389.98"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#d0272c"></stop>
        <stop offset="1" stopColor="#e62027"></stop>
      </linearGradient>
    </defs>
    <path
      fill="url(#a)"
      d="M256 0c141.39,0 256,114.61 256,256 0,141.39 -114.61,256 -256,256 -141.39,0 -256,-114.61 -256,-256 0,-141.39 114.61,-256 256,-256z"
    ></path>
    <path
      fill="#fff"
      fillRule="nonzero"
      d="M235.16 304.61c-7.91,41.46 -17.57,81.22 -46.18,101.98 -8.83,-62.67 12.97,-109.74 23.09,-159.7 -17.26,-29.06 2.08,-87.53 38.48,-73.12 44.8,17.72 -38.79,108.02 17.32,119.3 58.59,11.77 82.51,-101.66 46.18,-138.54 -52.49,-53.26 -152.8,-1.22 -140.46,75.04 3,18.64 22.26,24.3 7.69,50.03 -33.59,-7.45 -43.62,-33.95 -42.33,-69.27 2.08,-57.83 51.95,-98.31 101.98,-103.91 63.27,-7.08 122.65,23.23 130.85,82.74 9.23,67.17 -28.56,139.92 -96.21,134.69 -18.34,-1.42 -26.04,-10.51 -40.41,-19.24z"
    ></path>
  </svg>
);

export const ShirtIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    {...props}
  >
    <path
      stroke={color}
      color={color}
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M15.44 3.4A3.45 3.45 0 0 1 12 6.84 3.45 3.45 0 0 1 8.56 3.4H5.98L2.54 5.12v5.16h3.44V20.6h12.04V10.28h3.44V5.12L18.02 3.4h-2.58Z"
    />
  </svg>
);

export const BrushIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 20,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    {...props}
  >
    <path
      fill={color}
      d="M5.062 19.97c1.523 0 2.84-.543 3.91-1.613 1.123-1.123 1.707-2.854 1.55-4.494l8.565-8.564a3.123 3.123 0 0 0-.003-4.414c-1.177-1.18-3.233-1.18-4.412 0L5.79 9.769c-1.913.169-3.807 1.521-3.807 3.919 0 .303.02.588.042.86.08 1.031.109 1.418-1.471 2.208a1.001 1.001 0 0 0-.122 1.717c.09.06 2.193 1.497 4.63 1.497ZM16.086 2.298a1.144 1.144 0 0 1 1.587.002 1.12 1.12 0 0 1 0 1.584L10 11.556 8.415 9.97l7.672-7.672ZM4.02 14.393c-.018-.224-.037-.458-.037-.706 0-1.545 1.445-1.953 2.21-1.953.356 0 .699.073.964.206.945.475 1.26 1.293 1.357 1.896.177 1.09-.217 2.368-.956 3.107-.691.691-1.507 1.027-2.495 1.027-.75 0-1.48-.196-2.075-.427 1.082-.973 1.12-1.989 1.032-3.15Z"
    />
  </svg>
);

export const VideoRecorderIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 22,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    {...props}
  >
    <path
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M14.9 6.26H2V18.3h12.9V6.26Z"
    />
    <path
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M20.89 16.58 14.87 14v-3.44l6.02-2.58v8.6ZM14.89 3.72V2H8.01"
    />
    <path
      fill={color}
      d="M5.45 10.57a.86.86 0 1 0 0-1.72.86.86 0 0 0 0 1.72Z"
    />
  </svg>
);

export const BrainIcon: React.FC<CustomIconProps> = ({
  color = "currentColor",
  size = 24,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    {...props}
  >
    <path
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M6.86 12.88a4.3 4.3 0 0 1 0-8.6c.052 0 .101.014.153.015a2.574 2.574 0 0 1 5.007.845V6a2.58 2.58 0 0 1-2.58 2.58h-.86M20.464 16.116c.087.334.132.677.136 1.021a4.3 4.3 0 0 1-8.6 0 4.3 4.3 0 0 1-8.6 0c.004-.344.05-.688.136-1.021"
    />
    <path
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M3.571 11.293a3.4 3.4 0 0 0-1.011 2.42c0 1.9 1.54 3.44 3.44 3.44h.86"
    />
    <path
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M7.71 9.43a.86.86 0 1 0 0-1.72.86.86 0 0 0 0 1.72ZM7.71 18a.86.86 0 1 0 0-1.72.86.86 0 0 0 0 1.72Z"
    />
    <path
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M20.429 11.293a3.4 3.4 0 0 1 1.011 2.42c0 1.9-1.54 3.44-3.44 3.44h-.86"
    />
    <path
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M12 17.15v-3.44M16.29 18a.86.86 0 1 0 0-1.72.86.86 0 0 0 0 1.72Z"
    />
    <path
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M17.14 12.88a4.3 4.3 0 0 0 0-8.6c-.053 0-.102.014-.153.015a2.574 2.574 0 0 0-5.007.845V6a2.58 2.58 0 0 0 2.58 2.58h.86"
    />
    <path
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit={10}
      strokeWidth={2.064}
      d="M16.29 9.43a.86.86 0 1 0 0-1.72.86.86 0 0 0 0 1.72ZM12 13.72A.86.86 0 1 0 12 12a.86.86 0 0 0 0 1.72Z"
    />
  </svg>
);

export const BrainIcon2: React.FC<CustomIconProps> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.65937 13.2618C5.28455 13.2618 3.35937 11.3366 3.35937 8.96177C3.35937 6.58694 5.28455 4.66177 7.65937 4.66177C7.71183 4.66177 7.76085 4.67553 7.81245 4.67725C8.22314 3.48823 9.43308 2.77023 10.6735 2.97945C11.9139 3.18867 12.8214 4.26382 12.8194 5.52177V6.38177C12.8194 7.80666 11.6643 8.96177 10.2394 8.96177H9.37937"
      stroke="white"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="round"
    />
    <path
      d="M21.2633 16.4976C21.3499 16.8314 21.3955 17.1744 21.3992 17.5192C21.3992 19.8941 19.474 21.8192 17.0992 21.8192C14.7244 21.8192 12.7992 19.8941 12.7992 17.5192C12.7992 19.8941 10.874 21.8192 8.49922 21.8192C6.12439 21.8192 4.19922 19.8941 4.19922 17.5192C4.20294 17.1744 4.24857 16.8314 4.3351 16.4976"
      stroke="white"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="round"
    />
    <path
      d="M4.37074 11.6743C3.72347 12.3132 3.35921 13.1849 3.35938 14.0944C3.35938 15.9942 4.89952 17.5344 6.79938 17.5344H7.65938"
      stroke="white"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="round"
    />
    <path
      d="M8.50844 9.8118C8.9834 9.8118 9.36844 9.42676 9.36844 8.9518C9.36844 8.47683 8.9834 8.0918 8.50844 8.0918C8.03347 8.0918 7.64844 8.47683 7.64844 8.9518C7.64844 9.42676 8.03347 9.8118 8.50844 9.8118Z"
      stroke="white"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="square"
    />
    <path
      d="M8.50844 18.3819C8.9834 18.3819 9.36844 17.9968 9.36844 17.5219C9.36844 17.0469 8.9834 16.6619 8.50844 16.6619C8.03347 16.6619 7.64844 17.0469 7.64844 17.5219C7.64844 17.9968 8.03347 18.3819 8.50844 18.3819Z"
      stroke="white"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="square"
    />
    <path
      d="M21.2261 11.6743C21.8734 12.3132 22.2377 13.1849 22.2375 14.0944C22.2375 15.9942 20.6974 17.5344 18.7975 17.5344H17.9375"
      stroke="white"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="round"
    />
    <path
      d="M12.8008 17.5318L12.8008 14.0918"
      stroke="white"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="square"
    />
    <path
      d="M17.0905 18.3819C17.5654 18.3819 17.9505 17.9968 17.9505 17.5219C17.9505 17.0469 17.5654 16.6619 17.0905 16.6619C16.6155 16.6619 16.2305 17.0469 16.2305 17.5219C16.2305 17.9968 16.6155 18.3819 17.0905 18.3819Z"
      stroke="white"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="square"
    />
    <path
      d="M17.9413 13.2618C20.3161 13.2618 22.2413 11.3366 22.2413 8.96177C22.2413 6.58694 20.3161 4.66177 17.9413 4.66177C17.8888 4.66177 17.8398 4.67553 17.7882 4.67725C17.3775 3.48823 16.1675 2.77023 14.9271 2.97945C13.6867 3.18867 12.7792 4.26382 12.7813 5.52177L12.7813 6.38177C12.7813 7.80666 13.9364 8.96177 15.3613 8.96177L16.2213 8.96177"
      stroke="white"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="round"
    />
    <path
      d="M17.0905 9.8118C17.5654 9.8118 17.9505 9.42676 17.9505 8.9518C17.9505 8.47683 17.5654 8.0918 17.0905 8.0918C16.6155 8.0918 16.2305 8.47683 16.2305 8.9518C16.2305 9.42676 16.6155 9.8118 17.0905 9.8118Z"
      stroke="white"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="square"
    />
    <path
      d="M12.7975 14.1018C13.2725 14.1018 13.6575 13.7168 13.6575 13.2418C13.6575 12.7669 13.2725 12.3818 12.7975 12.3818C12.3225 12.3818 11.9375 12.7669 11.9375 13.2418C11.9375 13.7168 12.3225 14.1018 12.7975 14.1018Z"
      stroke="white"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="square"
    />
  </svg>
);

export const MoodboardIcon: React.FC<CustomIconProps> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 19 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5.88678 14.3818L0.300781 14.3818L0.300781 12.3818L18.3008 12.3818V14.3818L12.7148 14.3818L15.9578 17.6248L14.5438 19.0388L10.3008 14.7958L10.3008 17.3818H8.30078V14.7958L4.05778 19.0388L2.64378 17.6248L5.88678 14.3818ZM2.30078 0.381836L16.3008 0.381836C16.8531 0.381836 17.3008 0.829551 17.3008 1.38184L17.3008 11.3818L1.30078 11.3818L1.30078 1.38184C1.30078 0.829551 1.7485 0.381836 2.30078 0.381836ZM3.30078 2.38184L3.30078 9.38184L15.3008 9.38184L15.3008 2.38184L3.30078 2.38184Z"
      fill="white"
    />
  </svg>
);

export const RegenerateIcon: React.FC<CustomIconProps> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_189_11220)">
      <path
        d="M12.6964 2.37182C11.5775 1.44052 10.1906 0.830825 8.65625 0.690125V2.03682C9.81535 2.16412 10.874 2.62642 11.745 3.32322L12.6964 2.37182Z"
        fill="#7F55E0"
      />
      <path
        d="M7.34479 2.03682L7.34479 0.690125C5.81049 0.824125 4.42359 1.44052 3.30469 2.37182L4.25609 3.32322C5.12709 2.62642 6.18569 2.16412 7.34479 2.03682Z"
        fill="#7F55E0"
      />
      <path
        d="M3.32451 4.25474L2.37311 3.30334C1.44181 4.42224 0.832106 5.80914 0.691406 7.34344L2.03811 7.34344C2.16541 6.18434 2.62771 5.12574 3.32451 4.25474Z"
        fill="#7F55E0"
      />
      <path
        d="M13.9583 7.34344H15.305C15.1643 5.80914 14.5546 4.42224 13.6233 3.30334L12.6719 4.25474C13.3687 5.12574 13.831 6.18434 13.9583 7.34344Z"
        fill="#7F55E0"
      />
      <path
        d="M4.65234 8.00002L6.95714 9.04522L8.00234 11.35L9.04754 9.04522L11.3523 8.00002L9.04754 6.95482L8.00234 4.65002L6.95714 6.95482L4.65234 8.00002Z"
        fill="#7F55E0"
      />
      <path
        d="M7.99891 14C5.91521 14 4.07941 12.9347 3.00071 11.32H4.64891L4.64891 9.98003L0.628906 9.98003L0.628906 14H1.96891L1.96891 12.191C3.30221 14.0938 5.49981 15.34 7.99891 15.34C11.2618 15.34 14.0289 13.2161 14.9937 10.2748L13.6805 9.97333C12.8564 12.3116 10.6253 14 7.99891 14Z"
        fill="#7F55E0"
      />
    </g>
    <defs>
      <clipPath id="clip0_189_11220">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const SelectIcon: React.FC<CustomIconProps> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 6L12 3C12 2.4475 11.5525 2 11 2L3 2C2.4475 2 2 2.4475 2 3L2 11C2 11.5525 2.4475 12 3 12L6 12"
      stroke="#171A1F"
      strokeWidth="1.2"
      strokeMiterlimit="10"
      strokeLinecap="round"
    />
    <path
      d="M12.5 12.5L8.5 8.5"
      stroke="#171A1F"
      strokeWidth="1.2"
      strokeMiterlimit="10"
    />
    <path
      d="M8.5 12V8.5H12"
      stroke="#171A1F"
      strokeWidth="1.2"
      strokeMiterlimit="10"
      strokeLinecap="square"
    />
  </svg>
);

export const SaveIcon2: React.FC<CustomIconProps> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.5703 0.719971L11.5703 4.13997"
      stroke="white"
      strokeWidth="1.368"
      strokeMiterlimit="10"
      strokeLinecap="square"
    />
    <path
      d="M13.2833 2.42999L9.86328 2.42999"
      stroke="white"
      strokeWidth="1.368"
      strokeMiterlimit="10"
      strokeLinecap="square"
    />
    <path
      d="M6.99656 2.4444L1.86656 2.4444C1.23728 2.4444 0.726562 2.95512 0.726562 3.58497L0.726562 12.135C0.726562 12.7648 1.23671 13.275 1.86656 13.275L10.4166 13.275C11.0464 13.275 11.5566 12.7648 11.5566 12.135L11.5566 7.00497"
      stroke="white"
      strokeWidth="1.368"
      strokeMiterlimit="10"
      strokeLinecap="round"
    />
    <path
      d="M0.726562 10.43L11.5566 10.43"
      stroke="white"
      strokeWidth="1.368"
      strokeMiterlimit="10"
      strokeLinecap="square"
    />
  </svg>
);

export const AnalysisChartIcon: React.FC<CustomIconProps> = ({ size = 25 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.89844 10.8L9.91844 4.78004L15.0784 9.94004L21.0984 3.92004"
      stroke="white"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="square"
    />
    <path
      d="M4.78906 21.08L4.78906 18.5"
      stroke="white"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="square"
    />
    <path
      d="M9.92969 12.49L9.92969 21.09"
      stroke="white"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="square"
    />
    <path
      d="M15.0703 21.08L15.0703 18.5"
      stroke="white"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="square"
    />
    <path
      d="M20.207 12.49L20.207 21.09"
      stroke="white"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="square"
    />
  </svg>
);

export const ImageIcon2: React.FC<CustomIconProps> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18.1198 0.961914L2.27984 0.961914C1.48455 0.961914 0.839844 1.60662 0.839844 2.40191L0.839844 15.3619C0.839844 16.1572 1.48455 16.8019 2.27984 16.8019L18.1198 16.8019C18.9151 16.8019 19.5598 16.1572 19.5598 15.3619L19.5598 2.40191C19.5598 1.60662 18.9151 0.961914 18.1198 0.961914ZM18.1198 2.40191L18.1198 11.6494L15.7735 9.30401C15.5035 9.03389 15.1372 8.88213 14.7552 8.88213C14.3732 8.88213 14.0069 9.03389 13.7368 9.30401L11.9368 11.104L7.97684 7.14401C7.41457 6.5821 6.50332 6.5821 5.94104 7.14401L2.27984 10.8052L2.27984 2.40191L18.1198 2.40191ZM2.27984 12.8419L6.95984 8.16191L14.1598 15.3619L2.27984 15.3619L2.27984 12.8419ZM18.1198 15.3619H16.1965L12.9565 12.1219L14.7565 10.3219L18.1198 13.6861V15.3619ZM11.6398 6.36191C11.6398 5.76545 12.1234 5.28191 12.7198 5.28191C13.3163 5.28191 13.7998 5.76545 13.7998 6.36191C13.7998 6.95838 13.3163 7.44191 12.7198 7.44191C12.1234 7.44191 11.6398 6.95838 11.6398 6.36191Z"
      fill="currentColor"
    />
  </svg>
);

export const VideoIcon: React.FC<CustomIconProps> = ({
  size = 21,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 21 19"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M13.9508 5.68994L1.05078 5.68994L1.05078 17.7299L13.9508 17.7299L13.9508 5.68994Z"
      stroke="currentColor"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="square"
    />
    <path
      d="M19.9419 16.0099L13.9219 13.4299L13.9219 9.98991L19.9419 7.40991V16.0099Z"
      stroke="currentColor"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="square"
    />
    <path
      d="M13.9425 3.14993V1.42993L7.0625 1.42993"
      stroke="currentColor"
      strokeWidth="2.064"
      strokeMiterlimit="10"
      strokeLinecap="square"
    />
    <path
      d="M4.50063 10C4.97559 10 5.36063 9.61499 5.36063 9.14003C5.36063 8.66506 4.97559 8.28003 4.50063 8.28003C4.02566 8.28003 3.64062 8.66506 3.64062 9.14003C3.64062 9.61499 4.02566 10 4.50063 10Z"
      fill="currentColor"
    />
  </svg>
);

export const PaintBrushIcon: React.FC<CustomIconProps> = ({ size = 21 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 21 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5.15917 20C6.68217 20 7.99917 19.457 9.06917 18.387C10.1922 17.264 10.7762 15.533 10.6202 13.893L19.1842 5.32903C20.4012 4.11203 20.4012 2.13403 19.1822 0.915029C18.0042 -0.264971 15.9482 -0.264971 14.7702 0.915029L5.88617 9.79903C3.97317 9.96803 2.07917 11.32 2.07917 13.718C2.07917 14.021 2.10017 14.306 2.12117 14.578C2.20117 15.609 2.23017 15.996 0.650168 16.786C0.334168 16.944 0.125168 17.258 0.100168 17.61C0.0751678 17.962 0.238168 18.301 0.528168 18.503C0.618168 18.563 2.72117 20 5.15917 20C5.15817 20 5.15817 20 5.15917 20ZM16.1842 2.32803C16.6082 1.90403 17.3422 1.90203 17.7702 2.33003C18.2072 2.76703 18.2072 3.47703 17.7702 3.91403L10.0982 11.586L8.51217 10L16.1842 2.32803ZM4.11617 14.423C4.09817 14.199 4.07917 13.965 4.07917 13.717C4.07917 12.172 5.52417 11.764 6.28917 11.764C6.64517 11.764 6.98817 11.837 7.25317 11.97C8.19817 12.445 8.51317 13.263 8.61017 13.866C8.78717 14.956 8.39317 16.234 7.65417 16.973C6.96317 17.664 6.14717 18 5.15917 18C4.40917 18 3.67917 17.804 3.08417 17.573C4.16617 16.6 4.20517 15.584 4.11617 14.423Z"
      fill="currentColor"
    />
  </svg>
);
