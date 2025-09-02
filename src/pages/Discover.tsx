
import { PageTransition } from '@/components/layout/PageTransition';

export default function Discover() {
  return (
    <PageTransition>
      <div className="min-h-screen py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Discover</h1>
          <p className="text-thoughtly-subtle mb-8">
            Explore trending topics and popular discussions from the Thoughtly community.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="thoughtly-card p-5">
                <div className="mb-2 text-sm text-thoughtly-subtle">Trending Topic</div>
                <h3 className="text-xl font-medium mb-2">
                  {[
                    "AI-powered productivity tools",
                    "Mindfulness and creativity",
                    "Knowledge management systems",
                    "Learning techniques for complex topics"
                  ][index]}
                </h3>
                <p className="text-sm text-thoughtly-subtle">
                  {Math.floor(Math.random() * 200) + 50} discussions
                </p>
              </div>
            ))}
          </div>
          
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Featured Discussions</h2>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="thoughtly-card p-5">
                  <div className="flex justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-thoughtly-accent flex items-center justify-center">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <div>
                        <div className="font-medium">
                          {["Alex Johnson", "Taylor Smith", "Jordan Lee"][index]}
                        </div>
                        <div className="text-xs text-thoughtly-subtle">
                          {["2 hours ago", "Yesterday", "3 days ago"][index]}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-thoughtly-subtle">
                      {Math.floor(Math.random() * 50) + 10} replies
                    </div>
                  </div>
                  <h3 className="text-xl font-medium mb-2">
                    {[
                      "How do you organize your digital notes?",
                      "Best practices for creative brainstorming",
                      "Using AI to enhance your thinking process"
                    ][index]}
                  </h3>
                  <p className="text-thoughtly-subtle">
                    {[
                      "I've been trying different note-taking apps but still haven't found the perfect system...",
                      "I've discovered some techniques that really helped me overcome creative blocks...",
                      "I'm curious how others are using AI tools to support their thinking and creative work..."
                    ][index]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
