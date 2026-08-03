'use client';


export function FieldError({
  message,
  id,
}: {
  message?: string;
  id?: string;
}) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-xs font-semibold text-destructive" role="alert">
      {message}
    </p>
  );
}
