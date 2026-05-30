'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Search, Zap, Bot, Globe, TrendingUp, Clock,
  CheckCircle, ArrowRight, Star, Users, BarChart3, MessageCircle,
  ChevronDown, ChevronUp, Sparkles, AlertTriangle, Target, MousePointerClick,
  Loader2, Gift, Percent, Megaphone, Handshake, Instagram,
  CircleDollarSign, Store, Palette, Copy, Check, Shield, Rocket, Crown,
  ArrowUpRight, Play, ChevronRight
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

// ─── PREMIUM OLIVE GREEN (2 tones lighter) ───
const OLIVE = '#7C8F58';
const OLIVE_LIGHT = '#9AAC72';
const OLIVE_DARK = '#5C6B3C';
const OLIVE_GLOW = 'rgba(124,143,88,0.35)';
const OLIVE_GLOW_STRONG = 'rgba(124,143,88,0.6)';
const NEON_BORDER = `1px solid ${OLIVE}`;
const NEON_SHADOW = `0 0 15px ${OLIVE_GLOW}, 0 0 30px ${OLIVE_GLOW}40, inset 0 0 15px ${OLIVE_GLOW}20`;
const NEON_SHADOW_BTN = `0 0 20px ${OLIVE_GLOW}, 0 0 40px ${OLIVE_GLOW}30`;

// TikTok SVG Icon
function TikTokIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.84a8.28 8.28 0 004.76 1.5V6.89a4.84 4.84 0 01-1-.2z"/>
    </svg>
  );
}

// WhatsApp SVG Icon
function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: 'easeOut', delay }} className={className}>
      {children}
    </motion.div>
  );
}

function ScoreCircle({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const o = c - (score / 100) * c;
  const col = score >= 70 ? OLIVE_LIGHT : score >= 40 ? '#D4A843' : '#DC2626';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2A2520" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth="8" strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: col }}>{score}</span>
        <span className="text-xs text-[#9A8E80]">/100</span>
      </div>
    </div>
  );
}

function AuditResultModal({ result, onClose }: { result: any; onClose: () => void }) {
  const [showFull, setShowFull] = useState(false);
  if (!result) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#1E1B16] rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 border border-[#2A2520]" style={{ boxShadow: NEON_SHADOW }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-[family-name:var(--font-poppins)] text-2xl text-[#E2D9CC] font-semibold">
            {result.auditType === 'free' ? 'Tu Auditoría Express' : 'Tu Auditoría Completa'}
          </h3>
          <button onClick={onClose} className="text-[#9A8E80] hover:text-[#E2D9CC] text-2xl">&times;</button>
        </div>
        <div className="flex items-center gap-6 mb-8">
          <ScoreCircle score={result.score} />
          <div>
            <p className="text-[#9A8E80] text-sm mb-1">Score General</p>
            <p className="text-lg text-[#E2D9CC]">
              {result.score >= 70 ? 'Va bien, pero puede mejorar' : result.score >= 40 ? 'Hay oportunidades importantes' : 'Necesita atención urgente'}
            </p>
          </div>
        </div>
        <div className="space-y-4 mb-6">
          {result.problems.map((p: any, i: number) => (
            <div key={i} className="bg-[#0F0D0B] rounded-2xl p-4 border border-[#2A2520]" style={{ boxShadow: `0 4px 20px rgba(0,0,0,0.3)` }}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-[#E2D9CC] font-semibold mb-1">{p.title}</h4>
                  <p className="text-[#9A8E80] text-sm mb-2">Mejora potencial: hasta <span style={{ color: OLIVE_LIGHT }} className="font-semibold">{p.impactPercent}%</span></p>
                  {result.auditType === 'complete' && (
                    <div className="text-sm text-[#9A8E80]">
                      <p className="mb-2">{p.description}</p>
                      <p className="text-[#E2D9CC] font-medium mb-1">Solución:</p>
                      <p className="mb-2">{p.solution}</p>
                      {p.steps && <ol className="list-decimal list-inside space-y-1">{p.steps.map((s: string, j: number) => <li key={j}>{s}</li>)}</ol>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {result.auditType === 'free' ? (
          <div className="rounded-2xl p-6 border mb-6" style={{ background: `linear-gradient(135deg, ${OLIVE}20, ${OLIVE_LIGHT}10)`, borderColor: `${OLIVE}60`, boxShadow: `inset 0 0 30px ${OLIVE_GLOW}20` }}>
            <p className="text-[#E2D9CC] font-semibold mb-2">¿Quieres las soluciones completas?</p>
            <p className="text-[#9A8E80] text-sm mb-4">Incluye: soluciones paso a paso, plan de 4 semanas, campañas personalizadas y presupuesto publicitario.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="https://wa.me/584221754245?text=Hola%20Daniela%2C%20quiero%20la%20auditoría%20completa%20de%20%249.99" target="_blank" rel="noopener noreferrer">
                <Button className="font-semibold text-white rounded-2xl" style={{ background: OLIVE, boxShadow: NEON_SHADOW_BTN }}>Auditoría Completa — $9.99</Button>
              </a>
              <a href="https://wa.me/584221754245" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="rounded-2xl text-white" style={{ borderColor: OLIVE, color: OLIVE_LIGHT, boxShadow: `0 0 10px ${OLIVE_GLOW}30` }}>Hablar con Daniela</Button>
              </a>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-6 border mb-6" style={{ background: `linear-gradient(135deg, ${OLIVE}20, ${OLIVE_LIGHT}10)`, borderColor: `${OLIVE}60`, boxShadow: `inset 0 0 30px ${OLIVE_GLOW}20` }}>
            <p className="text-[#E2D9CC] font-semibold mb-2">¿Quieres que lo implementemos?</p>
            <a href="https://wa.me/584221754245" target="_blank" rel="noopener noreferrer">
              <Button className="font-semibold text-white rounded-2xl" style={{ background: OLIVE, boxShadow: NEON_SHADOW_BTN }}><MessageCircle className="w-4 h-4 mr-2" />Agenda tu llamada GRATIS</Button>
            </a>
          </div>
        )}
        {result.auditType === 'complete' && result.reportMarkdown && (
          <div>
            <button onClick={() => setShowFull(!showFull)} className="text-sm flex items-center gap-1 hover:underline" style={{ color: OLIVE_LIGHT }}>
              {showFull ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showFull ? 'Ocultar' : 'Ver'} reporte completo
            </button>
            {showFull && <div className="mt-4 bg-[#0F0D0B] rounded-2xl p-4 border border-[#2A2520] text-sm text-[#9A8E80] max-h-96 overflow-y-auto whitespace-pre-wrap">{result.reportMarkdown}</div>}
          </div>
        )}
        <p className="text-[#9A8E80] text-xs mt-6 border-t border-[#2A2520] pt-4 text-center">Esta auditoría es un diagnóstico orientativo. Los porcentajes son estimaciones de potencial, no garantías de resultados.</p>
      </motion.div>
    </motion.div>
  );
}

// ─── VALUE LADDER VISUAL ───
function ValueLadder() {
  const steps = [
    { level: 1, label: 'Auditoría Express', price: 'GRATIS', desc: '3 problemas + score', color: '#9A8E80', width: 'w-36' },
    { level: 2, label: 'Auditoría Completa', price: '$9.99', desc: 'Soluciones + campañas', color: OLIVE, width: 'w-44' },
    { level: 3, label: 'Impulso', price: '$197', desc: 'Página + Bot + Contenido', color: OLIVE_LIGHT, width: 'w-52' },
    { level: 4, label: 'Crecimiento', price: '$497', desc: 'Marketplace + CRM + Gestión', color: '#D4A843', width: 'w-60' },
    { level: 5, label: 'Dominio', price: '$997', desc: 'Ecosistema IA + Mentoría', color: '#E2D9CC', width: 'w-72' },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      {steps.map((s, i) => (
        <FadeIn key={i} delay={i * 0.1}>
          <motion.div
            whileHover={{ scale: 1.03 }}
            className={`${s.width} rounded-2xl p-3 text-center border transition-all cursor-default`}
            style={{
              background: `linear-gradient(135deg, ${s.color}15, ${s.color}08)`,
              borderColor: `${s.color}50`,
              boxShadow: `0 4px 20px ${s.color}15`
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${s.color}25`, color: s.color }}>NIVEL {s.level}</span>
              <span className="text-[#E2D9CC] text-sm font-semibold">{s.label}</span>
            </div>
            <p className="text-lg font-bold mt-1" style={{ color: s.color }}>{s.price}</p>
            <p className="text-[#9A8E80] text-[10px]">{s.desc}</p>
          </motion.div>
        </FadeIn>
      ))}
    </div>
  );
}

export default function Home() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '', email: '', whatsapp: '', website: '', socialLink: '',
    businessType: '', followers: '', monthlyRevenue: '', revenueGoal: '',
    usesAutomation: false, frustration: '', auditType: 'free' as 'free' | 'complete',
    serviceMinPrice: '', serviceMaxPrice: '',
  });
  const [referralCode, setReferralCode] = useState('');
  const [referrerName, setReferrerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [countdown, setCountdown] = useState({ h: 3, m: 59, s: 59 });

  // Referral signup
  const [refSignup, setRefSignup] = useState({ name: '', email: '', phone: '' });
  const [refLoading, setRefLoading] = useState(false);
  const [refResult, setRefResult] = useState<{ code: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const ref = p.get('ref');
    if (ref) { setReferralCode(ref); fetch(`/api/referral?code=${ref}`).then(r => r.json()).then(d => { if (d.valid) setReferrerName(d.referrerName); }).catch(() => {}); }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCountdown(prev => {
      if (prev.s > 0) return { ...prev, s: prev.s - 1 };
      if (prev.m > 0) return { h: prev.h, m: prev.m - 1, s: 59 };
      if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
      return prev;
    }), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) { toast({ title: 'Campos requeridos', description: 'Nombre y email son obligatorios', variant: 'destructive' }); return; }

    if (formData.auditType === 'complete') {
      const waMsg = encodeURIComponent(`Hola Daniela, quiero la auditoría completa de $9.99.\n\nNombre: ${formData.name}\nEmail: ${formData.email}\nNegocio: ${formData.businessType || 'No especificado'}\nSitio web: ${formData.website || 'No'}\nRed social: ${formData.socialLink || 'No'}\nFrustración: ${formData.frustration || 'No especificada'}`);
      window.open(`https://wa.me/584221754245?text=${waMsg}`, '_blank');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, referralCode: referralCode || undefined }) });
      const data = await res.json();
      if (data.success) { setResult(data); toast({ title: '¡Auditoría generada!', description: 'Tu auditoría express está lista.' }); }
      else { toast({ title: 'Error', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error de conexión', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const handleRefSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refSignup.name || !refSignup.email) { toast({ title: 'Campos requeridos', variant: 'destructive' }); return; }
    setRefLoading(true);
    try {
      const res = await fetch('/api/referral', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(refSignup) });
      const data = await res.json();
      if (data.success) { setRefResult({ code: data.code, link: data.referralLink }); toast({ title: '¡Código creado!' }); }
      else { toast({ title: 'Error', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setRefLoading(false); }
  };

  const copyLink = () => {
    if (refResult?.link) { navigator.clipboard.writeText(refResult.link); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F0D0B]" style={{ fontFamily: 'var(--font-poppins), system-ui, sans-serif' }}>

      {/* ═══ BLINKING PROMO BANNER ═══ */}
      <div className="text-white text-center py-2.5 px-4 text-sm font-bold overflow-hidden animate-blink-banner" style={{ background: `linear-gradient(90deg, ${OLIVE_DARK}, ${OLIVE}, ${OLIVE_LIGHT}, ${OLIVE}, ${OLIVE_DARK})`, backgroundSize: '300% 100%', animation: 'shimmer 3s linear infinite, banner-glow 1.5s ease-in-out infinite' }}>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Gift className="w-4 h-4" />
          <span>OFERTA: Adquiere un paquete HOY y tu auditoría es GRATIS + $9.99 de descuento</span>
          <span className="bg-black/30 px-2 py-0.5 rounded-lg text-xs font-mono backdrop-blur-sm">
            {String(countdown.h).padStart(2,'0')}:{String(countdown.m).padStart(2,'0')}:{String(countdown.s).padStart(2,'0')}
          </span>
        </div>
      </div>

      {/* ═══ NAV ═══ */}
      <nav className="border-b border-[#2A2520]/60 px-4 md:px-8 py-3 backdrop-blur-md bg-[#0F0D0B]/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center animate-pulse-glow" style={{ background: `linear-gradient(135deg, ${OLIVE}, ${OLIVE_LIGHT})`, boxShadow: NEON_SHADOW_BTN }}><Zap className="w-4 h-4 text-white" /></div>
            <div>
              <span className="font-[family-name:var(--font-poppins)] text-base text-[#E2D9CC] font-semibold">Daniela Silva</span>
              <span className="text-[#9A8E80] text-xs ml-2 hidden sm:inline">Estratega Digital</span>
            </div>
          </div>
          <a href="https://wa.me/584221754245" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="rounded-2xl text-white border-0" style={{ borderColor: OLIVE, color: 'white', background: `${OLIVE}20`, boxShadow: `0 0 10px ${OLIVE_GLOW}40` }}> <WhatsAppIcon className="w-4 h-4 mr-1" /> WhatsApp </Button>
          </a>
        </div>
      </nav>

      <main className="flex-1">

        {/* ═══ HERO WITH PHOTO BACKGROUND ═══ */}
        <section className="relative px-4 md:px-8 py-16 md:py-24 overflow-hidden min-h-[85vh] flex items-center">
          {/* Photo background */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0" style={{ backgroundImage: 'url(/daniela-hero.jpg)', backgroundSize: 'cover', backgroundPosition: 'center top', backgroundRepeat: 'no-repeat', opacity: 0.15, filter: 'blur(1px)' }} />
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(15,13,11,0.7) 0%, rgba(15,13,11,0.5) 40%, rgba(15,13,11,0.85) 75%, rgba(15,13,11,1) 100%)` }} />
          </div>
          {/* Decorative orbs */}
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl pointer-events-none animate-float" style={{ background: `${OLIVE}12` }} />
          <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full blur-3xl pointer-events-none animate-float" style={{ background: `${OLIVE_LIGHT}08`, animationDelay: '1.5s' }} />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: `${OLIVE}15`, border: `1px solid ${OLIVE}40`, boxShadow: `0 0 15px ${OLIVE_GLOW}20` }}>
                <Sparkles className="w-4 h-4" style={{ color: OLIVE_LIGHT }} />
                <span className="text-sm font-medium" style={{ color: OLIVE_LIGHT }}>Auditoría con Inteligencia Artificial</span>
              </div>
            </FadeIn>
            <FadeIn>
              <h1 className="font-[family-name:var(--font-poppins)] text-3xl md:text-5xl lg:text-[3.6rem] text-[#E2D9CC] leading-[1.08] mb-6 uppercase tracking-wide font-bold">
                DESCUBRE <span className="animate-shimmer">EXACTAMENTE</span> POR QUÉ TU NEGOCIO DIGITAL NO VENDE LO QUE DEBERÍA
              </h1>
            </FadeIn>
            <FadeIn>
              <p className="text-[#9A8E80] text-base md:text-lg max-w-2xl mx-auto mb-6">
                Auditoría inteligente que analiza tu negocio y te dice:
              </p>
              <div className="flex flex-col items-center gap-3 mb-8 max-w-md mx-auto">
                {[
                  { text: 'QUÉ falla en tu negocio digital', icon: <AlertTriangle className="w-4 h-4" /> },
                  { text: 'CÓMO solucionarlo paso a paso', icon: <Target className="w-4 h-4" /> },
                  { text: 'Qué PORCENTAJE de mejora puedes lograr', icon: <TrendingUp className="w-4 h-4" /> },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 w-full bg-[#1E1B16]/80 backdrop-blur-sm rounded-2xl px-4 py-3 border" style={{ borderColor: `${OLIVE}30`, boxShadow: `0 4px 15px rgba(0,0,0,0.3)` }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${OLIVE}20`, color: OLIVE_LIGHT }}>{item.icon}</div>
                    <span className="text-[#E2D9CC] text-sm md:text-base font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
            {referrerName && (
              <FadeIn>
                <div className="bg-[#1E1B16]/80 backdrop-blur-sm border rounded-2xl px-4 py-3 inline-flex items-center gap-2 mb-5" style={{ borderColor: `${OLIVE}60`, boxShadow: `0 0 20px ${OLIVE_GLOW}20` }}>
                  <Handshake className="w-4 h-4" style={{ color: OLIVE_LIGHT }} />
                  <span className="text-sm text-[#E2D9CC]"><strong style={{ color: OLIVE_LIGHT }}>{referrerName}</strong> te invitó — los DOS reciben beneficio</span>
                </div>
              </FadeIn>
            )}
            <FadeIn>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="text-white font-semibold text-lg px-8 h-14 rounded-2xl animate-pulse-glow" style={{ background: `linear-gradient(135deg, ${OLIVE}, ${OLIVE_LIGHT})`, boxShadow: NEON_SHADOW_BTN }} onClick={() => document.getElementById('audit-form')?.scrollIntoView({ behavior: 'smooth' })}>
                  Comenzar Auditoría Gratis <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-2xl text-white" style={{ borderColor: OLIVE, color: 'white', background: `${OLIVE}15`, boxShadow: `0 0 15px ${OLIVE_GLOW}30` }} onClick={() => { setFormData(p => ({ ...p, auditType: 'complete' })); document.getElementById('audit-form')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  Auditoría Completa — $9.99
                </Button>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ═══ SOCIAL PROOF ═══ */}
        <section className="border-y border-[#2A2520]/50 py-5 px-4" style={{ background: `linear-gradient(90deg, ${OLIVE}05, transparent, ${OLIVE}05)` }}>
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-8 md:gap-12 text-[#9A8E80] text-sm">
            {[
              { icon: <Users className="w-5 h-5" />, val: '10+', label: 'testimonios' },
              { icon: <Globe className="w-5 h-5" />, val: '7', label: 'países' },
              { icon: <Star className="w-5 h-5" />, val: '8+', label: 'años de experiencia' },
              { icon: <Bot className="w-5 h-5" />, val: 'IA', label: 'de última generación' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span style={{ color: OLIVE_LIGHT }}>{item.icon}</span>
                <span><strong className="text-[#E2D9CC]">{item.val}</strong> {item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ WHAT IS IT ═══ */}
        <section className="px-4 md:px-8 py-14 md:py-20">
          <div className="max-w-5xl mx-auto">
            <FadeIn><h2 className="font-[family-name:var(--font-poppins)] text-2xl md:text-3xl text-[#E2D9CC] text-center mb-3 font-bold">¿Qué es la Auditoría Digital IA?</h2></FadeIn>
            <FadeIn><p className="text-[#9A8E80] text-center mb-12 max-w-xl mx-auto">Un diagnóstico completo que detecta, explica y soluciona los problemas de tu negocio digital.</p></FadeIn>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: <Search className="w-7 h-7" />, title: 'Detecta problemas', desc: 'La IA identifica exactamente qué está frenando tus ventas: velocidad, diseño, automatización, presencia digital y más. Diagnóstico preciso sin tecnicismos.', gradient: 'from-[#7C8F58] to-[#5C6B3C]' },
                { icon: <Target className="w-7 h-7" />, title: 'Soluciones concretas', desc: 'No solo te dice qué falla. Te da pasos específicos para solucionarlo, con porcentaje de mejora potencial estimado. Sin letras pequeñas.', gradient: 'from-[#9AAC72] to-[#7C8F58]' },
                { icon: <Megaphone className="w-7 h-7" />, title: 'Campañas personalizadas', desc: 'Estrategias de anuncios con presupuesto calculado según tus precios: 20% diario del promedio de tus servicios, dividido en 2 conjuntos de campaña.', gradient: 'from-[#D4A843] to-[#9AAC72]' },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 0.15}>
                  <motion.div whileHover={{ y: -6, boxShadow: `0 12px 40px ${OLIVE}25` }} className="bg-[#1E1B16] rounded-3xl p-6 h-full border transition-all group" style={{ border: `1px solid ${OLIVE}35`, boxShadow: `0 8px 30px rgba(0,0,0,0.4)` }}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ background: `linear-gradient(135deg, ${OLIVE}25, ${OLIVE_LIGHT}15)`, color: OLIVE_LIGHT, boxShadow: `0 4px 15px ${OLIVE_GLOW}20` }}>{item.icon}</div>
                      <h3 className="text-[#E2D9CC] font-semibold text-lg">{item.title}</h3>
                    </div>
                    <p className="text-[#9A8E80] text-sm text-center leading-relaxed">{item.desc}</p>
                  </motion.div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS — TIMELINE ═══ */}
        <section className="px-4 md:px-8 py-14 md:py-20 bg-[#1E1B16]/50">
          <div className="max-w-3xl mx-auto">
            <FadeIn><h2 className="font-[family-name:var(--font-poppins)] text-2xl md:text-3xl text-[#E2D9CC] text-center mb-3 font-bold">3 pasos. 2 minutos. Resultados inmediatos.</h2></FadeIn>
            <FadeIn><p className="text-[#9A8E80] text-center mb-12">Tu diagnóstico personalizado está a solo un clic de distancia.</p></FadeIn>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5" style={{ background: `linear-gradient(180deg, ${OLIVE}80, ${OLIVE_LIGHT}40, ${OLIVE}10)` }} />
              {[
                { step: '01', icon: <MousePointerClick className="w-6 h-6" />, title: 'Responde 10 preguntas', desc: 'Cuéntanos sobre tu negocio, facturación, meta y frustración. Solo toma 2 minutos.', time: '2 min' },
                { step: '02', icon: <Bot className="w-6 h-6" />, title: 'La IA analiza tu negocio', desc: 'Procesa tus datos y genera un diagnóstico personalizado con IA de última generación.', time: '30 seg' },
                { step: '03', icon: <BarChart3 className="w-6 h-6" />, title: 'Recibe tu reporte', desc: 'Score, problemas, soluciones y campañas personalizadas listos para implementar.', time: 'Instantáneo' },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 0.2}>
                  <div className="relative flex items-center gap-6 mb-10 last:mb-0">
                    {/* Timeline dot */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 z-10 relative" style={{ background: `linear-gradient(135deg, ${OLIVE}, ${OLIVE_LIGHT})`, boxShadow: NEON_SHADOW_BTN, color: 'white' }}>
                      {item.icon}
                    </div>
                    {/* Content card */}
                    <div className="flex-1 bg-[#1E1B16] rounded-2xl p-5 border" style={{ border: `1px solid ${OLIVE}30`, boxShadow: `0 8px 25px rgba(0,0,0,0.4)` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `${OLIVE}20`, color: OLIVE_LIGHT }}>PASO {item.step}</span>
                        <span className="text-[10px] text-[#9A8E80] flex items-center gap-1"><Clock className="w-3 h-3" />{item.time}</span>
                      </div>
                      <h3 className="text-[#E2D9CC] font-semibold text-lg mb-1">{item.title}</h3>
                      <p className="text-[#9A8E80] text-sm">{item.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ VALUE LADDER ═══ */}
        <section className="px-4 md:px-8 py-14 md:py-20">
          <div className="max-w-5xl mx-auto">
            <FadeIn><h2 className="font-[family-name:var(--font-poppins)] text-2xl md:text-3xl text-[#E2D9CC] text-center mb-3 font-bold">Tu escalera de valor</h2></FadeIn>
            <FadeIn><p className="text-[#9A8E80] text-center mb-12 max-w-xl mx-auto">Desde el diagnóstico gratuito hasta el ecosistema completo. Cada nivel multiplica tus resultados.</p></FadeIn>
            <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-3 md:gap-4">
              {[
                { level: 'Express', price: 'GRATIS', desc: '3 problemas + score', color: '#9A8E80', height: 'h-28', icon: <Search className="w-5 h-5" /> },
                { level: 'Completa', price: '$9.99', desc: 'Soluciones + campañas', color: OLIVE, height: 'h-36', icon: <Zap className="w-5 h-5" /> },
                { level: 'Impulso', price: '$197', desc: 'Página + Bot + Contenido', color: OLIVE_LIGHT, height: 'h-44', icon: <Rocket className="w-5 h-5" /> },
                { level: 'Crecimiento', price: '$497', desc: 'Marketplace + CRM + Gestión', color: '#D4A843', height: 'h-52', icon: <TrendingUp className="w-5 h-5" /> },
                { level: 'Dominio', price: '$997', desc: 'Ecosistema IA + Mentoría', color: '#E2D9CC', height: 'h-60', icon: <Crown className="w-5 h-5" /> },
              ].map((s, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <motion.div whileHover={{ y: -8, boxShadow: `0 12px 40px ${s.color}25` }} className={`${s.height} w-40 md:w-44 rounded-3xl p-4 flex flex-col items-center justify-end text-center border transition-all cursor-default`} style={{ background: `linear-gradient(180deg, ${s.color}18, ${s.color}05)`, borderColor: `${s.color}40`, boxShadow: `0 8px 25px ${s.color}12` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: `${s.color}20`, color: s.color }}>{s.icon}</div>
                    <p className="text-[#E2D9CC] text-sm font-semibold mb-1">{s.level}</p>
                    <p className="text-xl font-bold mb-1" style={{ color: s.color }}>{s.price}</p>
                    <p className="text-[#9A8E80] text-[10px]">{s.desc}</p>
                  </motion.div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FREE vs PAID ═══ */}
        <section className="px-4 md:px-8 py-14 md:py-20 bg-[#1E1B16]/50">
          <div className="max-w-5xl mx-auto">
            <FadeIn><h2 className="font-[family-name:var(--font-poppins)] text-2xl md:text-3xl text-[#E2D9CC] text-center mb-3 font-bold">¿Gratis o Completa?</h2></FadeIn>
            <FadeIn><p className="text-[#9A8E80] text-center mb-12">Tú eliges cuánto quieres descubrir sobre tu negocio.</p></FadeIn>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <FadeIn>
                <Card className="bg-[#1E1B16] h-full rounded-3xl overflow-hidden" style={{ borderColor: OLIVE, boxShadow: `0 8px 30px rgba(0,0,0,0.5)` }}>
                  <CardHeader className="pb-3">
                    <Badge className="w-fit mb-2 rounded-full" style={{ background: `${OLIVE}20`, color: OLIVE_LIGHT }}>EXPRESS</Badge>
                    <CardTitle className="text-[#E2D9CC] text-2xl">Gratis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {['Score general de tu negocio', '3 problemas críticos identificados', 'Impacto en porcentaje de cada problema', 'Resultado inmediato'].map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm"><CheckCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: OLIVE_LIGHT }} /><span className="text-[#E2D9CC]">{item}</span></div>
                    ))}
                    <div className="pt-3 border-t border-[#2A2520] mt-3"><p className="text-[#9A8E80] text-xs text-center">NO incluye: soluciones detalladas, plan de acción, campañas personalizadas</p></div>
                  </CardContent>
                </Card>
              </FadeIn>
              <FadeIn>
                <Card className="bg-[#1E1B16] h-full relative overflow-hidden rounded-3xl" style={{ borderColor: OLIVE, boxShadow: `0 0 40px ${OLIVE}20, 0 8px 30px rgba(0,0,0,0.5)` }}>
                  <div className="absolute top-0 right-0 text-xs font-bold px-4 py-1.5 rounded-bl-2xl" style={{ background: `linear-gradient(135deg, ${OLIVE}, ${OLIVE_LIGHT})`, color: 'white' }}>RECOMENDADA</div>
                  <CardHeader className="pb-3">
                    <Badge className="w-fit mb-2 rounded-full" style={{ background: `${OLIVE}20`, color: OLIVE_LIGHT }}>COMPLETA</Badge>
                    <CardTitle className="text-[#E2D9CC] text-2xl">$9.99 <span className="text-base text-[#9A8E80] line-through ml-1">$47</span></CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {['Todo lo de la Express', 'Score detallado por cada área (5 áreas)', 'Soluciones paso a paso para cada problema', 'Plan de acción de 4 semanas (2+ pasos/semana)', 'Presupuesto publicitario según tus servicios', 'CAMPAÑAS PERSONALIZADAS: estrategias de anuncios, presupuesto adicional', 'Reporte PDF profesional'].map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm"><CheckCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: OLIVE_LIGHT }} /><span className="text-[#E2D9CC]">{item}</span></div>
                    ))}
                  </CardContent>
                </Card>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ═══ WHAT THE REPORT INCLUDES ═══ */}
        <section className="px-4 md:px-8 py-14 md:py-20">
          <div className="max-w-4xl mx-auto">
            <FadeIn><h2 className="font-[family-name:var(--font-poppins)] text-2xl md:text-3xl text-[#E2D9CC] text-center mb-3 font-bold">Lo que incluye tu reporte</h2></FadeIn>
            <FadeIn><p className="text-[#9A8E80] text-center mb-12">Cada sección diseñada para darte claridad y acción inmediata.</p></FadeIn>
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                { icon: <BarChart3 className="w-6 h-6" />, title: 'Score General', desc: 'Puntuación del 1 al 100 con desglose por área' },
                { icon: <AlertTriangle className="w-6 h-6" />, title: '3 Problemas Críticos', desc: 'Con impacto en porcentaje, no en montos' },
                { icon: <Target className="w-6 h-6" />, title: 'Soluciones Paso a Paso', desc: 'Cada problema con instrucciones claras y detalladas' },
                { icon: <Clock className="w-6 h-6" />, title: 'Plan de 4 Semanas', desc: 'Al menos 2 acciones por semana para implementar' },
                { icon: <Megaphone className="w-6 h-6" />, title: 'Presupuesto Publicitario', desc: 'Sugerencias para conseguir clientes potenciales' },
                { icon: <Zap className="w-6 h-6" />, title: 'Campañas Personalizadas', desc: 'Estrategias de anuncios, presupuesto adicional según tus servicios' },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <motion.div whileHover={{ y: -3, boxShadow: `0 8px 30px ${OLIVE}20` }} className="flex items-start gap-4 bg-[#1E1B16] rounded-2xl p-5 border transition-all group" style={{ border: `1px solid ${OLIVE}25`, boxShadow: `0 4px 15px rgba(0,0,0,0.3)` }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ background: `${OLIVE}15`, color: OLIVE_LIGHT }}>{item.icon}</div>
                    <div><h4 className="text-[#E2D9CC] font-semibold mb-1">{item.title}</h4><p className="text-[#9A8E80] text-sm">{item.desc}</p></div>
                  </motion.div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ AUDIT FORM ═══ */}
        <section id="audit-form" className="px-4 md:px-8 py-14 md:py-20 scroll-mt-20 bg-[#1E1B16]/50">
          <div className="max-w-2xl mx-auto">
            <FadeIn><h2 className="font-[family-name:var(--font-poppins)] text-2xl md:text-3xl text-[#E2D9CC] text-center mb-3 font-bold">Comienza tu auditoría</h2></FadeIn>
            <FadeIn><p className="text-[#9A8E80] text-center mb-8">Responde estas preguntas y la IA hará el resto.</p></FadeIn>
            <FadeIn>
              <form onSubmit={handleSubmit} className="space-y-5 bg-[#1E1B16] rounded-3xl p-6 md:p-8 border" style={{ border: `1px solid ${OLIVE}30`, boxShadow: `0 8px 40px rgba(0,0,0,0.5), inset 0 0 30px ${OLIVE_GLOW}10` }}>
                <div className="rounded-2xl p-4 border" style={{ background: `${OLIVE}08`, borderColor: `${OLIVE}25` }}>
                  <p className="text-sm text-[#9A8E80] mb-3 text-center">Tipo de auditoría:</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setFormData(p => ({ ...p, auditType: 'free' }))} className={`flex-1 py-3 px-4 rounded-2xl text-sm font-semibold transition-all ${formData.auditType === 'free' ? 'text-white border' : 'bg-[#0F0D0B] text-[#9A8E80] border border-[#2A2520] hover:border-[#5C6B3C]/50'}`} style={formData.auditType === 'free' ? { background: `${OLIVE}25`, borderColor: OLIVE, boxShadow: `0 0 15px ${OLIVE_GLOW}30` } : {}}>Express — Gratis</button>
                    <button type="button" onClick={() => setFormData(p => ({ ...p, auditType: 'complete' }))} className={`flex-1 py-3 px-4 rounded-2xl text-sm font-semibold transition-all ${formData.auditType === 'complete' ? 'text-white border' : 'bg-[#0F0D0B] text-[#9A8E80] border border-[#2A2520] hover:border-[#5C6B3C]/50'}`} style={formData.auditType === 'complete' ? { background: OLIVE, borderColor: OLIVE, boxShadow: NEON_SHADOW_BTN } : {}}>Completa — $9.99</button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-[#E2D9CC] text-sm">Nombre *</Label><Input className="bg-[#0F0D0B] border-[#2A2520] text-[#E2D9CC] focus:border-[#7C8F58] rounded-xl h-11" placeholder="Tu nombre" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required /></div>
                  <div className="space-y-1"><Label className="text-[#E2D9CC] text-sm">Email *</Label><Input type="email" className="bg-[#0F0D0B] border-[#2A2520] text-[#E2D9CC] focus:border-[#7C8F58] rounded-xl h-11" placeholder="tu@email.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-[#E2D9CC] text-sm">WhatsApp</Label><Input className="bg-[#0F0D0B] border-[#2A2520] text-[#E2D9CC] focus:border-[#7C8F58] rounded-xl h-11" placeholder="+58 422 1234567" value={formData.whatsapp} onChange={e => setFormData(p => ({ ...p, whatsapp: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-[#E2D9CC] text-sm">Sitio web</Label><Input className="bg-[#0F0D0B] border-[#2A2520] text-[#E2D9CC] focus:border-[#7C8F58] rounded-xl h-11" placeholder="tunegocio.com" value={formData.website} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label className="text-[#E2D9CC] text-sm">Link de red social</Label><Input className="bg-[#0F0D0B] border-[#2A2520] text-[#E2D9CC] focus:border-[#7C8F58] rounded-xl h-11" placeholder="instagram.com/tunegocio" value={formData.socialLink} onChange={e => setFormData(p => ({ ...p, socialLink: e.target.value }))} /></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-[#E2D9CC] text-sm">Tipo de negocio</Label><Input className="bg-[#0F0D0B] border-[#2A2520] text-[#E2D9CC] focus:border-[#7C8F58] rounded-xl h-11" placeholder="Tienda de ropa, consultoría..." value={formData.businessType} onChange={e => setFormData(p => ({ ...p, businessType: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-[#E2D9CC] text-sm">Seguidores en redes</Label><Input className="bg-[#0F0D0B] border-[#2A2520] text-[#E2D9CC] focus:border-[#7C8F58] rounded-xl h-11" placeholder="3,000" value={formData.followers} onChange={e => setFormData(p => ({ ...p, followers: e.target.value }))} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-[#E2D9CC] text-sm">Facturación mensual</Label><Input className="bg-[#0F0D0B] border-[#2A2520] text-[#E2D9CC] focus:border-[#7C8F58] rounded-xl h-11" placeholder="$300 USD" value={formData.monthlyRevenue} onChange={e => setFormData(p => ({ ...p, monthlyRevenue: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-[#E2D9CC] text-sm">Meta de facturación</Label><Input className="bg-[#0F0D0B] border-[#2A2520] text-[#E2D9CC] focus:border-[#7C8F58] rounded-xl h-11" placeholder="$2,000 USD" value={formData.revenueGoal} onChange={e => setFormData(p => ({ ...p, revenueGoal: e.target.value }))} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-[#E2D9CC] text-sm">Tu servicio más barato (USD)</Label><Input className="bg-[#0F0D0B] border-[#2A2520] text-[#E2D9CC] focus:border-[#7C8F58] rounded-xl h-11" placeholder="Ej: 30" value={formData.serviceMinPrice} onChange={e => setFormData(p => ({ ...p, serviceMinPrice: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-[#E2D9CC] text-sm">Tu servicio más caro (USD)</Label><Input className="bg-[#0F0D0B] border-[#2A2520] text-[#E2D9CC] focus:border-[#7C8F58] rounded-xl h-11" placeholder="Ej: 200" value={formData.serviceMaxPrice} onChange={e => setFormData(p => ({ ...p, serviceMaxPrice: e.target.value }))} /></div>
                </div>
                <div className="rounded-2xl p-4 flex items-center justify-between border" style={{ background: `${OLIVE}08`, borderColor: `${OLIVE}25` }}>
                  <div><Label className="text-[#E2D9CC] text-sm">¿Usas automatización o bots?</Label><p className="text-[#9A8E80] text-xs mt-0.5">WhatsApp Bot, email automático...</p></div>
                  <Switch checked={formData.usesAutomation} onCheckedChange={v => setFormData(p => ({ ...p, usesAutomation: v }))} />
                </div>
                <div className="space-y-1"><Label className="text-[#E2D9CC] text-sm">Tu mayor frustración</Label><Textarea className="bg-[#0F0D0B] border-[#2A2520] text-[#E2D9CC] focus:border-[#7C8F58] rounded-xl min-h-[80px]" placeholder="Tengo visitas pero nadie compra..." value={formData.frustration} onChange={e => setFormData(p => ({ ...p, frustration: e.target.value }))} /></div>
                {referralCode && <div className="rounded-2xl p-3 flex items-center gap-2 border" style={{ background: `${OLIVE}10`, border: `1px solid ${OLIVE}40` }}><Gift className="w-4 h-4" style={{ color: OLIVE_LIGHT }} /><span className="text-sm" style={{ color: OLIVE_LIGHT }}>Referido por: <strong>{referrerName || referralCode}</strong></span></div>}
                <Button type="submit" disabled={loading} className="w-full font-semibold text-lg h-14 text-white rounded-2xl animate-pulse-glow" style={{ background: `linear-gradient(135deg, ${OLIVE}, ${OLIVE_LIGHT})`, boxShadow: NEON_SHADOW_BTN }}>
                  {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analizando...</> : formData.auditType === 'free' ? <><Zap className="w-5 h-5 mr-2" />Obtener Auditoría Gratis</> : <><WhatsAppIcon className="w-5 h-5 mr-2" />Continuar por WhatsApp — $9.99</>}
                </Button>
                <p className="text-center text-[#9A8E80] text-xs">Al enviar, aceptas recibir comunicaciones. No spam. Cancela cuando quieras.</p>
              </form>
            </FadeIn>
          </div>
        </section>

        {/* ═══ PACKAGES ═══ */}
        <section className="px-4 md:px-8 py-14 md:py-20">
          <div className="max-w-5xl mx-auto">
            <FadeIn><h2 className="font-[family-name:var(--font-poppins)] text-2xl md:text-3xl text-[#E2D9CC] text-center mb-3 font-bold">¿Quieres que lo implementemos?</h2></FadeIn>
            <FadeIn><p className="text-[#9A8E80] text-center mb-4">Elige el plan que impulse tu negocio al siguiente nivel.</p></FadeIn>
            <FadeIn><div className="text-center mb-12"><Badge className="rounded-full border px-4 py-1.5" style={{ background: `${OLIVE}20`, color: OLIVE_LIGHT, borderColor: `${OLIVE}40` }}><Percent className="w-3 h-3 mr-1" />Si compras HOY, tu auditoría es GRATIS + $9.99 de descuento</Badge></div></FadeIn>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: 'Impulso', price: '$197', icon: <Rocket className="w-5 h-5" />, features: ['Página de Ventas Premium', 'Bot WhatsApp Básico', 'Contenido IA: 10 piezas', 'Setup redes sociales', '30 días soporte'] },
                { name: 'Crecimiento', price: '$497', icon: <TrendingUp className="w-5 h-5" />, features: ['Marketplace (100 productos)', 'Bot WhatsApp Pro + CRM', 'Contenido IA: 30 piezas + 3 videos', '1 mes gestión redes', 'Integración omnicanal', '2 sesiones estratégicas', '60 días soporte'], popular: true },
                { name: 'Dominio', price: '$997', icon: <Crown className="w-5 h-5" />, features: ['Todo lo de Crecimiento', 'Agente IA personalizado', 'MiniApp especializada', 'Blueprint campañas virales', 'Mentoría 14 semanas', 'Social Commerce', 'Automatización No-Code', '90 días + 3 meses mantenimiento'] },
              ].map((pkg, i) => (
                <FadeIn key={i} delay={i * 0.15}>
                  <Card className={`bg-[#1E1B16] h-full relative overflow-hidden rounded-3xl group`} style={{ borderColor: pkg.popular ? OLIVE : '#2A2520', boxShadow: pkg.popular ? `0 0 40px ${OLIVE}20, 0 8px 30px rgba(0,0,0,0.5)` : `0 8px 30px rgba(0,0,0,0.4)` }}>
                    {pkg.popular && <div className="absolute top-0 right-0 text-xs font-bold px-4 py-1.5 rounded-bl-2xl" style={{ background: `linear-gradient(135deg, ${OLIVE}, ${OLIVE_LIGHT})`, color: 'white' }}>MÁS POPULAR</div>}
                    <CardHeader className="pb-2 pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${OLIVE}20`, color: OLIVE_LIGHT }}>{pkg.icon}</div>
                        <h3 className="text-lg font-semibold" style={{ color: OLIVE_LIGHT }}>{pkg.name}</h3>
                      </div>
                      <CardTitle className="text-[#E2D9CC] text-3xl font-bold">{pkg.price}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2.5">
                      {pkg.features.map((f, j) => <div key={j} className="flex items-start gap-2 text-sm"><CheckCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: OLIVE_LIGHT }} /><span className="text-[#9A8E80]">{f}</span></div>)}
                      <div className="pt-4"><a href="https://wa.me/584221754245" target="_blank" rel="noopener noreferrer"><Button className={`w-full font-semibold rounded-2xl h-12 text-white transition-all`} style={pkg.popular ? { background: `linear-gradient(135deg, ${OLIVE}, ${OLIVE_LIGHT})`, boxShadow: NEON_SHADOW_BTN } : { background: `${OLIVE}15`, borderColor: OLIVE, color: 'white', boxShadow: `0 0 10px ${OLIVE_GLOW}20` }} variant={pkg.popular ? 'default' : 'outline'}><WhatsAppIcon className="w-4 h-4 mr-2" />Agendar llamada</Button></a></div>
                    </CardContent>
                  </Card>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ REFERRAL PROGRAM ═══ */}
        <section className="px-4 md:px-8 py-14 md:py-20 bg-[#1E1B16]/50">
          <div className="max-w-3xl mx-auto">
            <FadeIn>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow" style={{ background: `linear-gradient(135deg, ${OLIVE}20, ${OLIVE_LIGHT}10)`, boxShadow: `0 0 20px ${OLIVE_GLOW}30` }}><Gift className="w-8 h-8" style={{ color: OLIVE_LIGHT }} /></div>
                <h2 className="font-[family-name:var(--font-poppins)] text-2xl md:text-3xl text-[#E2D9CC] mb-3 font-bold">Programa de Referidos</h2>
                <p className="text-[#9A8E80] max-w-xl mx-auto">Comparte tu enlace único y gana <strong className="text-[#E2D9CC]">10% de comisión</strong> por cada paquete que compre tu referido.</p>
              </div>
            </FadeIn>
            <FadeIn>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Impulso $197', commission: '$19.70' },
                  { label: 'Crecimiento $497', commission: '$49.70' },
                  { label: 'Dominio $997', commission: '$99.70' },
                ].map((item, i) => (
                  <div key={i} className="bg-[#1E1B16] border rounded-2xl p-4 text-center" style={{ borderColor: `${OLIVE}30`, boxShadow: `0 4px 15px rgba(0,0,0,0.3)` }}>
                    <p className="text-[#9A8E80] text-xs mb-1">{item.label}</p>
                    <p className="text-2xl font-bold" style={{ color: OLIVE_LIGHT }}>{item.commission}</p>
                    <p className="text-[#9A8E80] text-[10px] mt-1">10% por referido</p>
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn>
              <Card className="bg-[#1E1B16] border rounded-3xl" style={{ borderColor: `${OLIVE}30`, boxShadow: `0 8px 30px rgba(0,0,0,0.4)` }}>
                <CardContent className="p-6">
                  {!refResult ? (
                    <form onSubmit={handleRefSignup} className="space-y-3">
                      <h4 className="text-[#E2D9CC] font-semibold mb-2 text-center">Genera tu enlace de referido</h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Input className="bg-[#0F0D0B] border-[#2A2520] text-[#E2D9CC] rounded-xl h-11" placeholder="Tu nombre" value={refSignup.name} onChange={e => setRefSignup(p => ({ ...p, name: e.target.value }))} required />
                        <Input type="email" className="bg-[#0F0D0B] border-[#2A2520] text-[#E2D9CC] rounded-xl h-11" placeholder="Tu email" value={refSignup.email} onChange={e => setRefSignup(p => ({ ...p, email: e.target.value }))} required />
                      </div>
                      <Input className="bg-[#0F0D0B] border-[#2A2520] text-[#E2D9CC] rounded-xl h-11" placeholder="Tu WhatsApp (opcional)" value={refSignup.phone} onChange={e => setRefSignup(p => ({ ...p, phone: e.target.value }))} />
                      <Button type="submit" disabled={refLoading} className="w-full font-semibold text-white rounded-2xl h-12" style={{ background: `linear-gradient(135deg, ${OLIVE}, ${OLIVE_LIGHT})`, boxShadow: NEON_SHADOW_BTN }}>
                        {refLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {refLoading ? 'Generando...' : 'Generar mi enlace de referido'}
                      </Button>
                    </form>
                  ) : (
                    <div className="text-center space-y-3">
                      <CheckCircle className="w-12 h-12 mx-auto" style={{ color: OLIVE_LIGHT }} />
                      <h4 className="text-[#E2D9CC] font-semibold text-lg">¡Tu enlace está listo!</h4>
                      <div className="flex items-center gap-2 bg-[#0F0D0B] rounded-xl p-3 border" style={{ borderColor: `${OLIVE}30` }}>
                        <code className="text-xs flex-1 break-all" style={{ color: OLIVE_LIGHT }}>{refResult.link}</code>
                        <button onClick={copyLink} className="shrink-0 p-1.5 rounded-lg hover:bg-[#2A2520] transition-colors">
                          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#9A8E80]" />}
                        </button>
                      </div>
                      <p className="text-[#9A8E80] text-xs">Comparte este enlace y gana 10% por cada paquete vendido</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </section>

        {/* ═══ TESTIMONIALS ═══ */}
        <section className="px-4 md:px-8 py-14 md:py-20">
          <div className="max-w-5xl mx-auto">
            <FadeIn><h2 className="font-[family-name:var(--font-poppins)] text-2xl md:text-3xl text-[#E2D9CC] text-center mb-3 font-bold">Lo que dicen nuestros clientes</h2></FadeIn>
            <FadeIn><p className="text-[#9A8E80] text-center mb-10">Resultados reales de negocios que ya transformaron su estrategia.</p></FadeIn>
            <FadeIn>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
                {[
                  { name: 'Carolina M.', country: '🇻🇪', text: 'En 2 semanas vendía más online que en la física.', service: 'Marketplace' },
                  { name: 'James R.', country: '🇺🇸', text: 'Chatbot increased my conversion 340% in month one. Game-changing.', service: 'AI Chatbot' },
                  { name: 'María F.', country: '🇨🇴', text: 'La asesoría fue la mejor inversión. 31 días vendiendo automático.', service: 'Asesoría' },
                  { name: 'Emily C.', country: '🇺🇸', text: '12K shares in 48 hours with her viral blueprint. She knows her stuff.', service: 'Campañas' },
                  { name: 'Ana K.', country: '🇻🇪', text: 'Contenido IA hollywoodense. TikTok de 200 a 15K vistas.', service: 'Contenido IA' },
                  { name: 'Gabriela T.', country: '🇲🇽', text: 'Encontró 3 problemas que me costaban ventas perdidas.', service: 'Auditoría' },
                ].map((t, i) => (
                  <div key={i} className="shrink-0 w-52 bg-[#1E1B16] border rounded-3xl p-5 text-center snap-start" style={{ borderColor: `${OLIVE}25`, boxShadow: `0 8px 25px rgba(0,0,0,0.4)` }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold" style={{ background: `linear-gradient(135deg, ${OLIVE}25, ${OLIVE_LIGHT}15)`, color: OLIVE_LIGHT, boxShadow: `0 4px 15px ${OLIVE_GLOW}20` }}>{t.name.charAt(0)}{t.name.split(' ')[1]?.charAt(0)}</div>
                    <p className="text-[#E2D9CC] text-xs italic mb-3 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                    <p className="text-[#9A8E80] text-[10px] font-semibold">{t.name} {t.country}</p>
                    <Badge className="mt-2 text-[9px] rounded-full" style={{ background: `${OLIVE}15`, color: OLIVE_LIGHT }}>{t.service}</Badge>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section className="px-4 md:px-8 py-14 md:py-20 bg-[#1E1B16]/50">
          <div className="max-w-2xl mx-auto">
            <FadeIn><h2 className="font-[family-name:var(--font-poppins)] text-2xl md:text-3xl text-[#E2D9CC] text-center mb-3 font-bold">Preguntas frecuentes</h2></FadeIn>
            <FadeIn><p className="text-[#9A8E80] text-center mb-10">Todo lo que necesitas saber antes de empezar.</p></FadeIn>
            <FadeIn>
              <Accordion type="single" collapsible className="space-y-3">
                {[
                  { q: '¿La auditoría gratis de verdad es gratis?', a: 'Sí, 100%. Recibirás tus 3 problemas críticos y tu score general. Si quieres las soluciones detalladas y el plan de acción, esa es la versión completa por $9.99.' },
                  { q: '¿Los porcentajes de mejora son garantías?', a: 'No. Son estimaciones de potencial basadas en promedios del mercado. Los resultados dependen de la implementación y la inversión publicitaria.' },
                  { q: '¿Por qué incluye publicidad?', a: 'Porque la mejor tienda del mundo no vende si nadie la ve. Sin tráfico no hay ventas. Te recomendamos presupuesto según tus precios.' },
                  { q: '¿Cómo se calcula el presupuesto publicitario?', a: 'Se calcula el promedio de tus servicios (el más caro + el más barato / 2) y el 20% de ese promedio es tu inversión diaria, dividida en 2 conjuntos de campaña con 4-5 anuncios cada uno.' },
                  { q: '¿Qué pasa si quiero un paquete después de la auditoría?', a: 'Si compras dentro de las 4 horas, la auditoría es GRATIS y los $9.99 se descuentan del paquete.' },
                  { q: '¿Cómo funciona el programa de referidos?', a: 'Generas tu enlace, lo compartes, y ganas 10% de comisión por cada paquete que compre tu referido. Un solo nivel: ganas por quienes tú refieres directamente.' },
                  { q: '¿Mis datos están seguros?', a: 'Sí. Se usan solo para tu auditoría. No compartimos con terceros. Puedes solicitar eliminación cuando quieras.' },
                ].map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="bg-[#1E1B16] border rounded-2xl px-5" style={{ borderColor: `${OLIVE}20` }}>
                    <AccordionTrigger className="text-[#E2D9CC] text-sm text-left hover:text-[#9AAC72]">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-[#9A8E80] text-sm">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </FadeIn>
          </div>
        </section>

        {/* ═══ WHITE LABEL AUDIT SECTION — PREMIUM ═══ */}
        <section className="px-4 md:px-8 py-14 md:py-20">
          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <div className="rounded-3xl relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${OLIVE}12, ${OLIVE_LIGHT}06, #1E1B16)`, border: `1px solid ${OLIVE}40`, boxShadow: `0 0 50px ${OLIVE_GLOW}20, 0 8px 40px rgba(0,0,0,0.5)` }}>
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: `${OLIVE}10` }} />
                <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full blur-3xl pointer-events-none" style={{ background: `${OLIVE_LIGHT}08` }} />
                <div className="relative z-10 p-6 md:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <Badge className="rounded-full px-4 py-1.5 text-sm font-bold" style={{ background: `linear-gradient(135deg, ${OLIVE}, ${OLIVE_LIGHT})`, color: 'white', boxShadow: NEON_SHADOW_BTN }}>NUEVO</Badge>
                    <span className="text-[#9A8E80] text-sm">Para estrategas y agencias</span>
                  </div>
                  <h2 className="font-[family-name:var(--font-poppins)] text-2xl md:text-4xl text-[#E2D9CC] mb-4 font-bold leading-tight">
                    SI TU QUIERES IMPLEMENTAR ESTA AUDITORÍA EN TU NEGOCIO,<br />
                    <span style={{ color: OLIVE_LIGHT }}>LA AJUSTAMOS A TU NICHO</span>
                  </h2>
                  <p className="text-[#9A8E80] mb-8 max-w-2xl leading-relaxed">
                    Belleza, Salud, Fitness, Legal, Coach, Inmobiliario, Gastronomía, Educación y más.
                    Vende este formato de auditoría como tu propio servicio y genera ingresos pasivos con tu expertise.
                  </p>

                  {/* Feature grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {[
                      { icon: <Palette className="w-5 h-5" />, text: 'Landing adaptada a tu nicho y marca', highlight: false },
                      { icon: <Store className="w-5 h-5" />, text: 'Tus servicios y precios integrados', highlight: false },
                      { icon: <BarChart3 className="w-5 h-5" />, text: 'Recolección de datos de clientes', highlight: false },
                      { icon: <Bot className="w-5 h-5" />, text: 'Reportes generados por IA', highlight: true },
                      { icon: <CircleDollarSign className="w-5 h-5" />, text: 'Sistema de pagos conectado', highlight: true },
                      { icon: <Globe className="w-5 h-5" />, text: 'Todos los beneficios de este servicio', highlight: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-[#0F0D0B]/60 backdrop-blur-sm rounded-2xl p-4 border transition-all hover:border-[#7C8F58]/50" style={{ borderColor: `${OLIVE}20` }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.highlight ? `${OLIVE}25` : `${OLIVE}12`, color: OLIVE_LIGHT }}>{item.icon}</div>
                        <span className="text-[#E2D9CC] text-sm font-medium">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA row */}
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-[#0F0D0B]/60 backdrop-blur-sm rounded-2xl p-6 border" style={{ borderColor: `${OLIVE}30` }}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${OLIVE}, ${OLIVE_LIGHT})`, boxShadow: NEON_SHADOW_BTN }}>
                        <Shield className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-[#E2D9CC]">$69.99</p>
                        <p className="text-[#9A8E80] text-sm">Pago único — Landing + sistema completo</p>
                      </div>
                    </div>
                    <div className="flex-1" />
                    <a href="https://wa.me/584221754245?text=Hola%20Daniela%2C%20quiero%20la%20auditoría%20adaptada%20a%20mi%20nicho%20por%20%2469.99" target="_blank" rel="noopener noreferrer">
                      <Button className="font-semibold text-white rounded-2xl h-13 px-8 text-lg animate-pulse-glow" style={{ background: `linear-gradient(135deg, ${OLIVE}, ${OLIVE_LIGHT})`, boxShadow: NEON_SHADOW_BTN }}><WhatsAppIcon className="w-5 h-5 mr-2" />Quiero la auditoría para mi nicho</Button>
                    </a>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="px-4 md:px-8 py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, ${OLIVE}10, transparent 70%)` }} />
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <FadeIn>
              <h2 className="font-[family-name:var(--font-poppins)] text-2xl md:text-4xl text-[#E2D9CC] mb-4 uppercase leading-tight font-bold">Tu negocio digital puede vender más. <span className="animate-shimmer">Descubre cómo.</span></h2>
              <p className="text-[#9A8E80] mb-8">2 minutos. 10 preguntas. Un diagnóstico que cambia la dirección de tu negocio.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="text-white font-semibold text-lg px-8 h-14 rounded-2xl animate-pulse-glow" style={{ background: `linear-gradient(135deg, ${OLIVE}, ${OLIVE_LIGHT})`, boxShadow: NEON_SHADOW_BTN }} onClick={() => document.getElementById('audit-form')?.scrollIntoView({ behavior: 'smooth' })}>Comenzar Auditoría Gratis <ArrowRight className="w-5 h-5 ml-2" /></Button>
                <a href="https://wa.me/584221754245" target="_blank" rel="noopener noreferrer"><Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-2xl text-white" style={{ borderColor: OLIVE, color: 'white', background: `${OLIVE}15`, boxShadow: `0 0 15px ${OLIVE_GLOW}30` }}><WhatsAppIcon className="w-5 h-5 mr-2" />WhatsApp</Button></a>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-[#2A2520]/50 px-4 md:px-8 py-8 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${OLIVE}, ${OLIVE_LIGHT})` }}><Zap className="w-3 h-3 text-white" /></div>
            <span className="font-[family-name:var(--font-poppins)] text-sm text-[#9A8E80]">Daniela Silva</span>
            <span className="text-[#9A8E80] text-xs">Estratega Digital</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://instagram.com/danieladigital3.0" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)', boxShadow: '0 2px 10px rgba(225,48,108,0.3)' }}>
                <Instagram className="w-5 h-5 text-white" />
              </div>
            </a>
            <a href="https://tiktok.com/@elvlog.dedani" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:shadow-lg" style={{ background: '#010101', border: '1px solid #25F4EE', boxShadow: '0 2px 10px rgba(0,242,234,0.3)' }}>
                <TikTokIcon className="w-5 h-5 text-white" />
              </div>
            </a>
            <a href="https://wa.me/584221754245" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:shadow-lg" style={{ background: '#25D366', boxShadow: '0 2px 10px rgba(37,211,102,0.3)' }}>
                <WhatsAppIcon className="w-5 h-5 text-white" />
              </div>
            </a>
          </div>
          <p className="text-[#9A8E80] text-xs">&copy; 2026 Daniela Silva. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* ═══ RESULT MODAL ═══ */}
      <AnimatePresence>{result && <AuditResultModal result={result} onClose={() => setResult(null)} />}</AnimatePresence>
    </div>
  );
}
