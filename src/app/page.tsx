import Link from 'next/link'
import { 
  BookOpen, 
  Users, 
  Award, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Star,
  Shield,
  Zap,
  Layout,
  Code2,
  PenTool,
  BarChart3
} from 'lucide-react'

export default function Home() {
  const jazzCashNumber = process.env.NEXT_PUBLIC_JAZZCASH_NUMBER

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 mb-8 backdrop-blur-sm animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span className="text-sm font-medium">New Courses Available</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8">
              Master New Skills with <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                Expert-Led Courses
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of students learning from industry professionals. 
              Unlock your potential with our comprehensive, project-based curriculum.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link 
                href="/courses"
                className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 flex items-center gap-2"
              >
                Browse Courses
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/login"
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center gap-2"
              >
                Student Login
              </Link>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-t border-slate-800/50">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">5000+</div>
                <div className="text-sm text-slate-400">Active Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">120+</div>
                <div className="text-sm text-slate-400">Total Courses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">50+</div>
                <div className="text-sm text-slate-400">Expert Instructors</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">4.9/5</div>
                <div className="text-sm text-slate-400">Student Rating</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative blobs */}
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-purple-500/30 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              We provide quality education with a focus on practical skills, modern tools, and real-world applications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Award className="w-8 h-8 text-blue-600" />}
              title="Expert-Led Content"
              description="Learn from industry professionals with years of real-world experience and proven track records."
              color="bg-blue-50"
            />
            <FeatureCard 
              icon={<Code2 className="w-8 h-8 text-purple-600" />}
              title="Hands-on Projects"
              description="Build real portfolio projects. Stop watching tutorials and start writing actual code."
              color="bg-purple-50"
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-amber-600" />}
              title="Fast Track Progress"
              description="Structured learning paths designed to get you from beginner to job-ready in record time."
              color="bg-amber-50"
            />
          </div>
        </div>
      </div>

      {/* Categories Preview */}
      <div className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Explore Categories</h2>
              <p className="text-slate-600">Find the perfect course for your career path</p>
            </div>
            <Link href="/courses" className="hidden md:flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              View All Categories <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <CategoryCard title="Web Development" icon={<Layout className="w-6 h-6" />} count="24 Courses" />
            <CategoryCard title="Digital Marketing" icon={<BarChart3 className="w-6 h-6" />} count="12 Courses" />
            <CategoryCard title="Graphic Design" icon={<PenTool className="w-6 h-6" />} count="18 Courses" />
            <CategoryCard title="Cyber Security" icon={<Shield className="w-6 h-6" />} count="8 Courses" />
          </div>
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/courses" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              View All Categories <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Payment Information Section - Redesigned */}
      <div className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-md mb-6">
                <CreditCardIcon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Secure Enrollment</h3>
              <p className="text-slate-300 mb-8 max-w-md mx-auto">
                Ready to join? Send your course fee to our official JazzCash account to complete your enrollment.
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 inline-block w-full max-w-md">
                <p className="text-sm font-medium text-slate-300 mb-1 uppercase tracking-wider">JazzCash Number</p>
                <div className="text-3xl md:text-4xl font-mono font-bold text-white tracking-wider mb-2">
                  {jazzCashNumber || "0000 0000000"}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Verified Merchant Account</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Start Your Learning Journey Today
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Get unlimited access to over 120+ courses, projects, and career certificates.
          </p>
          <Link 
            href="/courses"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-10 py-5 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-xl"
          >
            Explore Courses Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </main>
  )
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
  return (
    <div className="group bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  )
}

function CategoryCard({ title, icon, count }: { title: string, icon: React.ReactNode, count: string }) {
  return (
    <Link href="/courses" className="group bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors text-slate-600">
          {icon}
        </div>
        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h3>
      </div>
      <p className="text-sm text-slate-500 pl-14">{count}</p>
    </Link>
  )
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}