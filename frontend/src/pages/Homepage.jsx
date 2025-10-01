import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SparklesIcon,
  ChatBubbleBottomCenterTextIcon,
  MicrophoneIcon,
  GlobeAltIcon,
  UserGroupIcon,
  ChartBarSquareIcon,
  BoltIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  LanguageIcon,
  DevicePhoneMobileIcon,
  CloudIcon,
  CurrencyDollarIcon,
  PlayCircleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Homepage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const heroFeatures = [
    {
      icon: ChatBubbleBottomCenterTextIcon,
      title: 'AI Chat Assistant',
      description: 'Intelligent assistant to help you with any CRM task'
    },
    {
      icon: MicrophoneIcon,
      title: 'Voice Control',
      description: 'Manage your CRM hands-free with voice commands'
    },
    {
      icon: LanguageIcon,
      title: 'Multi-lingual',
      description: 'English, Hindi, Spanish & more coming soon'
    }
  ];

  const features = [
    {
      name: 'AI-Powered Chat Support',
      description: 'Get instant help in your preferred language. Our AI assistant understands context and helps you complete any CRM task naturally through conversation.',
      icon: SparklesIcon,
      gradient: 'from-purple-500 to-pink-500',
      highlights: ['Natural conversation', '24/7 availability', 'Context-aware']
    },
    {
      name: 'Voice Agent Control',
      description: 'Complete CRM operations hands-free. Update leads, check dashboards, create reports - all with voice commands in your native language.',
      icon: MicrophoneIcon,
      gradient: 'from-blue-500 to-cyan-500',
      highlights: ['Hands-free operation', 'Multi-language support', 'Natural speech recognition']
    },
    {
      name: 'True Multi-lingual Support',
      description: 'Work in English, Hindi, or Spanish. Every feature, every screen, every conversation - fully localized for your comfort.',
      icon: GlobeAltIcon,
      gradient: 'from-green-500 to-emerald-500',
      highlights: ['English', 'हिन्दी (Hindi)', 'Español (Spanish)']
    },
    {
      name: 'Complete Lead Management',
      description: 'Capture, nurture, and convert leads effortlessly. Smart automation and AI suggestions help you close deals faster.',
      icon: UserGroupIcon,
      gradient: 'from-orange-500 to-red-500',
      highlights: ['Smart capture', 'Auto-assignment', 'Lead scoring']
    },
    {
      name: 'Visual Sales Pipeline',
      description: 'See your entire sales process at a glance. Drag-and-drop simplicity meets powerful analytics and forecasting.',
      icon: ChartBarSquareIcon,
      gradient: 'from-indigo-500 to-purple-500',
      highlights: ['Kanban boards', 'Custom stages', 'Real-time updates']
    },
    {
      name: 'Intelligent Automation',
      description: 'Let AI handle repetitive tasks. Focus on building relationships while automation handles the busy work.',
      icon: BoltIcon,
      gradient: 'from-yellow-500 to-orange-500',
      highlights: ['Task automation', 'Smart workflows', 'Email sequences']
    }
  ];

  const inclusiveFeatures = [
    {
      title: 'Designed for Everyone',
      description: 'No technical expertise needed. If you can have a conversation, you can use Sakha.',
      icon: UserGroupIcon
    },
    {
      title: 'Language Barrier? What Barrier?',
      description: 'Speak in your language, think in your language, work in your language. We adapt to you.',
      icon: LanguageIcon
    },
    {
      title: 'Accessible from Anywhere',
      description: 'Cloud-based platform works on any device - desktop, tablet, or mobile.',
      icon: DevicePhoneMobileIcon
    },
    {
      title: 'Small Business Pricing',
      description: 'Affordable plans designed for growing businesses. No hidden costs, cancel anytime.',
      icon: CurrencyDollarIcon
    }
  ];

  const useCases = [
    {
      title: 'Retail Shops',
      description: 'Track customer relationships, manage inventory leads, and grow your business with AI assistance in your local language.',
      emoji: '🏪'
    },
    {
      title: 'Service Providers',
      description: 'Manage appointments, track client history, and automate follow-ups with voice commands while on the go.',
      emoji: '🔧'
    },
    {
      title: 'Consultants & Freelancers',
      description: 'Organize projects, track billable hours, and manage client communications from a single multilingual platform.',
      emoji: '💼'
    },
    {
      title: 'E-commerce Businesses',
      description: 'Connect with customers in their language, track orders, and provide AI-powered support across multiple channels.',
      emoji: '🛒'
    }
  ];

  const stats = [
    { value: '3+', label: 'Languages Supported' },
    { value: '100%', label: 'Voice Enabled' },
    { value: '24/7', label: 'AI Assistance' },
    { value: '∞', label: 'Possibilities' }
  ];

  const testimonials = [
    {
      content: "मैं हिंदी में बोल सकता हूं और CRM मुझे समझता है। यह अद्भुत है! (I can speak in Hindi and the CRM understands me. It's amazing!)",
      author: "Rajesh Kumar",
      role: "Small Business Owner",
      company: "Kumar Electronics",
      language: "Hindi",
      flag: "🇮🇳"
    },
    {
      content: "The voice assistant saves me hours every day. I can update leads while driving between client meetings. Game changer!",
      author: "Maria Rodriguez",
      role: "Sales Consultant",
      company: "Rodriguez Services",
      language: "Spanish/English",
      flag: "🇲🇽"
    },
    {
      content: "Finally, a CRM that doesn't require a manual. The AI assistant taught me everything I needed in minutes, in my own language.",
      author: "Priya Sharma",
      role: "Boutique Owner",
      company: "Sharma Fashion",
      language: "English/Hindi",
      flag: "🇮🇳"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50 shadow-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8">
          <div className="flex lg:flex-1">
            <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Sakha
              </span>
            </Link>
          </div>

          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>

          <div className="hidden lg:flex lg:gap-x-8">
            <a href="#features" className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              Features
            </a>
            <a href="#use-cases" className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              Use Cases
            </a>
            <a href="#testimonials" className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              Stories
            </a>
          </div>

          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/register-company"
              className="btn-primary text-sm shadow-lg hover:shadow-xl transition-all"
            >
              Try for Free
            </Link>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/20" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
              <div className="flex items-center justify-between">
                <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <SparklesIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Sakha
                  </span>
                </Link>
                <button
                  type="button"
                  className="-m-2.5 rounded-md p-2.5 text-gray-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-gray-500/10">
                  <div className="space-y-2 py-6">
                    <a href="#features" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">
                      Features
                    </a>
                    <a href="#use-cases" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">
                      Use Cases
                    </a>
                    <a href="#testimonials" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">
                      Stories
                    </a>
                  </div>
                  <div className="py-6 space-y-2">
                    <Link to="/login" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">
                      Sign In
                    </Link>
                    <Link to="/register-company" className="btn-primary w-full text-center">
                      Try for Free
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
          <div className="mx-auto max-w-4xl text-center">
            {/* Language badges */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white shadow-md border border-gray-200">
                🇺🇸 English
              </span>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white shadow-md border border-gray-200">
                🇮🇳 हिन्दी
              </span>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white shadow-md border border-gray-200">
                🇪🇸 Español
              </span>
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-7xl leading-tight">
              CRM That{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Speaks Your Language
              </span>
            </h1>
            <p className="mt-8 text-xl leading-8 text-gray-600 max-w-3xl mx-auto">
              The first truly inclusive CRM for small businesses. Chat with AI in your language,
              control everything with your voice, and grow your business without barriers.
            </p>

            {/* Hero feature pills */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              {heroFeatures.map((feature) => (
                <div key={feature.title} className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-lg border border-gray-100">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">{feature.title}</div>
                    <div className="text-xs text-gray-500">{feature.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register-company" className="btn-primary text-lg px-10 py-5 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all">
                Start Free - No Credit Card
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <button className="flex items-center gap-2 text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors px-6 py-3 rounded-lg hover:bg-white hover:shadow-md">
                <PlayCircleIcon className="h-6 w-6" />
                Watch Demo (2 min)
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span>No technical knowledge required</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-5 w-5" />
                  Bank-level security
                </span>
                <span className="flex items-center gap-2">
                  <CloudIcon className="h-5 w-5" />
                  Cloud-based, always accessible
                </span>
                <span className="flex items-center gap-2">
                  <BoltIcon className="h-5 w-5" />
                  Set up in 5 minutes
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg border border-gray-200">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inclusive Features Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for <span className="text-blue-600">Everyone</span>, Everywhere
            </h2>
            <p className="text-lg text-gray-600">
              No language barriers. No technical barriers. No accessibility barriers.
              Just powerful CRM tools that adapt to you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {inclusiveFeatures.map((feature) => (
              <div key={feature.title} className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-all">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-6 shadow-lg">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section id="features" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything Your Business Needs
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features combined with AI assistance and voice control - all in your language
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:scale-105">
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.name}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <div className="space-y-2">
                  {feature.highlights.map((highlight) => (
                    <div key={highlight} className="flex items-center text-sm text-gray-700">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Perfect for Your Business
            </h2>
            <p className="text-lg text-gray-600">
              Small businesses of all types trust Sakha to grow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-gray-200 hover:border-blue-300 transition-all">
                <div className="text-5xl mb-4">{useCase.emoji}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
                <p className="text-gray-700">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Real Stories from Real Businesses
            </h2>
            <p className="text-lg text-blue-200">
              See how Sakha is helping small businesses worldwide
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="text-4xl mb-4">{testimonial.flag}</div>
                <blockquote className="text-white/90 mb-6 italic">
                  "{testimonial.content}"
                </blockquote>
                <div className="border-t border-white/20 pt-6">
                  <div className="font-bold text-white">{testimonial.author}</div>
                  <div className="text-sm text-blue-200">{testimonial.role}</div>
                  <div className="text-sm text-blue-300">{testimonial.company}</div>
                  <div className="text-xs text-blue-200 mt-2">🗣️ {testimonial.language}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]"></div>
        <div className="mx-auto max-w-4xl px-6 lg:px-8 relative">
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to Grow Your Business?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of small businesses using Sakha.
              Start free, no credit card required, cancel anytime.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link to="/register-company" className="bg-white text-blue-600 hover:bg-gray-50 px-10 py-5 rounded-xl font-bold text-lg shadow-2xl hover:scale-105 transition-all inline-flex items-center">
                Get Started for Free
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-white/90">
              <span className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5" />
                Free forever plan available
              </span>
              <span className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5" />
                Setup in 5 minutes
              </span>
              <span className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5" />
                No credit card required
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-6">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
                  <SparklesIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">Sakha</span>
              </Link>
              <p className="text-gray-400 max-w-md mb-6">
                The first truly inclusive CRM platform designed for small businesses worldwide.
                Speak your language, grow your business.
              </p>
              <div className="flex gap-4">
                <div className="text-2xl">🇺🇸</div>
                <div className="text-2xl">🇮🇳</div>
                <div className="text-2xl">🇪🇸</div>
                <div className="text-2xl">🇲🇽</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#use-cases" className="text-gray-400 hover:text-white transition-colors">Use Cases</a></li>
                <li><a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">Testimonials</a></li>
                <li><Link to="/register-company" className="text-gray-400 hover:text-white transition-colors">Get Started</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800">
            <p className="text-center text-gray-400 text-sm">
              © 2025 Sakha - Your Friend in CRM. Made with ❤️ for small businesses everywhere.
              <span className="mx-2">•</span>
              English • हिन्दी • Español
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Homepage;