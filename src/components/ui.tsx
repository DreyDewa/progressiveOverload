import Link from 'next/link';
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-lime-400 text-zinc-950',
  secondary: 'bg-zinc-800 text-zinc-100',
  danger: 'bg-rose-500/15 text-rose-300',
  ghost: 'bg-transparent text-zinc-300',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={`min-h-11 rounded-xl px-4 font-medium disabled:opacity-50 ${buttonVariants[variant]} ${className}`}
    />
  );
}

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-4 ${className}`} />;
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full min-h-11 rounded-xl bg-zinc-950 border border-zinc-800 px-3 text-base focus:outline-none focus:border-lime-400 ${className}`}
    />
  );
}

export function PageHeader({ title, back, right }: { title: string; back?: string; right?: ReactNode }) {
  return (
    <header className="mb-4">
      {back && (
        <Link href={back} className="inline-flex items-center min-h-11 text-sm text-zinc-400">
          ‹ Back
        </Link>
      )}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {right}
      </div>
    </header>
  );
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="text-sm text-rose-400">{children}</p>;
}
