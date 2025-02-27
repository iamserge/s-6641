
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Add new pastel variants
        pastelPink: 
          "border-transparent bg-[#FFDEE2] text-pink-700 hover:bg-[#FFDEE2]/80",
        pastelBlue: 
          "border-transparent bg-[#D3E4FD] text-blue-700 hover:bg-[#D3E4FD]/80",
        pastelGreen: 
          "border-transparent bg-[#F2FCE2] text-green-700 hover:bg-[#F2FCE2]/80",
        pastelPurple: 
          "border-transparent bg-[#E5DEFF] text-purple-700 hover:bg-[#E5DEFF]/80",
        pastelYellow: 
          "border-transparent bg-[#FEF7CD] text-amber-700 hover:bg-[#FEF7CD]/80",
        pastelOrange: 
          "border-transparent bg-[#FEC6A1] text-orange-700 hover:bg-[#FEC6A1]/80",
        pastelPeach: 
          "border-transparent bg-[#FDE1D3] text-orange-800 hover:bg-[#FDE1D3]/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
