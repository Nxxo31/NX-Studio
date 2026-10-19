import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type Props = {
  number: string;
  name: string;
  tagline: string;
  children: ReactNode;
  onPick: () => void;
};

export default function PatternShell({ number, name, tagline, children, onPick }: Props) {
  return (
    <section className="relative min-h-screen w-full flex flex-col">
      <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b border-nx-border bg-nx-bg/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-nx-text-dim uppercase tracking-widest">Pattern {number}</span>
          <span className="font-display text-sm font-semibold text-nx-text">{name}</span>
          <span className="hidden md:inline font-mono text-xs text-nx-text-dim">— {tagline}</span>
        </div>
        <button
          onClick={onPick}
          className="font-mono text-xs font-bold uppercase tracking-widest px-3 py-1.5 border border-nx-primary bg-nx-primary-tint text-nx-primary hover:bg-nx-primary hover:text-nx-text-on-primary transition"
        >
          Choose this
        </button>
      </div>
      <div className="flex-1 relative">{children}</div>
    </section>
  );
}
