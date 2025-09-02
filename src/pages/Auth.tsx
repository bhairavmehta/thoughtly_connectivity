
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PageTransition } from '@/components/layout/PageTransition';
import { ThoughtlyLogo } from '@/components/ThoughtlyLogo';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get intended destination from location state, default to /home instead of /
  const from = (location.state as { from?: string })?.from || '/home';

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/home', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        navigate('/home', { replace: true }); // Redirect to /home instead of from
      } else {
        await signUp(email, password);
        // Stay on the page after signup to let user check email
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex items-center justify-center min-h-screen bg-thoughtly p-4">
        <Card className="w-full max-w-md bg-thoughtly-card border-thoughtly-border">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <ThoughtlyLogo className="h-10 w-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-center">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin 
                ? 'Enter your credentials to access your account' 
                : 'Enter your information to create an account'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-thoughtly-muted text-white border-thoughtly-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-thoughtly-muted text-white border-thoughtly-border"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full thoughtly-button" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></span>
                    {isLogin ? 'Signing in...' : 'Signing up...'}
                  </span>
                ) : (
                  isLogin ? 'Sign in' : 'Sign up'
                )}
              </Button>
              <Button
                type="button"
                variant="link"
                className="text-thoughtly-subtle hover:text-white w-full"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}
