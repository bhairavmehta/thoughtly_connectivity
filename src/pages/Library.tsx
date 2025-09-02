
import { PageTransition } from '@/components/layout/PageTransition';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Filter, Clock, Star, FolderOpen } from 'lucide-react';

export default function Library() {
  return (
    <PageTransition>
      <div className="min-h-screen py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Library</h1>
          
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-thoughtly-subtle h-4 w-4" />
            <Input 
              placeholder="Search your library..." 
              className="neo-input pl-10 pr-4 py-3 h-12"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-thoughtly-subtle hover:text-white">
              <Filter className="h-4 w-4" />
            </button>
          </div>
          
          <Tabs defaultValue="recent" className="mb-6">
            <TabsList className="bg-thoughtly-muted grid w-full max-w-md grid-cols-3 mb-8">
              <TabsTrigger value="recent" className="data-[state=active]:bg-thoughtly-accent data-[state=active]:text-white">
                <Clock className="h-4 w-4 mr-2" />
                Recent
              </TabsTrigger>
              <TabsTrigger value="favorites" className="data-[state=active]:bg-thoughtly-accent data-[state=active]:text-white">
                <Star className="h-4 w-4 mr-2" />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="folders" className="data-[state=active]:bg-thoughtly-accent data-[state=active]:text-white">
                <FolderOpen className="h-4 w-4 mr-2" />
                Folders
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="recent">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="thoughtly-card p-5 hover:bg-thoughtly-card/80 cursor-pointer">
                    <div className="text-xs text-thoughtly-subtle mb-1">
                      {["2 hours ago", "Yesterday", "3 days ago", "Last week", "2 weeks ago"][index]}
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      {[
                        "React 18 feature exploration",
                        "Debugging GraphQL performance",
                        "System architecture proposal",
                        "CI/CD pipeline optimization",
                        "Docker containerization strategy"
                      ][index]}
                    </h3>
                    <p className="text-sm text-thoughtly-subtle line-clamp-2">
                      {[
                        "Investigation of React 18's concurrent rendering features and how to leverage them for improved UX and performance...",
                        "Analysis of bottlenecks in GraphQL queries with nested relational data and implementing dataloader patterns...",
                        "Evaluation of microservices architecture with event-driven communication using Kafka vs RabbitMQ...",
                        "Optimizing GitHub Actions workflow for monorepo structure using path filters and dependency caching...",
                        "Multi-stage Docker build strategy to optimize container size while maintaining consistency across environments..."
                      ][index]}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="favorites">
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="thoughtly-card p-5 hover:bg-thoughtly-card/80 cursor-pointer">
                    <div className="text-xs text-thoughtly-subtle mb-1">
                      {["Jan 12, 2023", "Mar 5, 2023", "Jun 20, 2023"][index]}
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      {[
                        "TypeScript advanced patterns",
                        "Kubernetes deployment strategies",
                        "Web performance optimization guide"
                      ][index]}
                    </h3>
                    <p className="text-sm text-thoughtly-subtle line-clamp-2">
                      {[
                        "Comprehensive guide to advanced TypeScript patterns including discriminated unions, mapped types, and conditional types...",
                        "Analysis of deployment strategies in Kubernetes including rolling updates, blue-green, and canary deployments with pros and cons...",
                        "Complete reference for optimizing web application performance covering Core Web Vitals, bundle optimization, and efficient rendering patterns..."
                      ][index]}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="folders">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="thoughtly-card p-5 hover:bg-thoughtly-card/80 cursor-pointer">
                    <FolderOpen className="h-5 w-5 mb-3 text-thoughtly-accent" />
                    <h3 className="font-medium mb-1">
                      {[
                        "Frontend Development",
                        "Backend Architecture",
                        "DevOps & Infrastructure",
                        "API Design",
                        "Database Optimization",
                        "Tech Research"
                      ][index]}
                    </h3>
                    <p className="text-xs text-thoughtly-subtle">
                      {Math.floor(Math.random() * 15) + 3} items
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
}
