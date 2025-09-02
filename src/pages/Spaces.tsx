
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { Plus, FolderPlus } from 'lucide-react';

export default function Spaces() {
  return (
    <PageTransition>
      <div className="min-h-screen py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Spaces</h1>
            <Button className="thoughtly-button flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>New Space</span>
            </Button>
          </div>
          
          <p className="text-thoughtly-subtle mb-8">
            Spaces help you organize your thoughts and ideas into dedicated environments.
          </p>
          
          {/* Spaces grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create new space card */}
            <div className="thoughtly-card p-6 flex flex-col items-center justify-center min-h-[200px] border-dashed">
              <FolderPlus className="h-10 w-10 text-thoughtly-subtle mb-4" />
              <p className="text-center text-thoughtly-subtle mb-4">Create a new space to organize your thoughts</p>
              <Button variant="outline" className="thoughtly-button-outline">
                Create Space
              </Button>
            </div>
            
            {/* Example spaces */}
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="thoughtly-card p-6 min-h-[200px] flex flex-col">
                <div className="mb-4 flex justify-between items-start">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-thoughtly-accent to-purple-500 flex items-center justify-center">
                    {["F", "B", "D", "A", "R"][index]}
                  </div>
                  <div className="text-xs px-2 py-1 rounded-full bg-thoughtly-muted text-thoughtly-subtle">
                    {Math.floor(Math.random() * 20) + 1} thoughts
                  </div>
                </div>
                <h3 className="text-xl font-medium mb-2">
                  {[
                    "Frontend Projects",
                    "Backend Systems",
                    "DevOps Infrastructure",
                    "API Documentation",
                    "Research & Learning"
                  ][index]}
                </h3>
                <p className="text-sm text-thoughtly-subtle mb-4 flex-1">
                  {[
                    "React, Vue, and Next.js implementation projects",
                    "Node.js and microservices architecture",
                    "Docker, Kubernetes, and CI/CD pipelines",
                    "REST and GraphQL API specs and examples",
                    "Tech papers, courses, and new technology exploration"
                  ][index]}
                </p>
                <div className="text-xs text-thoughtly-subtle mt-auto">
                  Last updated: {["Today", "Yesterday", "3 days ago", "Last week", "2 weeks ago"][index]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
