import { VariantProps } from "class-variance-authority";
import { badgeVariants } from "./badge.styles";

/**
 * Props for the Badge component
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}
