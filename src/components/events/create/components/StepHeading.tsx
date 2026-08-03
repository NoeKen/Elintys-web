'use client';


interface StepHeadingProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export function StepHeading({ eyebrow, title, subtitle }: StepHeadingProps) {
  return (
    <div className="mb-10 max-w-3xl">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-event-teal">
        {eyebrow}
      </p>
      <h1 className="font-serif text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.02em] text-event-petrol">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-event-muted">
        {subtitle}
      </p>
    </div>
  );
}
