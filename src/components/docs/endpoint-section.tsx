"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import MethodBadge from "./method-badge";
import AuthBadge from "./auth-badge";
import CodeBlock from "./code-block";

interface EndpointSectionProps {
  id: string;
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  path: string;
  description: string;
  auth: "api-key" | "session" | "admin" | "webhook";
  requestBody?: string;
  responseBody?: string;
  curlExample?: string;
  queryParams?: { name: string; description: string; required?: boolean }[];
  notes?: string;
}

export default function EndpointSection({
  id,
  method,
  path,
  description,
  auth,
  requestBody,
  responseBody,
  curlExample,
  queryParams,
  notes,
}: EndpointSectionProps) {
  const [showCurl, setShowCurl] = useState(false);

  return (
    <section id={id} className="py-8 border-b border-gray-200 scroll-mt-20">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <MethodBadge method={method} />
        <code className="text-lg font-mono font-semibold text-slate-800">{path}</code>
        <AuthBadge type={auth} />
      </div>

      <p className="text-gray-600 mb-6">{description}</p>

      {queryParams && queryParams.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Query Parameters</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-2">Parameter</th>
                  <th className="pb-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {queryParams.map((param) => (
                  <tr key={param.name} className="border-t border-gray-200">
                    <td className="py-2">
                      <code className="text-purple-600">{param.name}</code>
                      {param.required && (
                        <span className="ml-1 text-red-500 text-xs">required</span>
                      )}
                    </td>
                    <td className="py-2 text-gray-600">{param.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {requestBody && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Request Body</h4>
          <CodeBlock code={requestBody} language="json" />
        </div>
      )}

      {responseBody && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Response</h4>
          <CodeBlock code={responseBody} language="json" />
        </div>
      )}

      {notes && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">{notes}</p>
        </div>
      )}

      {curlExample && (
        <div className="mb-4">
          <button
            onClick={() => setShowCurl(!showCurl)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showCurl ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            cURL Example
          </button>
          {showCurl && <CodeBlock code={curlExample} language="bash" />}
        </div>
      )}
    </section>
  );
}
