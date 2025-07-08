import * as React from "react"
import { cn } from "@/src/lib/utils"
import { useTheme } from "@/src/context/theme"
import { cardStyles } from "./card.styles"
import {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
} from "./card.types"
import "./card.css"

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    const { theme } = useTheme();
    
    return (
      <div
        ref={ref}
        className={cn(cardStyles.base, className, "card")}
        {...props}
      />
    );
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    const { theme } = useTheme();
    
    return (
      <div
        ref={ref}
        className={cn(cardStyles.header, className, "card-header")}
        {...props}
      />
    );
  }
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    const { theme } = useTheme();
    
    return (
      <h3
        ref={ref}
        className={cn(cardStyles.title, className, "card-title")}
        {...props}
      />
    );
  }
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => {
    const { theme } = useTheme();
    
    return (
      <p
        ref={ref}
        className={cn(cardStyles.description, className, "card-description")}
        {...props}
      />
    );
  }
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    const { theme } = useTheme();
    
    return (
      <div 
        ref={ref} 
        className={cn(cardStyles.content, className, "card-content")} 
        {...props} 
      />
    );
  }
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    const { theme } = useTheme();
    
    return (
      <div
        ref={ref}
        className={cn(cardStyles.footer, className, "card-footer")}
        {...props}
      />
    );
  }
)
CardFooter.displayName = "CardFooter"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent 
}
