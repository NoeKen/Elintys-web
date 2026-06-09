import Link from 'next/link';

interface CategoryChipProps {
  label: string;
  href: string;
  active?: boolean;
}

export function CategoryChip({ label, href, active = false }: CategoryChipProps) {
  return (
    <Link href={href} className={`category-chip${active ? ' active' : ''}`}>
      {label}
    </Link>
  );
}
