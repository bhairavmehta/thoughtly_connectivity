
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export function HeroSection() {
  const { user } = useAuth();
  
  // Get the display name (username from email or full email)
  const displayName = user?.email ? user.email.split('@')[0] : '';
  
  return (
    <section className="py-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto text-center"
      >
        <motion.h1 
          className="text-6xl font-bold mb-6 bg-gradient-to-r from-thoughtly-accent to-blue-500 bg-clip-text text-transparent"
        >
          {user ? `${displayName}'s` : 'Your'} Personal AI Engine
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-thoughtly-subtle mb-8"
        >
          All your notes, bookmarks, inspirations, articles and images in one single, private second brain, accessible anywhere, anytime.
        </motion.p>
      </motion.div>
    </section>
  );
}
