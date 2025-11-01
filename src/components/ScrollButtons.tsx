import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ScrollButtons = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 300px or more
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      // Check if we're at the bottom of the page
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      // Allow 50px threshold for "at bottom"
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        setIsAtBottom(true);
      } else {
        setIsAtBottom(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-3">
      <Button
        onClick={scrollToTop}
        size="icon"
        className={cn(
          "h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-all opacity-65",
          "bg-primary hover:bg-primary/90"
        )}
        aria-label="Вверх"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      
      <Button
        onClick={scrollToBottom}
        size="icon"
        className={cn(
          "h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-all opacity-65",
          "bg-primary hover:bg-primary/90",
          isAtBottom && "opacity-10 cursor-not-allowed"
        )}
        disabled={isAtBottom}
        aria-label="Вниз"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
};
