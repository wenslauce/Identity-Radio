import { cn } from "@/lib/utils";

interface CoverArtProps {
  src?: string;
  alt: string;
  className?: string;
}

export const CoverArt = ({ src, alt, className }: CoverArtProps) => {
  return (
    <div className={cn("relative w-48 h-48 rounded-lg overflow-hidden shadow-xl", className)}>
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = "/placeholder.svg";
        }}
      />
    </div>
  );
};