'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Search, Zap, Bot, Globe, TrendingUp, Shield, Clock,
  CheckCircle, ArrowRight, Star, Users, BarChart3, MessageCircle,
  ChevronDown, ChevronUp, Sparkles, AlertTriangle, Target, MousePointerClick,
  Loader2, ExternalLink, Gift, Percent, Megaphone, Handshake
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';

// ─── Animation helpers ───────────────────────────────────
function FadeInSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Score Circle Component ──────────────────────────────
function ScoreCircle({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#8FA36E' : score >= 40 ? '#D4A843' : '#DC2626';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#2A2520" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="score-circle"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-[#9A8E80]">/100</span>
      </div>
    </div>
  );
}

// ─── Result Modal ────────────────────────────────────────
function AuditResultModal({ result, onClose }: { result: any; onClose: () => void }) {
  const [showFullReport, setShowFullReport] = useState(false);

  if (!result) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#1E1B16] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 border border-[#2A2520]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[family-name:var(--font-playfair)] text-2xl text-[#E2D9CC]">
              {result.auditType === 'free' ? 'Tu Auditoría Express' : 'Tu Auditoría Completa'}
            </h3>
            <button onClick={onClose} className="text-[#9A8E80] hover:text-[#E2D9CC] text-2xl">&times;</button>
          </div>

          {/* Score */}
          <div className="flex items-center gap-6 mb-8">
            <ScoreCircle score={result.score} />
            <div>
              <p className="text-[#9A8E80] text-sm mb-1">Score General</p>
              <p className="text-lg text-[#E2D9CC]">
                {result.score >= 70 ? 'Tu negocio va bien, pero puede mejorar' :
                 result.score >= 40 ? 'Hay oportunidades importantes de mejora' :
                 'Tu negocio necesita atención urgente'}
              </p>
            </div>
          </div>

          {/* Problems */}
          <div className="space-y-4 mb-6">
            {result.problems.map((p: any, i: number) => (
              <div key={i} className="bg-[#0F0D0B] rounded-xl p-4 border border-[#2A2520]">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-[#E2D9CC] font-semibold mb-1">{p.title}</h4>
                    <p className="text-[#9A8E80] text-sm mb-2">
                      Mejora potencial: hasta <span className="text-[#8FA36E] font-semibold">{p.impactPercent}%</span>
                    </p>
                    {result.auditType === 'complete' && (
                      <div className="text-sm text-[#9A8E80]">
                        <p className="mb-2">{p.description}</p>
                        <p className="text-[#E2D9CC] font-medium mb-1">Solución:</p>
                        <p className="mb-2">{p.solution}</p>
                        {p.steps && (
                          <ol className="list-decimal list-inside space-y-1">
                            {p.steps.map((s: string, j: number) => (
                              <li key={j}>{s}</li>
                            ))}
                          </ol>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Free audit CTA */}
          {result.auditType === 'free' && (
            <div className="bg-gradient-to-r from-[#6B7F4E]/20 to-[#8FA36E]/20 rounded-xl p-6 border border-[#6B7F4E]/30 mb-6">
              <p className="text-[#E2D9CC] font-semibold mb-2">¿Quieres las soluciones completas?</p>
              <p className="text-[#9A8E80] text-sm mb-4">
                La auditoría completa incluye: soluciones paso a paso, plan de acción de 4 semanas,
                presupuesto publicitario recomendado y estimaciones de mejora en porcentaje.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="bg-[#6B7F4E] hover:bg-[#8FA36E] text-[#0F0D0B] font-semibold"
                  onClick={() => {
                    onClose();
                    setTimeout(() => {
                      document.getElementById('audit-form')?.scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                  }}
                >
                  Auditoría Completa — $9.99
                </Button>
                <a
                  href="https://wa.me/584221754245"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="border-[#6B7F4E] text-[#8FA36E] hover:bg-[#6B7F4E]/10">
                    <MessageCircle className="w-4 h-4 mr-2" /> Hablar con Daniela
                  </Button>
                </a>
              </div>
            </div>
          )}

          {/* Complete audit - packages */}
          {result.auditType === 'complete' && (
            <div className="bg-gradient-to-r from-[#6B7F4E]/20 to-[#8FA36E]/20 rounded-xl p-6 border border-[#6B7F4E]/30 mb-6">
              <p className="text-[#E2D9CC] font-semibold mb-2">¿Quieres que lo implementemos por ti?</p>
              <p className="text-[#9A8E80] text-sm mb-4">
                Agenda una llamada gratuita y te explicamos cómo podemos transformar tu negocio.
              </p>
              <a
                href="https://wa.me/584221754245"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-[#6B7F4E] hover:bg-[#8FA36E] text-[#0F0D0B] font-semibold">
                  <MessageCircle className="w-4 h-4 mr-2" /> Agenda tu llamada GRATIS
                </Button>
              </a>
            </div>
          )}

          {/* Full report toggle for complete */}
          {result.auditType === 'complete' && result.reportMarkdown && (
            <div>
              <button
                onClick={() => setShowFullReport(!showFullReport)}
                className="text-[#8FA36E] text-sm flex items-center gap-1 hover:underline"
              >
                {showFullReport ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showFullReport ? 'Ocultar' : 'Ver'} reporte completo
              </button>
              {showFullReport && (
                <div className="mt-4 bg-[#0F0D0B] rounded-xl p-4 border border-[#2A2520] text-sm text-[#9A8E80] max-h-96 overflow-y-auto whitespace-pre-wrap">
                  {result.reportMarkdown}
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[#9A8E80] text-xs mt-6 border-t border-[#2A2520] pt-4">
            ⚠️ Esta auditoría es un diagnóstico orientativo basado en los datos proporcionados. Los porcentajes de mejora son estimaciones de potencial, no garantías de resultados. Los resultados dependen de la implementación y la inversión publicitaria.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Page ──────────────────────────────────────────
export default function Home() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '', email: '', whatsapp: '', website: '', businessType: '',
    followers: '', monthlyRevenue: '', revenueGoal: '',
    usesAutomation: false, frustration: '', auditType: 'free' as 'free' | 'complete',
  });
  const [referralCode, setReferralCode] = useState('');
  const [referrerName, setReferrerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [countdown, setCountdown] = useState({ hours: 3, minutes: 59, seconds: 59 });

  // Check for referral code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      // Fetch referrer name
      fetch(`/api/referral?code=${ref}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid) setReferrerName(data.referrerName);
        })
        .catch(() => {});
    }
  }, []);

  // Promo countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({ title: 'Campos requeridos', description: 'Nombre y email son obligatorios', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, referralCode: referralCode || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        toast({
          title: '¡Auditoría generada!',
          description: data.auditType === 'free'
            ? 'Tu auditoría express está lista. Revisa tus resultados.'
            : 'Tu auditoría completa está lista. Revisa tu reporte detallado.',
        });
      } else {
        toast({ title: 'Error', description: data.error || 'Intenta de nuevo', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error de conexión', description: 'Intenta de nuevo en unos minutos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F0D0B]">
      {/* ─── Promo Banner ─── */}
      <div className="bg-[#6B7F4E] text-[#0F0D0B] text-center py-2 px-4 text-sm font-semibold overflow-hidden">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Gift className="w-4 h-4" />
          <span>OFERTA: Adquiere un paquete HOY y tu auditoría es GRATIS + $9.99 de descuento</span>
          <span className="bg-[#0F0D0B] text-[#8FA36E] px-2 py-0.5 rounded text-xs font-mono">
            {String(countdown.hours).padStart(2,'0')}:{String(countdown.minutes).padStart(2,'0')}:{String(countdown.seconds).padStart(2,'0')}
          </span>
        </div>
      </div>

      {/* ─── NAV ─── */}
      <nav className="border-b border-[#2A2520] px-4 md:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#6B7F4E] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#0F0D0B]" />
            </div>
            <span className="font-[family-name:var(--font-playfair)] text-lg text-[#E2D9CC] italic">LLAVE DIGITAL 3.0</span>
          </div>
          <a
            href="https://wa.me/584221754245"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="border-[#6B7F4E] text-[#8FA36E] hover:bg-[#6B7F4E]/10">
              <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
            </Button>
          </a>
        </div>
      </nav>

      <main className="flex-1">
        {/* ─── HERO ─── */}
        <section className="relative px-4 md:px-8 py-16 md:py-24 overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6B7F4E]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <FadeInSection>
              <Badge className="bg-[#6B7F4E]/20 text-[#8FA36E] border-[#6B7F4E]/30 mb-6">
                <Sparkles className="w-3 h-3 mr-1" /> Impulsado por Inteligencia Artificial
              </Badge>
            </FadeInSection>

            <FadeInSection>
              <h1 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl lg:text-6xl text-[#E2D9CC] leading-tight mb-6">
                Descubre <span className="animate-shimmer">exactamente</span> por qué tu negocio digital no vende lo que debería
              </h1>
            </FadeInSection>

            <FadeInSection>
              <p className="text-[#9A8E80] text-lg md:text-xl max-w-2xl mx-auto mb-8">
                Auditoría inteligente que analiza tu negocio en minutos y te dice QUÉ falla, CÓMO solucionarlo y qué PORCENTAJE de mejora puedes lograr.
              </p>
            </FadeInSection>

            {referrerName && (
              <FadeInSection>
                <div className="bg-[#1E1B16] border border-[#6B7F4E]/30 rounded-xl px-4 py-3 inline-flex items-center gap-2 mb-6">
                  <Handshake className="w-4 h-4 text-[#8FA36E]" />
                  <span className="text-sm text-[#E2D9CC]">
                    <strong className="text-[#8FA36E]">{referrerName}</strong> te invitó — los DOS reciben beneficio
                  </span>
                </div>
              </FadeInSection>
            )}

            <FadeInSection>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-[#6B7F4E] hover:bg-[#8FA36E] text-[#0F0D0B] font-semibold text-lg px-8 h-14 animate-pulse-glow"
                  onClick={() => document.getElementById('audit-form')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Comenzar Auditoría Gratis <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#6B7F4E] text-[#8FA36E] hover:bg-[#6B7F4E]/10 text-lg px-8 h-14"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, auditType: 'complete' }));
                    document.getElementById('audit-form')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Auditoría Completa — $9.99
                </Button>
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* ─── SOCIAL PROOF BAR ─── */}
        <section className="border-y border-[#2A2520] py-6 px-4">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-8 text-[#9A8E80] text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#8FA36E]" />
              <span><strong className="text-[#E2D9CC]">10+</strong> testimonios</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#8FA36E]" />
              <span><strong className="text-[#E2D9CC]">7</strong> países</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[#8FA36E]" />
              <span><strong className="text-[#E2D9CC]">8+</strong> años de experiencia</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#8FA36E]" />
              <span><strong className="text-[#E2D9CC]">IA</strong> de última generación</span>
            </div>
          </div>
        </section>

        {/* ─── WHAT IS IT ─── */}
        <section className="px-4 md:px-8 py-16 md:py-20">
          <div className="max-w-5xl mx-auto">
            <FadeInSection>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#E2D9CC] text-center mb-4">
                ¿Qué es la Auditoría Digital IA?
              </h2>
              <p className="text-[#9A8E80] text-center max-w-2xl mx-auto mb-12">
                Un diagnóstico inteligente que analiza tu negocio digital, detecta problemas críticos y te da soluciones concretas. Sin tecnicismos. Sin complicaciones.
              </p>
            </FadeInSection>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Search className="w-6 h-6" />,
                  title: 'Detecta problemas',
                  desc: 'La IA identifica exactamente qué está frenando tus ventas: velocidad, diseño, automatización, presencia digital y más.'
                },
                {
                  icon: <Target className="w-6 h-6" />,
                  title: 'Soluciones concretas',
                  desc: 'No solo te dice qué falla. Te da pasos específicos para solucionarlo, con porcentaje de mejora potencial estimado.'
                },
                {
                  icon: <Megaphone className="w-6 h-6" />,
                  title: 'Incluye publicidad',
                  desc: 'Te recomienda presupuesto publicitario según tu producto y 2 conjuntos de campaña: alcance y retargeting para vender rápido.'
                },
              ].map((item, i) => (
                <FadeInSection key={i}>
                  <Card className="bg-[#1E1B16] border-[#2A2520] hover:border-[#6B7F4E]/50 transition-colors h-full">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-[#6B7F4E]/10 flex items-center justify-center text-[#8FA36E] mb-3">
                        {item.icon}
                      </div>
                      <CardTitle className="text-[#E2D9CC] text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#9A8E80] text-sm">{item.desc}</p>
                    </CardContent>
                  </Card>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="px-4 md:px-8 py-16 md:py-20 bg-[#1E1B16]/50">
          <div className="max-w-4xl mx-auto">
            <FadeInSection>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#E2D9CC] text-center mb-12">
                3 pasos. 2 minutos. Resultados inmediatos.
              </h2>
            </FadeInSection>

            <div className="space-y-8">
              {[
                {
                  step: '01',
                  icon: <MousePointerClick className="w-5 h-5" />,
                  title: 'Responde 10 preguntas',
                  desc: 'Cuéntanos sobre tu negocio, tu facturación actual, tu meta y tu mayor frustración. Sin tecnicismos.'
                },
                {
                  step: '02',
                  icon: <Bot className="w-5 h-5" />,
                  title: 'La IA analiza tu negocio',
                  desc: 'Nuestro motor de inteligencia artificial procesa tus datos y genera un diagnóstico personalizado en segundos.'
                },
                {
                  step: '03',
                  icon: <BarChart3 className="w-5 h-5" />,
                  title: 'Recibe tu reporte',
                  desc: 'Tu score, problemas críticos, soluciones y presupuesto publicitario recomendado. Gratis o completo por $9.99.'
                },
              ].map((item, i) => (
                <FadeInSection key={i}>
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#6B7F4E]/10 border border-[#6B7F4E]/30 flex items-center justify-center text-[#8FA36E] shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <span className="text-[#6B7F4E] text-sm font-mono mb-1 block">PASO {item.step}</span>
                      <h3 className="text-[#E2D9CC] text-xl font-semibold mb-2">{item.title}</h3>
                      <p className="text-[#9A8E80]">{item.desc}</p>
                    </div>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FREE vs PAID COMPARISON ─── */}
        <section className="px-4 md:px-8 py-16 md:py-20">
          <div className="max-w-5xl mx-auto">
            <FadeInSection>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#E2D9CC] text-center mb-4">
                ¿Gratis o Completa?
              </h2>
              <p className="text-[#9A8E80] text-center max-w-xl mx-auto mb-12">
                Elige la que necesitas. Ambas te dan valor. La completa te da el plan de acción.
              </p>
            </FadeInSection>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <FadeInSection>
                <Card className="bg-[#1E1B16] border-[#2A2520] hover:border-[#9A8E80]/50 transition-colors h-full">
                  <CardHeader>
                    <Badge className="bg-[#9A8E80]/20 text-[#9A8E80] w-fit mb-2">EXPRESS</Badge>
                    <CardTitle className="text-[#E2D9CC] text-2xl">Gratis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      'Score general de tu negocio',
                      '3 problemas críticos identificados',
                      'Impacto en porcentaje de cada problema',
                      'Resultado inmediato',
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-[#9A8E80] mt-0.5 shrink-0" />
                        <span className="text-[#9A8E80]">{item}</span>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-[#2A2520] mt-4">
                      <p className="text-[#9A8E80] text-xs">NO incluye: soluciones detalladas, plan de acción, presupuesto publicitario</p>
                    </div>
                  </CardContent>
                </Card>
              </FadeInSection>

              <FadeInSection>
                <Card className="bg-[#1E1B16] border-[#6B7F4E]/50 hover:border-[#6B7F4E] transition-colors h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#6B7F4E] text-[#0F0D0B] text-xs font-bold px-3 py-1 rounded-bl-lg">
                    RECOMENDADA
                  </div>
                  <CardHeader>
                    <Badge className="bg-[#6B7F4E]/20 text-[#8FA36E] w-fit mb-2">COMPLETA</Badge>
                    <CardTitle className="text-[#E2D9CC] text-2xl">$9.99 <span className="text-base text-[#9A8E80] line-through ml-2">$47</span></CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      'Todo lo de la Express',
                      'Score detallado por cada área (5 áreas)',
                      'Soluciones paso a paso para cada problema',
                      'Plan de acción de 4 semanas',
                      'Presupuesto publicitario recomendado',
                      '2 conjuntos de campaña sugeridos',
                      'Reporte PDF profesional',
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-[#8FA36E] mt-0.5 shrink-0" />
                        <span className="text-[#E2D9CC]">{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </FadeInSection>
            </div>
          </div>
        </section>

        {/* ─── WHAT THE REPORT INCLUDES ─── */}
        <section className="px-4 md:px-8 py-16 md:py-20 bg-[#1E1B16]/50">
          <div className="max-w-4xl mx-auto">
            <FadeInSection>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#E2D9CC] text-center mb-12">
                Lo que incluye tu reporte
              </h2>
            </FadeInSection>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: <BarChart3 className="w-5 h-5" />, title: 'Score General', desc: 'Puntuación del 1 al 100 con desglose por área' },
                { icon: <AlertTriangle className="w-5 h-5" />, title: '3 Problemas Críticos', desc: 'Con impacto en porcentaje, no en montos' },
                { icon: <Target className="w-5 h-5" />, title: 'Soluciones Paso a Paso', desc: 'Cada problema con instrucciones claras' },
                { icon: <Clock className="w-5 h-5" />, title: 'Plan de 4 Semanas', desc: 'Calendario de implementación progresiva' },
                { icon: <Megaphone className="w-5 h-5" />, title: 'Presupuesto Publicitario', desc: 'Según tu tipo de producto y precio' },
                { icon: <TrendingUp className="w-5 h-5" />, title: '2 Conjuntos de Campaña', desc: 'Alcance + Retargeting para vender rápido' },
              ].map((item, i) => (
                <FadeInSection key={i}>
                  <div className="flex items-start gap-3 bg-[#1E1B16] border border-[#2A2520] rounded-xl p-4 hover:border-[#6B7F4E]/30 transition-colors">
                    <div className="text-[#8FA36E] shrink-0 mt-0.5">{item.icon}</div>
                    <div>
                      <h4 className="text-[#E2D9CC] font-semibold text-sm mb-1">{item.title}</h4>
                      <p className="text-[#9A8E80] text-xs">{item.desc}</p>
                    </div>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* ─── AUDIT FORM ─── */}
        <section id="audit-form" className="px-4 md:px-8 py-16 md:py-20 scroll-mt-20">
          <div className="max-w-2xl mx-auto">
            <FadeInSection>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#E2D9CC] text-center mb-4">
                Comienza tu auditoría
              </h2>
              <p className="text-[#9A8E80] text-center mb-8">
                Responde estas preguntas y la IA hará el resto. En minutos tendrás tu diagnóstico.
              </p>
            </FadeInSection>

            <FadeInSection>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Audit type toggle */}
                <div className="bg-[#1E1B16] border border-[#2A2520] rounded-xl p-4">
                  <p className="text-sm text-[#9A8E80] mb-3">Tipo de auditoría:</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, auditType: 'free' }))}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                        formData.auditType === 'free'
                          ? 'bg-[#9A8E80]/20 text-[#E2D9CC] border border-[#9A8E80]'
                          : 'bg-[#0F0D0B] text-[#9A8E80] border border-[#2A2520] hover:border-[#9A8E80]/50'
                      }`}
                    >
                      Express — Gratis
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, auditType: 'complete' }))}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                        formData.auditType === 'complete'
                          ? 'bg-[#6B7F4E]/20 text-[#8FA36E] border border-[#6B7F4E]'
                          : 'bg-[#0F0D0B] text-[#9A8E80] border border-[#2A2520] hover:border-[#6B7F4E]/50'
                      }`}
                    >
                      Completa — $9.99
                    </button>
                  </div>
                </div>

                {/* Personal info */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#E2D9CC] text-sm">Nombre *</Label>
                    <Input
                      className="bg-[#1E1B16] border-[#2A2520] text-[#E2D9CC] focus:border-[#6B7F4E] focus:ring-[#6B7F4E]"
                      placeholder="Tu nombre"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#E2D9CC] text-sm">Email *</Label>
                    <Input
                      type="email"
                      className="bg-[#1E1B16] border-[#2A2520] text-[#E2D9CC] focus:border-[#6B7F4E] focus:ring-[#6B7F4E]"
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#E2D9CC] text-sm">WhatsApp</Label>
                    <Input
                      className="bg-[#1E1B16] border-[#2A2520] text-[#E2D9CC] focus:border-[#6B7F4E] focus:ring-[#6B7F4E]"
                      placeholder="+58 422 1234567"
                      value={formData.whatsapp}
                      onChange={e => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#E2D9CC] text-sm">Sitio web</Label>
                    <Input
                      className="bg-[#1E1B16] border-[#2A2520] text-[#E2D9CC] focus:border-[#6B7F4E] focus:ring-[#6B7F4E]"
                      placeholder="tunegocio.com"
                      value={formData.website}
                      onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Business info */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#E2D9CC] text-sm">Tipo de negocio</Label>
                    <Input
                      className="bg-[#1E1B16] border-[#2A2520] text-[#E2D9CC] focus:border-[#6B7F4E] focus:ring-[#6B7F4E]"
                      placeholder="Ej: Tienda de ropa, consultoría..."
                      value={formData.businessType}
                      onChange={e => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#E2D9CC] text-sm">Seguidores en redes</Label>
                    <Input
                      className="bg-[#1E1B16] border-[#2A2520] text-[#E2D9CC] focus:border-[#6B7F4E] focus:ring-[#6B7F4E]"
                      placeholder="Ej: 3,000"
                      value={formData.followers}
                      onChange={e => setFormData(prev => ({ ...prev, followers: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#E2D9CC] text-sm">Facturación mensual actual</Label>
                    <Input
                      className="bg-[#1E1B16] border-[#2A2520] text-[#E2D9CC] focus:border-[#6B7F4E] focus:ring-[#6B7F4E]"
                      placeholder="Ej: $300 USD"
                      value={formData.monthlyRevenue}
                      onChange={e => setFormData(prev => ({ ...prev, monthlyRevenue: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#E2D9CC] text-sm">Meta de facturación</Label>
                    <Input
                      className="bg-[#1E1B16] border-[#2A2520] text-[#E2D9CC] focus:border-[#6B7F4E] focus:ring-[#6B7F4E]"
                      placeholder="Ej: $2,000 USD"
                      value={formData.revenueGoal}
                      onChange={e => setFormData(prev => ({ ...prev, revenueGoal: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Automation */}
                <div className="bg-[#1E1B16] border border-[#2A2520] rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <Label className="text-[#E2D9CC] text-sm">¿Usas automatización o bots?</Label>
                    <p className="text-[#9A8E80] text-xs mt-1">WhatsApp Bot, email automático, etc.</p>
                  </div>
                  <Switch
                    checked={formData.usesAutomation}
                    onCheckedChange={val => setFormData(prev => ({ ...prev, usesAutomation: val }))}
                  />
                </div>

                {/* Frustration */}
                <div className="space-y-2">
                  <Label className="text-[#E2D9CC] text-sm">Tu mayor frustración con tu negocio digital</Label>
                  <Textarea
                    className="bg-[#1E1B16] border-[#2A2520] text-[#E2D9CC] focus:border-[#6B7F4E] focus:ring-[#6B7F4E] min-h-[80px]"
                    placeholder="Ej: Tengo visitas pero nadie compra, no sé cómo automatizar, no tengo tiempo..."
                    value={formData.frustration}
                    onChange={e => setFormData(prev => ({ ...prev, frustration: e.target.value }))}
                  />
                </div>

                {/* Referral code display */}
                {referralCode && (
                  <div className="bg-[#6B7F4E]/10 border border-[#6B7F4E]/30 rounded-xl p-3 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-[#8FA36E]" />
                    <span className="text-sm text-[#8FA36E]">Referido por: <strong>{referrerName || referralCode}</strong></span>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className={`w-full font-semibold text-lg h-14 ${
                    formData.auditType === 'complete'
                      ? 'bg-[#6B7F4E] hover:bg-[#8FA36E] text-[#0F0D0B]'
                      : 'bg-[#9A8E80]/20 hover:bg-[#9A8E80]/30 text-[#E2D9CC] border border-[#9A8E80]'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analizando tu negocio...
                    </>
                  ) : formData.auditType === 'free' ? (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Obtener Auditoría Gratis
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Obtener Auditoría Completa — $9.99
                    </>
                  )}
                </Button>

                <p className="text-center text-[#9A8E80] text-xs">
                  Al enviar, aceptas recibir comunicaciones de LLAVE DIGITAL 3.0. No spam. Puedes cancelar cuando quieras.
                </p>
              </form>
            </FadeInSection>
          </div>
        </section>

        {/* ─── PACKAGES ─── */}
        <section className="px-4 md:px-8 py-16 md:py-20 bg-[#1E1B16]/50">
          <div className="max-w-5xl mx-auto">
            <FadeInSection>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#E2D9CC] text-center mb-4">
                ¿Quieres que lo implementemos por ti?
              </h2>
              <p className="text-[#9A8E80] text-center max-w-xl mx-auto mb-4">
                La auditoría te dice QUÉ hacer. Nuestros paquetes lo HACEN por ti.
              </p>
              <div className="text-center mb-12">
                <Badge className="bg-[#6B7F4E]/20 text-[#8FA36E] border-[#6B7F4E]/30">
                  <Percent className="w-3 h-3 mr-1" /> Si compras HOY, tu auditoría es GRATIS + $9.99 de descuento
                </Badge>
              </div>
            </FadeInSection>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Impulso',
                  price: '$197',
                  color: '#9A8E80',
                  features: [
                    'Página de Ventas Premium',
                    'Bot WhatsApp Básico (50 consultas/día)',
                    'Contenido IA: 10 piezas gráficas',
                    'Setup de redes sociales',
                    '30 días de soporte',
                  ],
                  popular: false,
                },
                {
                  name: 'Crecimiento',
                  price: '$497',
                  color: '#8FA36E',
                  features: [
                    'Marketplace completo (100 productos)',
                    'Bot WhatsApp Pro + CRM',
                    'Contenido IA: 30 piezas + 3 videos',
                    '1 mes gestión de redes',
                    'Integración omnicanal',
                    '2 sesiones estratégicas',
                    '60 días de soporte',
                  ],
                  popular: true,
                },
                {
                  name: 'Dominio',
                  price: '$997',
                  color: '#6B7F4E',
                  features: [
                    'Todo lo de Crecimiento',
                    'Agente IA personalizado',
                    'MiniApp especializada',
                    'Blueprint campañas virales',
                    'Mentoría grupal 14 semanas',
                    'Social Commerce',
                    'Automatización No-Code',
                    '90 días + 3 meses mantenimiento',
                  ],
                  popular: false,
                },
              ].map((pkg, i) => (
                <FadeInSection key={i}>
                  <Card className={`bg-[#1E1B16] border-[#2A2520] h-full relative overflow-hidden ${
                    pkg.popular ? 'border-[#6B7F4E] ring-1 ring-[#6B7F4E]/30' : ''
                  }`}>
                    {pkg.popular && (
                      <div className="absolute top-0 right-0 bg-[#6B7F4E] text-[#0F0D0B] text-xs font-bold px-3 py-1 rounded-bl-lg">
                        MÁS POPULAR
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <h3 className="text-lg" style={{ color: pkg.color }}>{pkg.name}</h3>
                      <CardTitle className="text-[#E2D9CC] text-3xl">{pkg.price}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {pkg.features.map((f, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: pkg.color }} />
                          <span className="text-[#9A8E80]">{f}</span>
                        </div>
                      ))}
                      <div className="pt-4">
                        <a href="https://wa.me/584221754245" target="_blank" rel="noopener noreferrer">
                          <Button
                            className={`w-full font-semibold ${
                              pkg.popular
                                ? 'bg-[#6B7F4E] hover:bg-[#8FA36E] text-[#0F0D0B]'
                                : 'border border-[#2A2520] text-[#E2D9CC] hover:bg-[#2A2520]'
                            }`}
                            variant={pkg.popular ? 'default' : 'outline'}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" /> Agendar llamada
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* ─── REFERRAL PROGRAM ─── */}
        <section className="px-4 md:px-8 py-16 md:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <FadeInSection>
              <div className="w-16 h-16 rounded-2xl bg-[#6B7F4E]/10 flex items-center justify-center text-[#8FA36E] mx-auto mb-6">
                <Gift className="w-8 h-8" />
              </div>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#E2D9CC] mb-4">
                Programa de Referidos
              </h2>
              <p className="text-[#9A8E80] max-w-xl mx-auto mb-8">
                ¿Conoces a alguien que necesita esta auditoría? Comparte tu enlace único y gana comisiones por cada paquete que compre tu referido.
              </p>
            </FadeInSection>

            <FadeInSection>
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Auditoría completa', commission: '30%', amount: '$3' },
                  { label: 'Plan Impulso', commission: '25%', amount: '$49' },
                  { label: 'Plan Crecimiento', commission: '20%', amount: '$99' },
                ].map((item, i) => (
                  <div key={i} className="bg-[#1E1B16] border border-[#2A2520] rounded-xl p-4">
                    <p className="text-[#9A8E80] text-xs mb-1">{item.label}</p>
                    <p className="text-2xl font-bold text-[#8FA36E]">{item.commission}</p>
                    <p className="text-[#9A8E80] text-xs mt-1">= {item.amount} por referido</p>
                  </div>
                ))}
              </div>
            </FadeInSection>

            <FadeInSection>
              <Card className="bg-[#1E1B16] border-[#2A2520] text-left">
                <CardContent className="p-6">
                  <h4 className="text-[#E2D9CC] font-semibold mb-3">¿Cómo funciona?</h4>
                  <ol className="space-y-2 text-sm text-[#9A8E80]">
                    <li className="flex items-start gap-2">
                      <span className="bg-[#6B7F4E] text-[#0F0D0B] w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      Regístrate y recibe tu enlace único de referido
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-[#6B7F4E] text-[#0F0D0B] w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      Comparte tu enlace con emprendedores que conozcas
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-[#6B7F4E] text-[#0F0D0B] w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      Cuando tu referido compre un paquete, tú ganas la comisión automáticamente
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </FadeInSection>
          </div>
        </section>

        {/* ─── TESTIMONIALS ─── */}
        <section className="px-4 md:px-8 py-16 md:py-20 bg-[#1E1B16]/50">
          <div className="max-w-5xl mx-auto">
            <FadeInSection>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#E2D9CC] text-center mb-12">
                Lo que dicen nuestros clientes
              </h2>
            </FadeInSection>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { name: 'Carolina M.', country: '🇻🇪 Venezuela', text: 'Daniela transformó mi tienda. En 2 semanas vendía más online que en la física.', service: 'Marketplace + Bot' },
                { name: 'James R.', country: '🇺🇸 USA', text: 'Su chatbot aumentó mi conversión 340% en el primer mes. Game-changing.', service: 'AI Chatbot' },
                { name: 'Emily C.', country: '🇺🇸 USA', text: '12K shares en 48 horas con su blueprint viral. Ella sabe lo que hace.', service: 'Campañas Virales' },
                { name: 'Gabriela T.', country: '🇲🇽 México', text: 'Encontró 3 problemas que me costaban $2,000/mes en ventas perdidas.', service: 'Auditoría' },
              ].map((t, i) => (
                <FadeInSection key={i}>
                  <Card className="bg-[#1E1B16] border-[#2A2520] h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-1 mb-3">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className="w-4 h-4 fill-[#8FA36E] text-[#8FA36E]" />
                        ))}
                      </div>
                      <p className="text-[#E2D9CC] mb-4 text-sm italic">&ldquo;{t.text}&rdquo;</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[#E2D9CC] font-semibold text-sm">{t.name}</p>
                          <p className="text-[#9A8E80] text-xs">{t.country}</p>
                        </div>
                        <Badge className="bg-[#6B7F4E]/10 text-[#8FA36E] text-xs">{t.service}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="px-4 md:px-8 py-16 md:py-20">
          <div className="max-w-2xl mx-auto">
            <FadeInSection>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#E2D9CC] text-center mb-12">
                Preguntas frecuentes
              </h2>
            </FadeInSection>

            <FadeInSection>
              <Accordion type="single" collapsible className="space-y-3">
                {[
                  {
                    q: '¿La auditoría gratis de verdad es gratis?',
                    a: 'Sí, 100% gratis. Recibirás tus 3 problemas críticos y tu score general. Sin letra pequeña, sin sorpresas. Si quieres las soluciones detalladas y el plan de acción, esa es la versión completa por $9.99.'
                  },
                  {
                    q: '¿Cómo genera el reporte la IA?',
                    a: 'Nuestro motor de inteligencia artificial analiza los datos que proporcionas sobre tu negocio: tipo de negocio, facturación, presencia digital, automatización y frustraciones. Con esa información genera un diagnóstico personalizado con scores, problemas detectados y soluciones.'
                  },
                  {
                    q: '¿Los porcentajes de mejora son garantías?',
                    a: 'No. Los porcentajes son estimaciones de potencial basadas en promedios del mercado. Los resultados reales dependen de la implementación de las soluciones y de la inversión publicitaria. Nuestro descargo siempre es claro: esto es un diagnóstico, no una garantía.'
                  },
                  {
                    q: '¿Por qué incluye publicidad si yo solo quiero saber si mi web está bien?',
                    a: 'Porque la mejor tienda del mundo no vende si nadie la ve. La publicidad es parte integral del éxito digital. Sin tráfico no hay ventas. Te recomendamos presupuesto según tu tipo de producto para que tengas el panorama completo.'
                  },
                  {
                    q: '¿Qué pasa si compro la auditoría completa y luego quiero un paquete?',
                    a: '¡Excelente decisión! Si adquieres cualquier paquete (Impulso $197, Crecimiento $497 o Dominio $997) dentro de las 4 horas posteriores a tu auditoría, el costo de la auditoría ($9.99) se descuenta del paquete. Es como si la auditoría te saliera gratis.'
                  },
                  {
                    q: '¿Mis datos están seguros?',
                    a: 'Sí. Tus datos se usan exclusivamente para generar tu auditoría y, si lo autorizas, enviarte información relevante. No compartimos tus datos con terceros. Puedes solicitar la eliminación de tus datos en cualquier momento por WhatsApp.'
                  },
                  {
                    q: '¿Cómo funciona el programa de referidos?',
                    a: 'Regístrate, recibe tu enlace único y compártelo. Cuando alguien compre un paquete a través de tu enlace, ganas una comisión del 15-30% según el paquete. Es una sola nivel: tú ganas por las personas que tú refieres directamente. Sin límites de referidos.'
                  },
                ].map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="bg-[#1E1B16] border border-[#2A2520] rounded-xl px-4">
                    <AccordionTrigger className="text-[#E2D9CC] text-sm text-left hover:text-[#8FA36E]">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-[#9A8E80] text-sm">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </FadeInSection>
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="px-4 md:px-8 py-16 md:py-24 bg-gradient-to-b from-[#1E1B16]/50 to-[#0F0D0B]">
          <div className="max-w-3xl mx-auto text-center">
            <FadeInSection>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#E2D9CC] mb-4">
                Tu negocio digital puede vender más. Descubre cómo.
              </h2>
              <p className="text-[#9A8E80] mb-8">
                2 minutos. 10 preguntas. Un diagnóstico que puede cambiar la dirección de tu negocio.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-[#6B7F4E] hover:bg-[#8FA36E] text-[#0F0D0B] font-semibold text-lg px-8 h-14 animate-pulse-glow"
                  onClick={() => document.getElementById('audit-form')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Comenzar Auditoría Gratis <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <a href="https://wa.me/584221754245" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="border-[#6B7F4E] text-[#8FA36E] hover:bg-[#6B7F4E]/10 text-lg px-8 h-14">
                    <MessageCircle className="w-5 h-5 mr-2" /> Hablar por WhatsApp
                  </Button>
                </a>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[#2A2520] px-4 md:px-8 py-8 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#6B7F4E] flex items-center justify-center">
              <Zap className="w-3 h-3 text-[#0F0D0B]" />
            </div>
            <span className="font-[family-name:var(--font-playfair)] text-sm text-[#9A8E80] italic">LLAVE DIGITAL 3.0</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[#9A8E80]">
            <a href="https://instagram.com/danidigital3.0" target="_blank" rel="noopener noreferrer" className="hover:text-[#8FA36E] transition-colors">Instagram</a>
            <a href="https://tiktok.com/@elvlog.dedani" target="_blank" rel="noopener noreferrer" className="hover:text-[#8FA36E] transition-colors">TikTok</a>
            <a href="https://wa.me/584221754245" target="_blank" rel="noopener noreferrer" className="hover:text-[#8FA36E] transition-colors">WhatsApp</a>
          </div>
          <p className="text-[#9A8E80] text-xs">
            &copy; 2026 LLAVE DIGITAL 3.0. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* ─── RESULT MODAL ─── */}
      <AnimatePresence>
        {result && (
          <AuditResultModal
            result={result}
            onClose={() => setResult(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
