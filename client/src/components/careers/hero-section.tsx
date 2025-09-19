import teamPhoto from '@assets/Hero Image 102.png';

export default function HeroSection() {
  const scrollToJobs = () => {
    const element = document.getElementById('jobs');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToAbout = () => {
    const element = document.getElementById('culture');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative text-primary-foreground py-20 lg:py-32 min-h-[600px] overflow-hidden mt-18 md:mt-20 lg:mt-22 xl:mt-24">
      {/* Full background image */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: teamPhoto ? `url(${teamPhoto})` : 'none',
          backgroundSize: '120%',
          backgroundPosition: '85% 45%', // Desktop: centered
          backgroundRepeat: 'no-repeat',
          width: '100%',
          height: '100%'
        }}
      ></div>
      
      {/* Mobile-specific background positioning */}
      <div 
        className="absolute inset-0 md:hidden"
        style={{
          backgroundImage: teamPhoto ? `url(${teamPhoto})` : 'none',
          backgroundSize: '120%',
          backgroundPosition: '75% 45%', // Mobile: shifted right to center people
          backgroundRepeat: 'no-repeat',
          width: '100%',
          height: '100%'
        }}
      ></div>
      
      {/* Red to darker yellow gradient */}
      <div 
        className="absolute inset-0" 
        style={{ 
          background: "linear-gradient(to bottom, rgba(139, 34, 34, 0.7) 0%, rgba(139, 34, 34, 0.6) 60%, rgba(133, 77, 14, 0.55) 85%, rgba(133, 77, 14, 0.55) 100%)"
        }}
      ></div>
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-7xl font-bold mb-6 sm:mb-8 text-white leading-tight mt-8 sm:mt-12 md:mt-16" data-testid="hero-title">
            Join India's Leading Automotive Community
          </h1>
          <p className="text-base sm:text-lg md:text-2xl mb-8 sm:mb-10 text-white max-w-2xl sm:max-w-3xl mx-auto leading-relaxed font-medium px-2 hidden" data-testid="hero-subtitle">
            At MotorOctane, we're India's premier automotive consultancy and car expertise platform. Join our team of automotive specialists, content creators, and industry experts who are passionate about the Indian automotive scene.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4 mt-64 sm:mt-80 md:mt-96">
            <button 
              onClick={scrollToJobs}
              className="bg-white text-gray-900 px-6 sm:px-10 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
              data-testid="button-view-positions"
            >
              View Open Positions
            </button>
            <button 
              onClick={scrollToAbout}
              className="border-2 border-white text-white px-6 sm:px-10 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:bg-white hover:text-gray-900 transform hover:scale-105 transition-all duration-200 shadow-lg"
              data-testid="button-learn-culture"
            >
              Learn About Our Culture
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
