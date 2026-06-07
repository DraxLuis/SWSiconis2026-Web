'use client';


interface PageHeaderProps {
  sectionLabel: string;
  icon: React.ElementType;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  sectionLabel, icon: Icon, title, description, actions
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-white/[0.05] animate-fade-in">
      <div>
        <div className="section-label mb-2">
          <Icon className="h-3.5 w-3.5" />
          {sectionLabel}
        </div>
        <h1 className="page-title">{title}</h1>
        {description && (
          <p className="text-[12px] text-[#4A6080] mt-1.5 font-medium max-w-xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
