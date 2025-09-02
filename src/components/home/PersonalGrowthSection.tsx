import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { 
  Carousel,
  CarouselContent,
  CarouselItem
} from "@/components/ui/carousel";

// Audience-specific content
const audienceContent = [
  {
    audience: "Marketers",
    title: "Save and find quotes & highlights",
    subtitle: "that inspire you.",
    description: "The digital landscape is saturated with content. Thoughtly helps marketers capture and organize the most impactful ideas, giving you a competitive edge in crafting compelling campaigns.",
    quote: "\"True change is within.\""
  },
  {
    audience: "Designers",
    title: "Collect visual inspiration",
    subtitle: "for your next big project.",
    description: "Design is about making connections between disparate ideas. Thoughtly helps you build a visual library of inspiration that you can easily reference when creativity strikes.",
    quote: "\"Simplicity is the ultimate sophistication.\""
  },
  {
    audience: "Writers",
    title: "Capture fleeting thoughts",
    subtitle: "before they disappear.",
    description: "Great writing comes from making unexpected connections. Thoughtly helps you organize your ideas, quotes, and references in one place, making your writing process smoother and more inspired.",
    quote: "\"Words can change the world.\""
  },
  {
    audience: "Researchers",
    title: "Connect disparate insights",
    subtitle: "to reveal new patterns.",
    description: "Research requires both deep focus and broad connections. Thoughtly helps you organize complex information, highlight patterns, and track your sources with ease.",
    quote: "\"Discovery begins with observation.\""
  },
  {
    audience: "Developers",
    title: "Document code solutions",
    subtitle: "for future reference.",
    description: "Programming is about solving problems. Thoughtly helps you document your solutions, organize code snippets, and capture technical insights you'll need later.",
    quote: "\"Code is poetry with logic.\""
  },
  {
    audience: "Everyone",
    title: "Organize your digital life",
    subtitle: "with powerful AI assistance.",
    description: "In an age of information overload, clarity is precious. Thoughtly helps you cut through the noise to capture what truly matters to you.",
    quote: "\"Knowledge organized is knowledge multiplied.\""
  }
];

const growthTools = [
  // First set
  "Knowledge Hub",
  "Idea Polishing",
  "Learning Journal",
  "Insight Tracker",
  // Second set
  "Mental Models",
  "Research Notes",
  "Creative Workshop",
  "Reflection Journal",
  // Third set
  "Research Paper",
  "Market Research",
  "Academic Notes",
  "Competitor Analysis",
  // Fourth set
  "Literature Review",
  "Content Calendar",
  "Problem Solving",
  "Study Planner"
];

export function PersonalGrowthSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeAudience, setActiveAudience] = useState("Marketers");
  const totalSets = 4;
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: "start",
    duration: 80,
    dragFree: true
  });

  useEffect(() => {
    if (!emblaApi) return;

    const timer = setInterval(() => {
      const nextSlide = (currentSlide + 1) % totalSets;
      setCurrentSlide(nextSlide);
      emblaApi.scrollTo(nextSlide, true);
    }, 5000);

    const onSelect = () => {
      setCurrentSlide(emblaApi.selectedScrollSnap());
    };
    
    emblaApi.on('select', onSelect);

    return () => {
      clearInterval(timer);
      emblaApi?.off('select', onSelect);
    };
  }, [currentSlide, emblaApi]);

  const handleDotClick = (index: number) => {
    if (emblaApi) {
      emblaApi.scrollTo(index, true);
      setCurrentSlide(index);
    }
  };

  const selectedContent = audienceContent.find(content => content.audience === activeAudience) || audienceContent[0];

  return (
    <>
      {/* Tools Section - Now First */}
      <section className="py-20 px-4 bg-gradient-to-b from-thoughtly to-thoughtly-card/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Research & Strategy</h2>
            <div className="flex justify-center gap-3 mt-8">
              {Array.from({ length: totalSets }).map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-2 w-2 rounded-full cursor-pointer transition-all duration-700 ${
                    index === currentSlide 
                      ? 'bg-thoughtly-accent scale-150' 
                      : 'bg-thoughtly-border/30'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDotClick(index)}
                />
              ))}
            </div>
          </motion.div>

          <div className="overflow-hidden transition-all duration-700" ref={emblaRef}>
            <div className="flex">
              {Array.from({ length: totalSets }).map((_, setIndex) => (
                <div 
                  key={setIndex} 
                  className="min-w-0 flex-[0_0_100%] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4"
                >
                  {growthTools.slice(setIndex * 4, (setIndex + 1) * 4).map((tool, index) => (
                    <motion.div
                      key={tool}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: index * 0.15, 
                        duration: 0.7
                      }}
                      className="aspect-[4/3] flex items-center justify-center p-8 rounded-2xl 
                        bg-gradient-to-br from-thoughtly-card/80 to-thoughtly-card/50
                        backdrop-blur-sm border border-thoughtly-border/10
                        hover:border-thoughtly-accent/30 hover:bg-thoughtly-card/80
                        hover:scale-105 hover:shadow-xl hover:shadow-thoughtly-accent/5
                        transition-all duration-700 group cursor-pointer"
                    >
                      <h3 className="text-2xl font-medium text-center 
                        text-thoughtly-foreground/90 group-hover:text-thoughtly-accent 
                        transition-colors duration-700"
                      >
                        {tool}
                      </h3>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Audience Cards Section - Now Second */}
      <section className="py-20 px-4 bg-[#1A1F2C] bg-gradient-to-t from-thoughtly to-thoughtly-card/50">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-5xl font-bold mb-16 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent"
          >
            For visual minds of all kinds.
          </motion.h2>

          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {audienceContent.map((content, index) => (
              <motion.button
                key={content.audience}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`px-8 py-3 rounded-full border text-lg transition-all duration-500 ease-out ${
                  activeAudience === content.audience 
                    ? "border-thoughtly-accent text-thoughtly-accent bg-thoughtly-card/30" 
                    : "border-thoughtly-border hover:border-thoughtly-accent hover:text-thoughtly-accent"
                }`}
                onClick={() => setActiveAudience(content.audience)}
              >
                {content.audience}
              </motion.button>
            ))}
          </div>

          <motion.div 
            key={activeAudience}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 text-white rounded-2xl overflow-hidden backdrop-blur-sm border border-white/10 shadow-2xl transition-all duration-700 ease-out"
          >
            <div className="p-10 md:p-16">
              <div className="text-center mb-8">
                <div className="text-sm font-medium mb-2 text-blue-300">MADE FOR {activeAudience.toUpperCase()}</div>
                <h3 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{selectedContent.title}</h3>
                <p className="text-3xl md:text-4xl italic font-light text-white/80">{selectedContent.subtitle}</p>
              </div>

              <div className="max-w-4xl mx-auto my-10">
                <p className="text-lg leading-relaxed text-white/90">
                  {selectedContent.description}
                </p>
              </div>

              <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-md p-8 rounded-xl text-center border border-white/10">
                <p className="text-2xl italic font-medium text-white/90">{selectedContent.quote}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
