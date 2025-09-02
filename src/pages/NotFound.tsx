
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-thoughtly px-4">
      <div className="text-center max-w-md">
        <div className="inline-block p-5 rounded-full bg-thoughtly-accent/10 mb-6">
          <div className="text-6xl">404</div>
        </div>
        <h1 className="text-4xl font-bold mb-4 text-white">Page not found</h1>
        <p className="text-thoughtly-subtle mb-8">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track.
        </p>
        <Button asChild className="thoughtly-button">
          <Link to="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
