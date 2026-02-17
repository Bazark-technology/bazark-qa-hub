interface MethodBadgeProps {
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
}

const methodStyles = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-blue-100 text-blue-700",
  PATCH: "bg-amber-100 text-amber-700",
  PUT: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
};

export default function MethodBadge({ method }: MethodBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${methodStyles[method]}`}
    >
      {method}
    </span>
  );
}
