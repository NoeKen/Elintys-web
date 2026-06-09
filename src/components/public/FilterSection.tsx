interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

export function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <div className="filter-section">
      <p className="filter-section-title">{title}</p>
      {children}
    </div>
  );
}
