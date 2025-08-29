import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Zap, 
  Palette, 
  Layers, 
  Eye, 
  Shield, 
  ArrowRight, 
  Star,
  Image,
  Wand2,
  Globe,
  Users,
  Clock,
  Play,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import bgHero from '/images/bg-hero.webp';

export default function Landing() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  const bannerImages = [
    '/images/eg.webp',
    '/images/eg2.webp',
    '/images/eg3.jpg',
    '/images/nano-banana.png'
  ];

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [bannerImages.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const features = [
    {
      icon: <Palette className="h-6 w-6" />,
      title: "Visual Consistency",
      description: "Maintains style and consistency across every edit with precision.",
      color: "from-slate-600 to-slate-800"
    },
    {
      icon: <Wand2 className="h-6 w-6" />,
      title: "Natural Language",
      description: "Edit images using simple text descriptions.",
      color: "from-slate-600 to-slate-800"
    },
    {
      icon: <Layers className="h-6 w-6" />,
      title: "Multi-Image Blending",
      description: "Seamlessly merge and blend multiple images together.",
      color: "from-slate-600 to-slate-800"
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: "Scene Building",
      description: "Build complex scenes step by step with AI assistance.",
      color: "from-slate-600 to-slate-800"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Smart Editing",
      description: "AI understands context and applies intelligent edits.",
      color: "from-slate-600 to-slate-800"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Instant processing with professional-grade results.",
      color: "from-slate-600 to-slate-800"
    }
  ];

  const testimonials = [
    {
      quote: "It's like 65–70% of Photoshop quality and that's ridiculous.",
      author: "Tedinasuit",
      platform: "Reddit"
    },
    {
      quote: "Massive jump forward in image editing for real-world usability.",
      author: "Creative Community",
      platform: "Reddit"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">NB</span>
              </div>
              <span className="text-xl font-bold text-white">
                Nano Banana
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/chat">
                <Button className="bg-white text-black hover:bg-white/90 px-6">
                  Try Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center px-4 sm:px-6">
        {/* Hero Background Image */}
        <div className="fixed inset-0 z-0">
          <img 
            src={bgHero} 
            alt="Hero Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 sm:mb-10 bg-white/15 text-white border-white/30 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium backdrop-blur-sm">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-pulse" />
            New Release
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 sm:mb-10 leading-tight tracking-tight px-4">
            AI Image Creator
            <br />
            <span className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">& Editor</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/95 max-w-3xl mx-auto mb-10 sm:mb-16 leading-relaxed font-light px-4">
            Nano Banana is the next-generation AI image creator and editor that generates images from scratch or transforms existing ones with speed, consistency, and creative freedom.
          </p>
          <div className="flex justify-center">
            <Link to="/chat">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 hover:scale-105 transform transition-all duration-300 px-6 sm:px-10 py-4 sm:py-6 text-lg sm:text-xl font-semibold shadow-2xl shadow-white/20">
                Start Creating
                <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Hero Visual - Sliding Banner */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              See Nano Banana in Action
            </h2>
            <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto px-4">
              Real examples of AI-powered image editing at its finest
            </p>
          </div>
          
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 bg-white/5 backdrop-blur-sm shadow-2xl">
            {/* Slides Container */}
            <div className="relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
              {bannerImages.map((image, index) => (
                <div
                  key={index}
                  className={cn(
                    "absolute inset-0 transition-all duration-1000 ease-in-out",
                    index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-110"
                  )}
                >
                  <img
                    src={image}
                    alt={`Nano Banana Example ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                </div>
              ))}
              
              {/* Slide Content Overlay */}
              <div className="absolute inset-0 flex items-end p-4 sm:p-8 md:p-12">
                <div className="text-white">
                  {/* Content removed as requested */}
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 sm:p-3 md:p-4 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 shadow-lg"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 sm:p-3 md:p-4 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 shadow-lg"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
            </button>

            {/* Slide Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
              {bannerImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "w-4 h-4 rounded-full transition-all duration-300 hover:scale-110",
                    index === currentSlide 
                      ? "bg-white scale-125 shadow-lg" 
                      : "bg-white/60 hover:bg-white/80"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              What Makes It Special
            </h2>
            <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed px-4">
              Discover the unique capabilities that set Nano Banana apart from traditional image editors and generators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={cn(
                  "border-white/20 bg-white/10 backdrop-blur-md transition-all duration-500 hover:bg-white/15 hover:border-white/40 hover:scale-105 cursor-pointer group shadow-xl hover:shadow-2xl",
                  activeFeature === index && "ring-2 ring-white/40 bg-white/20 shadow-2xl"
                )}
                onClick={() => setActiveFeature(index)}
              >
                <CardHeader className="text-center pb-6">
                  <div className={cn(
                    "mx-auto p-4 rounded-2xl bg-gradient-to-br text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg",
                    feature.color
                  )}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl text-white font-bold">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80 text-center text-base leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-white/5 to-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 sm:mb-6">
              What Creators Say
            </h2>
            <p className="text-lg sm:text-xl text-white/70">
              Join the community of amazed users
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="flex items-center gap-2 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-white/60 text-white/60" />
                    ))}
                  </div>
                  <blockquote className="text-lg text-white/90 mb-6 italic leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">
                      — {testimonial.author}
                    </span>
                    <Badge variant="outline" className="bg-white/10 text-white/70 border-white/20">
                      {testimonial.platform}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 sm:mb-8">
            Ready to Transform Your Images?
          </h2>
          <p className="text-lg sm:text-xl text-white/80 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
            Experience the future of AI-powered image editing with Nano Banana
          </p>
          <div className="flex justify-center">
            <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/20 hover:border-white/50 px-6 sm:px-10 py-4 sm:py-6 text-lg sm:text-xl font-medium transition-all duration-300">
              View API Docs
            </Button>
          </div>
        </div>
      </section>

      {/* Simple Copyright */}
      <div className="py-6 sm:py-8 text-center border-t border-white/20">
        <p className="text-white/60 text-sm">
          © 2025 Nano Banana. All rights reserved.
        </p>
      </div>
    </div>
  );
}
