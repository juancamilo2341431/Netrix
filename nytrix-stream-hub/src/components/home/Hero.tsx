import { useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const platformLogos = [
  { src: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg", alt: "Netflix" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg", alt: "Disney+" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png", alt: "Prime Video" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg", alt: "HBO Max" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg", alt: "Spotify" },
  
];

export default function Hero() {
  const plugin = useRef(
    Autoplay({ delay: 2500, stopOnInteraction: true })
  );

  const scrollToPlatforms = () => {
    const section = document.getElementById('plataformas-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-nytrix-dark-purple to-nytrix-charcoal z-0"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-nytrix-purple/20 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-nytrix-charcoal to-transparent"></div>
      
      <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 lg:py-32 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Todas las plataformas de streaming, <span className="text-gradient-nytrix">un solo lugar</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
              Accede a tus plataformas de streaming favoritas por una fracción del precio. Sin compromiso, sin problemas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-nytrix hover:opacity-90" 
                onClick={scrollToPlatforms}
              >
                Ver Plataformas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 text-nytrix-purple mr-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Sin contratos</span>
              </div>
              <div className="flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 text-nytrix-purple mr-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Cancela cuando quieras</span>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <Carousel
              plugins={[plugin.current]}
              className="w-full max-w-md mx-auto"
              opts={{
                align: "start",
                loop: true,
              }}
            >
              <CarouselContent className="-ml-4">
                {platformLogos.map((logo, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 pl-4">
                    <div className="p-1">
                      <div className="h-48 flex items-center justify-center">
                        <img 
                          src={logo.src} 
                          alt={logo.alt} 
                          className="max-w-[90%] max-h-[90%] object-contain"
                        />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </div>
    </div>
  );
}
