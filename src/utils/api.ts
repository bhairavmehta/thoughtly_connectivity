import { useToast } from '@/hooks/use-toast';

export class ApiError extends Error {
  public status?: number;
  public data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function handleApiResponse(response: Response) {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    let errorData;
    
    try {
      errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new ApiError(errorMessage, response.status, errorData);
  }
  
  return response.json();
}

export function useApiErrorHandler() {
  const { toast } = useToast();
  
  const handleError = (error: unknown) => {
    if (error instanceof ApiError) {
      // Handle specific API errors
      switch (error.status) {
        case 400:
          toast({
            title: "Invalid Request",
            description: error.message,
            variant: "destructive"
          });
          break;
        case 401:
          toast({
            title: "Authentication Required",
            description: "Please log in to continue",
            variant: "destructive"
          });
          break;
        case 403:
          toast({
            title: "Access Denied",
            description: "You don't have permission to perform this action",
            variant: "destructive"
          });
          break;
        case 404:
          toast({
            title: "Not Found",
            description: error.message,
            variant: "destructive"
          });
          break;
        case 500:
          toast({
            title: "Server Error",
            description: "Something went wrong on our end. Please try again later.",
            variant: "destructive"
          });
          break;
        default:
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive"
          });
      }
    } else {
      // Handle general errors
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  
  return { handleError };
}