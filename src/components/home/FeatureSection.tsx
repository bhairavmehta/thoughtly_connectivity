
import { Brain, LayoutGrid, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Brain,
    title: "Spatial Thinking",
    description: "Visualize ideas with brain cells, lists, galleries, tables, maps, or timelines."
  },
  {
    icon: LayoutGrid,
    title: "Contextual",
    description: "Create sub-brains tailored to specific projects or tasks."
  },
  {
    icon: Search,
    title: "Search",
    description: "Find what you're looking for with intelligent, precision-focused search capabilities."
  }
];

export function FeatureSection() {
  return (
    <section className="py-20 px-4 bg-thoughtly-card/50">
      <div className="max-w-6xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-16 text-thoughtly-accent"
        >
          Organize
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-xl bg-thoughtly-card border border-thoughtly-border hover:border-thoughtly-accent/50 transition-all duration-300"
            >
              <feature.icon className="w-10 h-10 text-thoughtly-accent mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-thoughtly-subtle">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

