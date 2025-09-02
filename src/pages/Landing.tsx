
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Lightbulb, Sparkles, LineChart, BookOpen, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThoughtlyLogo } from '@/components/ThoughtlyLogo';

const heroVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.8,
      staggerChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

const featureCardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5 }
  },
  hover: { 
    scale: 1.05, 
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
    transition: { duration: 0.2 }
  }
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-thoughtly overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 py-4 px-6 bg-thoughtly/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <ThoughtlyLogo className="flex-shrink-0" />
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-thoughtly-subtle hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-thoughtly-subtle hover:text-white transition-colors">How it Works</a>
            <a href="#testimonials" className="text-thoughtly-subtle hover:text-white transition-colors">Testimonials</a>
          </nav>
          <div className="flex items-center space-x-4">
            <Link to="/auth">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                Log In
              </Button>
            </Link>
            <Link to="/auth?signup=true">
              <Button size="sm" className="bg-gradient-to-r from-thoughtly-accent to-blue-500 hover:opacity-90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <motion.div 
          className="max-w-6xl mx-auto text-center relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={heroVariants}
        >
          <motion.div 
            className="absolute -z-10 top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-thoughtly-accent/20 blur-[100px]"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5] 
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          
          <motion.span 
            className="inline-block px-4 py-1.5 rounded-full bg-thoughtly-accent/10 text-thoughtly-accent text-sm font-medium mb-8"
            variants={itemVariants}
          >
            <Sparkles className="inline-block w-4 h-4 mr-2" />
            Meet your second brain
          </motion.span>
          
          <motion.h1 
            className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent leading-tight"
            variants={itemVariants}
          >
            Organize your thoughts <br className="hidden md:block" /> with AI assistance
          </motion.h1>
          
          <motion.p 
            className="text-xl text-thoughtly-subtle max-w-3xl mx-auto mb-10"
            variants={itemVariants}
          >
            Thoughtly helps you capture, connect, and visualize ideas in a beautiful, 
            private second brain that grows smarter as you use it.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row justify-center items-center gap-4"
            variants={itemVariants}
          >
            <Link to="/auth?signup=true">
              <Button size="lg" className="bg-gradient-to-r from-thoughtly-accent to-blue-500 hover:opacity-90 px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg">
                See How It Works
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-thoughtly-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1.5 rounded-full bg-thoughtly-accent/10 text-thoughtly-accent text-sm font-medium mb-4"
            >
              Key Features
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-6"
            >
              Everything you need to organize your mind
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-thoughtly-subtle max-w-3xl mx-auto"
            >
              Thoughtly combines powerful AI with intuitive design to help you think better.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="p-8 rounded-xl bg-thoughtly-card border border-thoughtly-border hover:border-thoughtly-accent/30 transition-all duration-300"
                initial="hidden"
                whileInView="visible"
                whileHover="hover"
                viewport={{ once: true, margin: "-50px" }}
                variants={featureCardVariants}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-thoughtly-accent/10 text-thoughtly-accent mb-6">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-thoughtly-subtle">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1.5 rounded-full bg-thoughtly-accent/10 text-thoughtly-accent text-sm font-medium mb-4"
            >
              How It Works
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-6"
            >
              Start organizing your thoughts in minutes
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connection line between steps */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-thoughtly-accent/30 to-transparent"></div>
            
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative text-center"
              >
                <div className="relative z-10 w-16 h-16 flex items-center justify-center mx-auto mb-6 rounded-full bg-gradient-to-br from-thoughtly-accent to-blue-500 text-white font-bold text-xl">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-thoughtly-subtle">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 bg-thoughtly-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1.5 rounded-full bg-thoughtly-accent/10 text-thoughtly-accent text-sm font-medium mb-4"
            >
              What People Say
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-6"
            >
              Loved by thinkers everywhere
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-xl bg-thoughtly-card border border-thoughtly-border"
              >
                <div className="flex items-center space-x-1 mb-4 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-thoughtly-subtle italic mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-thoughtly-accent to-blue-500 flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{testimonial.name}</p>
                    <p className="text-sm text-thoughtly-subtle">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <motion.div
          className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-thoughtly-accent/10 blur-[100px]"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3] 
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent"
          >
            Start organizing your thoughts today
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-thoughtly-subtle mb-10"
          >
            Join thousands of thinkers who've transformed how they capture and connect ideas.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Link to="/auth?signup=true">
              <Button size="lg" className="bg-gradient-to-r from-thoughtly-accent to-blue-500 hover:opacity-90 px-10">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="mt-4 text-sm text-thoughtly-subtle">No credit card required</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-thoughtly-card">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <ThoughtlyLogo className="mb-6 md:mb-0" />
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
              <a href="#features" className="text-thoughtly-subtle hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-thoughtly-subtle hover:text-white transition-colors">How it Works</a>
              <a href="#testimonials" className="text-thoughtly-subtle hover:text-white transition-colors">Testimonials</a>
              <Link to="/auth" className="text-thoughtly-subtle hover:text-white transition-colors">Log In</Link>
              <Link to="/auth?signup=true" className="text-thoughtly-subtle hover:text-white transition-colors">Sign Up</Link>
            </div>
          </div>
          <div className="border-t border-thoughtly-border pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-thoughtly-subtle mb-4 md:mb-0">© 2024 Thoughtly. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="text-thoughtly-subtle hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="text-thoughtly-subtle hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="text-thoughtly-subtle hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Features content
const features = [
  {
    icon: Brain,
    title: "AI-Powered Organization",
    description: "Our AI assistant helps you organize thoughts, generate connections, and discover patterns you might miss."
  },
  {
    icon: Sparkles,
    title: "Beautiful Visualizations",
    description: "See your ideas come to life with interactive mind maps, networks, and other visual representations."
  },
  {
    icon: LineChart,
    title: "Track Your Progress",
    description: "Monitor how your ideas evolve and grow over time with detailed analytics and insights."
  },
  {
    icon: Lightbulb,
    title: "Idea Generation",
    description: "Stuck? Let Thoughtly help you brainstorm new ideas and approaches to overcome creative blocks."
  },
  {
    icon: BookOpen,
    title: "Knowledge Library",
    description: "Build your personal knowledge base that grows and evolves as you add more information."
  },
  {
    icon: CheckCircle,
    title: "Capture Everything",
    description: "Easily save text, images, links, and voice notes in one secure, searchable location."
  }
];

// How it works steps
const steps = [
  {
    title: "Sign Up",
    description: "Create your free account and set up your personal thought space in just a few clicks."
  },
  {
    title: "Add Your Thoughts",
    description: "Start adding ideas, notes, and concepts through text, voice, or images."
  },
  {
    title: "Connect & Organize",
    description: "Watch as Thoughtly helps you discover connections and organize your thinking."
  }
];

// Testimonials
const testimonials = [
  {
    quote: "Thoughtly has completely transformed how I organize my research. The AI suggestions are genuinely helpful and the visual maps make complex topics easier to understand.",
    name: "Alex Chen",
    role: "Academic Researcher"
  },
  {
    quote: "As a creative director, I need to keep track of countless ideas. Thoughtly doesn't just store them - it helps me develop them in ways I wouldn't have considered.",
    name: "Sarah Johnson",
    role: "Creative Director"
  },
  {
    quote: "The interface is beautiful and intuitive. I've tried many note-taking and mind-mapping tools, but Thoughtly is the first one that actually enhances my thinking.",
    name: "Michael Rivera",
    role: "Product Designer"
  }
];
