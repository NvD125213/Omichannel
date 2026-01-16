import React from "react";
import { Mail, Briefcase, Building2, LucideIcon, Settings } from "lucide-react";

interface DepartmentDetailCardProps {
  name: string;
  email?: string;
  tenant?: string;
  description: string;
  icon?: LucideIcon;
}

export function DepartmentDetailCard({
  name,
  email,
  tenant,
  description,
  icon: Icon = Settings,
}: DepartmentDetailCardProps) {
  return (
    <div className="w-full max-w-md group">
      <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-300 hover:border-gray-300">
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon with pulsing rings */}
            <div className="relative flex-shrink-0">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Icon className="h-5 w-5 text-white" strokeWidth={2} />
              </div>

              {/* Online indicator */}
              <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-white">
                <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate font-semibold text-gray-900 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:via-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                  {name}
                </h3>
                <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Hoạt động
                </span>
              </div>

              {/* Meta */}
              <div className="mt-1 space-y-1">
                {tenant && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="truncate">{tenant}</span>
                  </div>
                )}

                {email && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-blue-600 transition-colors">
                    <Mail className="h-3.5 w-3.5" />
                    <a
                      href={`mailto:${email}`}
                      className="truncate hover:text-blue-700 hover:underline"
                    >
                      {email}
                    </a>
                  </div>
                )}
              </div>

              {description && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2 group-hover:text-gray-700 transition-colors">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom gradient line */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
    </div>
  );
}
