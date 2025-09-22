import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  UsersIcon, 
  CogIcon, 
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckIcon,
  PlayIcon,
  StarIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const Homepage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      name: 'Lead Management',
      description: 'Capture, track, and nurture leads from multiple sources with intelligent automation.',
      icon: UsersIcon,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Sales Pipeline',
      description: 'Visualize your sales process with customizable pipeline stages and drag-and-drop functionality.',
      icon: ChartBarIcon,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      name: 'Task Automation',
      description: 'Automate repetitive tasks and workflows to focus on what matters most - closing deals.',
      icon: CogIcon,
      gradient: 'from-orange-500 to-red-500'
    },
    {
      name: 'Advanced Security',
      description: 'Enterprise-grade security with role-based access control and data encryption.',
      icon: ShieldCheckIcon,
      gradient: 'from-indigo-500 to-blue-500'
    }
  ];

  const testimonials = [
    {
      content: "CHLEAR CRM transformed our sales process. We've seen a 40% increase in conversion rates since implementation.",
      author: "Sarah Johnson",
      role: "Sales Director",
      company: "TechCorp Solutions",
      rating: 5
    },
    {
      content: "The automation features saved us hours every week. Our team can now focus on building relationships instead of data entry.",
      author: "Michael Chen",
      role: "VP of Sales",
      company: "Growth Dynamics",
      rating: 5
    },
    {
      content: "Best CRM we've used. The pipeline visualization and reporting capabilities are outstanding.",
      author: "Emily Rodriguez",
      role: "Business Development Manager",
      company: "Innovation Labs",
      rating: 5
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Active Users' },
    { value: '500+', label: 'Companies Trust Us' },
    { value: '99.9%', label: 'Uptime Guarantee' },
    { value: '24/7', label: 'Support Available' }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$29',
      period: '/month',
      description: 'Perfect for small teams getting started',
      features: [
        'Up to 1,000 leads',
        'Basic pipeline management',
        'Email integration',
        'Standard support'
      ],
      highlighted: false
    },
    {
      name: 'Professional',
      price: '$79',
      period: '/month',
      description: 'Most popular for growing businesses',
      features: [
        'Unlimited leads',
        'Advanced automation',
        'Custom reporting',
        'Priority support',
        'API access'
      ],
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations with specific needs',
      features: [
        'Everything in Professional',
        'Custom integrations',
        'Dedicated account manager',
        'Advanced security features',
        'On-premise deployment'
      ],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
          <div className="flex lg:flex-1">
            <Link to="/" className="-m-1.5 p-1.5">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                CHLEAR CRM
              </span>
            </Link>
          </div>
          
          <div className="hidden lg:flex lg:gap-x-12">
            <a href="#features" className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors">
              Features
            </a>
            <a href="#testimonials" className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors">
              Testimonials
            </a>
            <a href="#pricing" className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors">
              Pricing
            </a>
          </div>
          
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
            <Link 
              to="/login" 
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors"
            >
              Log in
            </Link>
            <Link 
              to="/register" 
              className="btn-primary text-sm"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Built for high-impact{' '}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                sales teams
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Unite your sales, marketing, and service teams on one powerful platform. 
              Automate workflows, personalize engagement, and drive outcomes – at speed and scale.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/register" className="btn-primary text-lg px-8 py-4">
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <button className="flex items-center text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors">
                <PlayIcon className="mr-2 h-5 w-5" />
                Watch Demo
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to grow your business
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Powerful features designed to streamline your sales process and boost productivity.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.name} className="card group hover:shadow-lg transition-all duration-300">
                <div className="card-body text-center">
                  <div className={`mx-auto h-16 w-16 rounded-full bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.name}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Trusted by sales teams worldwide
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              See how companies are transforming their sales processes with CHLEAR CRM.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card">
                <div className="card-body">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 mb-6">
                    "{testimonial.content}"
                  </blockquote>
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {testimonial.author.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold text-gray-900">{testimonial.author}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                      <div className="text-sm text-gray-500">{testimonial.company}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Choose the right plan for your team
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start free, scale as you grow. No hidden fees, cancel anytime.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className={`card ${plan.highlighted ? 'ring-2 ring-blue-500 relative' : ''}`}>
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="card-body text-center">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    <span className="ml-1 text-xl text-gray-500">{plan.period}</span>
                  </div>
                  <p className="mt-4 text-gray-600">{plan.description}</p>
                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link 
                      to="/register" 
                      className={plan.highlighted ? 'btn-primary w-full' : 'btn-secondary w-full'}
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to transform your sales process?
            </h2>
            <p className="mt-6 text-lg leading-8 text-blue-100">
              Join thousands of sales teams who trust CHLEAR CRM to drive their growth.
              Start your free trial today.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/register" className="bg-white text-blue-600 hover:bg-gray-50 btn text-lg px-8 py-4 font-semibold">
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <a href="tel:+1-800-123-4567" className="flex items-center text-sm font-semibold leading-6 text-white hover:text-blue-100 transition-colors">
                <PhoneIcon className="mr-2 h-5 w-5" />
                Call Sales: +1-800-123-4567
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                CHLEAR CRM
              </Link>
              <p className="mt-4 text-gray-400 max-w-md">
                Empowering sales teams with intelligent CRM solutions. 
                Transform your sales process and drive growth with our powerful platform.
              </p>
              <div className="mt-6 flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Product</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link></li>
                <li><Link to="/register" className="text-gray-400 hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Support</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800">
            <p className="text-center text-gray-400">
              © 2025 CHLEAR CRM. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;

