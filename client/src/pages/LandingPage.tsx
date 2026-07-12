import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useState } from 'react'
import {
  Truck,
  Users,
  Activity,
  Wrench,
  Coins,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Settings,
  Sparkles,
} from 'lucide-react'

export function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()

  // Sandbox state
  const [sandboxDriver, setSandboxDriver] = useState('David Available')
  const [sandboxVehicle, setSandboxVehicle] = useState('Van-05 (Cap: 500kg)')
  const [cargoWeight, setCargoWeight] = useState(350)
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'success' | 'blocked'>('idle')
  const [blockedReason, setBlockedReason] = useState('')

  const handleSimulateDispatch = () => {
    // Validate business rules in sandbox
    if (sandboxDriver === 'Alex Expired') {
      setDispatchStatus('blocked')
      setBlockedReason('Driver license is EXPIRED. Dispatch blocked for safety compliance.')
      return
    }
    if (sandboxDriver === 'Bob Suspended') {
      setDispatchStatus('blocked')
      setBlockedReason('Driver is currently SUSPENDED. Dispatch blocked.')
      return
    }
    if (cargoWeight > 500 && sandboxVehicle.includes('Van-05')) {
      setDispatchStatus('blocked')
      setBlockedReason('Cargo weight (500kg+ max capacity exceeded for Tata Super Ace Van).')
      return
    }

    setDispatchStatus('success')
  }

  const resetSandbox = () => {
    setDispatchStatus('idle')
    setBlockedReason('')
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#121212] font-sans selection:bg-[#FDE047] selection:text-black">
      {/* Header Banner */}
      <div className="bg-[#121212] text-[#FFFDF9] py-2 px-4 text-center text-xs font-bold tracking-widest border-b-[3px] border-[#121212] flex items-center justify-center gap-2">
        <Sparkles className="h-4 w-4 text-[#FDE047] animate-pulse" />
        TRANSITOPS v1.2 PRODUCTION ENGINE ONLINE
        <span className="hidden sm:inline-block bg-[#22C55E] text-black px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#FDE047]">
          ALL SYSTEMS GO
        </span>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-[#FFFDF9] border-b-[4px] border-[#121212] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#3B82F6] text-white p-2 rounded border-[3px] border-[#121212] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Truck className="h-6 w-6" />
          </div>
          <span className="text-xl font-black tracking-tight uppercase">
            Transit<span className="text-[#3B82F6]">Ops</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 font-bold text-sm">
          <a href="#features" className="hover:text-[#3B82F6] transition-colors">Features</a>
          <a href="#sandbox" className="hover:text-[#3B82F6] transition-colors">Sandbox Demo</a>
          <a href="#stats" className="hover:text-[#3B82F6] transition-colors">System Metrics</a>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden sm:inline-block text-xs font-bold bg-[#EFF6FF] border-[2px] border-[#121212] px-3 py-1 rounded">
                Logged in: <strong className="text-[#3B82F6]">{user?.name}</strong>
              </span>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black text-xs px-4 py-2.5 rounded border-[3px] border-[#121212] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-100 uppercase"
              >
                Go to Dashboard
              </button>
              <button
                onClick={logout}
                className="border-[3px] border-[#121212] hover:bg-[#F3F4F6] text-[#121212] font-black text-xs px-3 py-2 rounded transition-all duration-100 uppercase"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="border-[3px] border-[#121212] hover:bg-[#F3F4F6] text-[#121212] font-black text-xs sm:text-sm px-4 py-2 rounded transition-all duration-100 uppercase"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="bg-[#FDE047] hover:bg-[#FACC15] text-[#121212] font-black text-xs sm:text-sm px-4 py-2.5 rounded border-[3px] border-[#121212] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-100 uppercase"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-6 border-b-[4px] border-[#121212] bg-[#EFF6FF]">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#121212_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 bg-[#FDE047] text-[#121212] font-black text-xs px-3.5 py-1.5 rounded-full border-[2.5px] border-[#121212] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">
            <ShieldCheck className="h-4 w-4 text-black" />
            100% Secure RBAC Operations Engine
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-[0.95] max-w-4xl mx-auto">
            Smart Fleet Management, <span className="text-[#3B82F6] underline decoration-[6px] decoration-yellow-300 underline-offset-4">Atomic Dispatch.</span>
          </h1>

          <p className="text-md sm:text-xl font-medium text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
            TransitOps is a unified management console built for real-time freight scheduling, state-controlled maintenance flows, and complete driver eligibility auditing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black text-md px-8 py-4 rounded border-[3px] border-[#121212] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-100 uppercase flex items-center justify-center gap-2"
              >
                Enter Platform Dashboard
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full sm:w-auto bg-[#FDE047] hover:bg-[#FACC15] text-[#121212] font-black text-md px-8 py-4 rounded border-[3px] border-[#121212] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-100 uppercase flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto bg-white hover:bg-gray-50 text-[#121212] font-black text-md px-8 py-4 rounded border-[3px] border-[#121212] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-100 uppercase"
                >
                  Operator Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Showcase */}
      <section id="stats" className="py-12 px-6 border-b-[4px] border-[#121212] bg-[#121212] text-[#FFFDF9]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#FFFDF9] text-black p-6 rounded border-[3px] border-[#FFFDF9] shadow-[6px_6px_0px_0px_#3B82F6] flex flex-col justify-between h-40">
            <span className="text-xs font-black tracking-widest text-[#4B5563] uppercase">SYSTEM AVAILABILITY</span>
            <span className="text-4xl sm:text-5xl font-black">99.99%</span>
            <span className="text-xs font-bold text-[#3B82F6]">✓ SLA Compliant Host Node</span>
          </div>
          <div className="bg-[#FFFDF9] text-black p-6 rounded border-[3px] border-[#FFFDF9] shadow-[6px_6px_0px_0px_#FDE047] flex flex-col justify-between h-40">
            <span className="text-xs font-black tracking-widest text-[#4B5563] uppercase">DISPATCH THROUGHPUT</span>
            <span className="text-4xl sm:text-5xl font-black">15,480+</span>
            <span className="text-xs font-bold text-[#F59E0B]">🚀 Automated Schedules Triggered</span>
          </div>
          <div className="bg-[#FFFDF9] text-black p-6 rounded border-[3px] border-[#FFFDF9] shadow-[6px_6px_0px_0px_#86EFAC] flex flex-col justify-between h-40">
            <span className="text-xs font-black tracking-widest text-[#4B5563] uppercase">TRANSACTION TIMEOUT</span>
            <span className="text-4xl sm:text-5xl font-black">&lt; 150ms</span>
            <span className="text-xs font-bold text-[#10B981]">⚡ Atomic State Commit Locks</span>
          </div>
        </div>
      </section>

      {/* Sandbox Demo Component (Vibrant Interactive Playground) */}
      <section id="sandbox" className="py-16 px-6 border-b-[4px] border-[#121212] bg-[#FEF08A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-3 mb-10">
            <span className="bg-[#121212] text-[#FDE047] text-xs font-black px-3.5 py-1 rounded border-[2px] border-[#121212] uppercase">
              Operational Sandbox
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase">Try the Dispatch Simulator</h2>
            <p className="text-sm sm:text-base font-bold text-gray-800 max-w-xl mx-auto">
              Test out our strict backend validation rules. Pick drivers, vehicles, and weights to see how validation blocks unqualified assignments!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Input Selection Console */}
            <div className="bg-white p-6 rounded-lg border-[3px] border-[#121212] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="bg-[#121212] text-white p-2.5 rounded text-xs font-bold flex items-center justify-between">
                  <span>DISPATCH SYSTEM OPERATOR PANEL</span>
                  <Settings className="h-4 w-4 animate-spin" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-gray-700">1. Assign Driver</label>
                  <select
                    value={sandboxDriver}
                    onChange={(e) => {
                      setSandboxDriver(e.target.value)
                      resetSandbox()
                    }}
                    className="w-full bg-[#F9FAFB] border-[2px] border-[#121212] p-2.5 font-bold rounded text-sm outline-none focus:bg-white cursor-pointer"
                  >
                    <option value="David Available">David Available (Safety Score: 98)</option>
                    <option value="Eva Available">Eva Available (Safety Score: 92)</option>
                    <option value="Alex Expired">Alex Expired (LICENSE EXPIRED 🚨)</option>
                    <option value="Bob Suspended">Bob Suspended (STATUS: SUSPENDED ⛔)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-gray-700">2. Select Vehicle</label>
                  <select
                    value={sandboxVehicle}
                    onChange={(e) => {
                      setSandboxVehicle(e.target.value)
                      resetSandbox()
                    }}
                    className="w-full bg-[#F9FAFB] border-[2px] border-[#121212] p-2.5 font-bold rounded text-sm outline-none focus:bg-white cursor-pointer"
                  >
                    <option value="Van-05 (Cap: 500kg)">Van-05 (Tata Super Ace, Capacity: 500kg)</option>
                    <option value="Truck-12 (Cap: 5000kg)">Truck-12 (Eicher Pro, Capacity: 5000kg)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-black uppercase text-gray-700">
                    <span>3. Cargo Weight</span>
                    <span className="text-[#3B82F6]">{cargoWeight} kg</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={cargoWeight}
                    onChange={(e) => {
                      setCargoWeight(Number(e.target.value))
                      resetSandbox()
                    }}
                    className="w-full h-2 bg-gray-200 border-[2px] border-[#121212] rounded-lg appearance-none cursor-pointer accent-[#3B82F6]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                    <span>Light Cargo (100kg)</span>
                    <span>Heavy Cargo (1000kg)</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={handleSimulateDispatch}
                  className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black py-3 rounded border-[3px] border-[#121212] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-100 uppercase flex items-center justify-center gap-2"
                >
                  <Play className="h-4 w-4 fill-white" />
                  Simulate Trip Dispatch
                </button>
              </div>
            </div>

            {/* Output Display Panel */}
            <div className="bg-[#FFFDF9] p-6 rounded-lg border-[3px] border-[#121212] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between min-h-[300px]">
              <div>
                <span className="text-xs font-black tracking-widest text-[#4B5563] uppercase">TRANSACTION FEEDBACK</span>
                
                {dispatchStatus === 'idle' && (
                  <div className="mt-8 flex flex-col items-center justify-center text-center space-y-4 py-8">
                    <Activity className="h-12 w-12 text-[#9CA3AF] animate-pulse" />
                    <div>
                      <p className="font-black text-lg">System Idle</p>
                      <p className="text-xs text-gray-500 max-w-xs">Configure the fields on the left and hit the dispatch button to run validation checks.</p>
                    </div>
                  </div>
                )}

                {dispatchStatus === 'success' && (
                  <div className="mt-6 space-y-4">
                    <div className="bg-[#DEF7EC] text-[#03543F] border-[2.5px] border-[#03543F] p-4 rounded-md flex gap-3 shadow-[3px_3px_0px_0px_#03543F]">
                      <CheckCircle2 className="h-6 w-6 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-sm uppercase">TRANSACTION ATOMIC COMMIT SUCCESS</p>
                        <p className="text-xs mt-1">MongoDB transaction closed with code <strong>200 OK</strong>.</p>
                      </div>
                    </div>
                    
                    <div className="bg-[#F8FAFC] border-[2px] border-[#121212] p-4 rounded text-xs space-y-2 font-mono">
                      <p className="text-green-600 font-bold">// Atomic State Changes Commited:</p>
                      <p>• Vehicle state shifted from <code>AVAILABLE</code> to <code>ON TRIP</code>.</p>
                      <p>• Driver state shifted from <code>Available</code> to <code>On Trip</code>.</p>
                      <p>• Trip record inserted into cluster status: <code>Dispatched</code>.</p>
                    </div>
                  </div>
                )}

                {dispatchStatus === 'blocked' && (
                  <div className="mt-6 space-y-4">
                    <div className="bg-[#FDE8E8] text-[#9B1C1C] border-[2.5px] border-[#9B1C1C] p-4 rounded-md flex gap-3 shadow-[3px_3px_0px_0px_#9B1C1C]">
                      <AlertTriangle className="h-6 w-6 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-sm uppercase">DISPATCH TRANSACTION ROLLBACK</p>
                        <p className="text-xs mt-1">{blockedReason}</p>
                      </div>
                    </div>
                    
                    <div className="bg-[#F8FAFC] border-[2px] border-[#121212] p-4 rounded text-xs space-y-2 font-mono">
                      <p className="text-red-500 font-bold">// Database Transaction Safeguards:</p>
                      <p>• Concurrency validation: <strong>FAILED</strong>.</p>
                      <p>• Vehicle state reverted to: <code>AVAILABLE</code>.</p>
                      <p>• Driver state reverted to: <code>Available</code>.</p>
                      <p>• Error Log code: <code>ELIGIBILITY_VIOLATION_ERR</code></p>
                    </div>
                  </div>
                )}
              </div>

              {dispatchStatus !== 'idle' && (
                <button
                  onClick={resetSandbox}
                  className="w-full mt-4 bg-white border-[2.5px] border-[#121212] text-xs font-black py-2 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#F3F4F6] transition-all duration-100 uppercase"
                >
                  Clear Terminal
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 border-b-[4px] border-[#121212]">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-[#3B82F6] font-bold text-xs uppercase tracking-widest bg-[#EFF6FF] px-3.5 py-1.5 rounded border-[2px] border-[#3B82F6]">
              Core Operational Modules
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase pt-2">Engineered For Heavy Transit</h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              Realize complete control over every registry asset, driver eligibility criteria, and operational cost tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-lg border-[3px] border-[#121212] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-100">
              <div className="bg-[#BFDBFE] w-12 h-12 rounded border-[2.5px] border-[#121212] flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Truck className="h-6 w-6 text-[#1E3A8A]" />
              </div>
              <h3 className="text-lg font-black uppercase">Vehicle Registry</h3>
              <p className="text-sm text-gray-600 mt-2 font-medium">
                Add, manage, and filter fleet vehicles by type, region, and status. Enforce real-time status transitions seamlessly.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-lg border-[3px] border-[#121212] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-100">
              <div className="bg-[#FED7AA] w-12 h-12 rounded border-[2.5px] border-[#121212] flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Users className="h-6 w-6 text-[#7C2D12]" />
              </div>
              <h3 className="text-lg font-black uppercase">Driver Management</h3>
              <p className="text-sm text-gray-600 mt-2 font-medium">
                Maintain driver lists with real-time safety scores, license expirations, and status tracking (Available, Suspended, On Trip).
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-lg border-[3px] border-[#121212] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-100">
              <div className="bg-[#BBF7D0] w-12 h-12 rounded border-[2.5px] border-[#121212] flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Activity className="h-6 w-6 text-[#065F46]" />
              </div>
              <h3 className="text-lg font-black uppercase">Atomic Dispatch</h3>
              <p className="text-sm text-gray-600 mt-2 font-medium">
                Uses isolated database transactions to coordinate driver and vehicle availability automatically without double-bookings.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-lg border-[3px] border-[#121212] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-100">
              <div className="bg-[#DDD6FE] w-12 h-12 rounded border-[2.5px] border-[#121212] flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Wrench className="h-6 w-6 text-[#5B21B6]" />
              </div>
              <h3 className="text-lg font-black uppercase">Maintenance Logs</h3>
              <p className="text-sm text-gray-600 mt-2 font-medium">
                Log vehicle downtime. Putting a vehicle in repair automatically sets its status to <code>IN_SHOP</code>, filtering it from active dispatch.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-white p-6 rounded-lg border-[3px] border-[#121212] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-100">
              <div className="bg-[#FBCFE8] w-12 h-12 rounded border-[2.5px] border-[#121212] flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Coins className="h-6 w-6 text-[#9D174D]" />
              </div>
              <h3 className="text-lg font-black uppercase">Fuel & Expense Track</h3>
              <p className="text-sm text-gray-600 mt-2 font-medium">
                Log liter intake, odometer readings, toll booth transactions, and general repairs to monitor costs down to the cent.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-white p-6 rounded-lg border-[3px] border-[#121212] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-100">
              <div className="bg-[#FDE047] w-12 h-12 rounded border-[2.5px] border-[#121212] flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <TrendingUp className="h-6 w-6 text-[#854D0E]" />
              </div>
              <h3 className="text-lg font-black uppercase">Premium Analytics</h3>
              <p className="text-sm text-gray-600 mt-2 font-medium">
                Calculate vehicle ROI, average fuel economy ratios, dispatch trend charts, and export reports in PDF or CSV formats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#121212] text-[#FFFDF9] py-12 px-6 border-t-[4px] border-[#121212]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-lg font-black uppercase tracking-widest">
              Transit<span className="text-[#3B82F6]">Ops</span>
            </span>
            <p className="text-xs text-gray-400 max-w-xs font-semibold">
              The high-performance operations platform built for modern transit fleet systems.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 font-bold text-xs text-gray-300">
            <a href="#features" className="hover:text-white transition-colors">FEATURES</a>
            <a href="#sandbox" className="hover:text-white transition-colors">SANDBOX</a>
            <a href="#stats" className="hover:text-white transition-colors">METRICS</a>
            <span className="text-gray-600">|</span>
            <span className="text-[#FDE047]">© 2026 TRANSITOPS INC.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
