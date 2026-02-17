interface AuthBadgeProps {
  type: "api-key" | "session" | "admin" | "webhook";
}

const authStyles = {
  "api-key": "bg-purple-100 text-purple-700",
  session: "bg-gray-100 text-gray-700",
  admin: "bg-red-100 text-red-700",
  webhook: "bg-orange-100 text-orange-700",
};

const authLabels = {
  "api-key": "API Key",
  session: "Session",
  admin: "Admin Only",
  webhook: "Webhook Secret",
};

export default function AuthBadge({ type }: AuthBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${authStyles[type]}`}
    >
      {authLabels[type]}
    </span>
  );
}
