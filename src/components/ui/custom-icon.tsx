import * as React from "react";
import { SVGProps } from "react";

type CustomIconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  color?: string;
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
