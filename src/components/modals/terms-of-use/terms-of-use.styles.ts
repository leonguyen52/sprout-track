import { cva } from "class-variance-authority";

/**
 * Terms of Use modal variant styles using class-variance-authority
 * Defines all visual variations of the terms of use modal component
 */
export const termsOfUseModalStyles = {
  container: "max-w-2xl w-full mx-auto",
  header: "mb-4",
  title: "text-xl font-semibold text-slate-800",
  description: "text-sm text-slate-500",
  content: "prose prose-slate max-w-none dark:prose-invert",
  markdown: "overflow-y-auto max-h-[60vh] pr-2",
  footer: "flex justify-end mt-6",
  closeButton: "bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
};
