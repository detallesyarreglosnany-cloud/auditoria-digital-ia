import ZAI from 'z-ai-web-dev-sdk';

export interface AuditInput {
  name: string;
  email: string;
  whatsapp?: string;
  website?: string;
  socialLink?: string;
  businessType?: string;
  followers?: string;
  monthlyRevenue?: string;
  revenueGoal?: string;
  usesAutomation: boolean;
  frustration?: string;
  auditType: 'free' | 'complete';
  referralCode?: string;
  serviceMinPrice?: string;
  serviceMaxPrice?: string;
}

export interface AuditResult {
  scoreGeneral: number;
  scoreVentas: number;
  scorePresencia: number;
  scoreAutomatizacion: number;
  scoreExperiencia: number;
  scoreRetencion: number;
  problems: Array<{
    title: string;
    description: string;
    impactPercent: number;
    solution: string;
    steps: string[];
    timeEstimate: string;
  }>;
  adBudget: {
    serviceAverage: string;
    dailyBudgetPercent: string;
    dailyBudgetCalc: string;
    campaignSet1: { objective: string; budget: string; adsCount: string; audience: string };
    campaignSet2: { objective: string; budget: string; adsCount: string; audience: string };
  };
  planAction: {
    semana1: string[];
    semana2: string[];
    semana3: string[];
    semana4: string[];
  };
  fullReport: string;
}

export async function generateAudit(input: AuditInput): Promise<AuditResult> {
  const zai = await ZAI.create();

  // Calculate ad budget from service prices
  const minPrice = parseFloat(input.serviceMinPrice || '50');
  const maxPrice = parseFloat(input.serviceMaxPrice || '200');
  const avgPrice = (minPrice + maxPrice) / 2;
  const dailyBudget20 = avgPrice * 0.20;
  const campaignBudget = dailyBudget20 / 2;

  const prompt = `Eres un auditor digital experto especializado en negocios hispanos. Analiza este negocio y genera un reporte de auditoría.

DATOS DEL CLIENTE:
- Nombre: ${input.name}
- Negocio: ${input.businessType || 'No especificado'}
- Sitio web: ${input.website || 'No proporcionado'}
- Red social: ${input.socialLink || 'No proporcionada'}
- Seguidores en redes: ${input.followers || 'No especificado'}
- Facturación mensual: ${input.monthlyRevenue || 'No especificada'}
- Meta de facturación: ${input.revenueGoal || 'No especificada'}
- Usa automatización: ${input.usesAutomation ? 'Sí' : 'No'}
- Frustración principal: ${input.frustration || 'No especificada'}
- Rango de precios de servicios: $${minPrice} - $${maxPrice}
- Promedio de servicios: $${avgPrice.toFixed(0)}
- Presupuesto diario de ads (20% del promedio): $${dailyBudget20.toFixed(2)}
- Presupuesto por conjunto de campaña: $${campaignBudget.toFixed(2)}

INSTRUCCIONES:
1. Calcula un SCORE general del 1 al 100 basándote en los datos proporcionados
2. Calcula scores individuales para: Ventas & Conversión, Presencia Digital, Automatización, Experiencia de Compra, Retención de Clientes (todos del 1 al 100)
3. Identifica exactamente 3 problemas críticos
4. Para cada problema: da un título claro, descripción detallada de POR QUÉ afecta, impacto en porcentaje (no en dólares), solución paso a paso con AL MENOS 3-4 pasos detallados, y tiempo estimado de implementación
5. Calcula presupuesto publicitario usando esta fórmula: Promedio = (servicio más caro + más barato) / 2, Presupuesto diario = 20% del promedio, dividido en 2 conjuntos con 4-5 anuncios cada uno
6. NUNCA menciones montos en dólares en los porcentajes de mejora. Solo porcentajes.
7. Genera un plan de acción de 4 semanas con AL MENOS 2 pasos por semana
8. Para el presupuesto publicitario, USA los valores calculados arriba: diario $${dailyBudget20.toFixed(2)}, por conjunto $${campaignBudget.toFixed(2)}

IMPORTANTE: Los porcentajes de impacto deben ser conservadores y realistas. No exageres.

Responde EXACTAMENTE en este formato JSON (sin markdown, sin backticks, solo JSON puro):
{
  "scoreGeneral": <número 1-100>,
  "scoreVentas": <número 1-100>,
  "scorePresencia": <número 1-100>,
  "scoreAutomatizacion": <número 1-100>,
  "scoreExperiencia": <número 1-100>,
  "scoreRetencion": <número 1-100>,
  "problems": [
    {
      "title": "Título del problema",
      "description": "Descripción detallada de por qué esto afecta al negocio",
      "impactPercent": <número, porcentaje de mejora potencial>,
      "solution": "Descripción de la solución",
      "steps": ["Paso 1 detallado", "Paso 2 detallado", "Paso 3 detallado"],
      "timeEstimate": "Tiempo estimado"
    }
  ],
  "adBudget": {
    "serviceAverage": "$${avgPrice.toFixed(0)}",
    "dailyBudgetPercent": "20% diario del promedio de servicios ($${dailyBudget20.toFixed(2)}/día)",
    "dailyBudgetCalc": "Cálculo: ($${maxPrice} + $${minPrice}) / 2 = $${avgPrice.toFixed(0)} promedio → 20% = $${dailyBudget20.toFixed(2)}/día",
    "campaignSet1": {
      "objective": "Objetivo de la campaña",
      "budget": "$${campaignBudget.toFixed(2)}/día",
      "adsCount": "4-5 anuncios",
      "audience": "Descripción de la audiencia"
    },
    "campaignSet2": {
      "objective": "Objetivo de la campaña",
      "budget": "$${campaignBudget.toFixed(2)}/día",
      "adsCount": "4-5 anuncios",
      "audience": "Descripción de la audiencia"
    }
  },
  "planAction": {
    "semana1": ["Paso 1", "Paso 2"],
    "semana2": ["Paso 1", "Paso 2"],
    "semana3": ["Paso 1", "Paso 2"],
    "semana4": ["Paso 1", "Paso 2"]
  },
  "fullReport": "Reporte completo en markdown con todo el análisis"
}`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Eres un consultor digital experto. Respondes SOLO en JSON válido, sin texto adicional, sin markdown, sin backticks. Solo el objeto JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content || '';
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    const parsed = JSON.parse(cleanedContent);

    return {
      scoreGeneral: parsed.scoreGeneral || 30,
      scoreVentas: parsed.scoreVentas || 20,
      scorePresencia: parsed.scorePresencia || 30,
      scoreAutomatizacion: parsed.scoreAutomatizacion || 10,
      scoreExperiencia: parsed.scoreExperiencia || 25,
      scoreRetencion: parsed.scoreRetencion || 35,
      problems: parsed.problems || [],
      adBudget: parsed.adBudget || {
        serviceAverage: `$${avgPrice.toFixed(0)}`,
        dailyBudgetPercent: `20% diario del promedio ($${dailyBudget20.toFixed(2)}/día)`,
        dailyBudgetCalc: `($${maxPrice} + $${minPrice}) / 2 = $${avgPrice.toFixed(0)} → 20% = $${dailyBudget20.toFixed(2)}/día`,
        campaignSet1: { objective: 'Alcance + Interés', budget: `$${campaignBudget.toFixed(2)}/día`, adsCount: '4-5 anuncios', audience: 'Público según tipo de negocio' },
        campaignSet2: { objective: 'Retargeting + Conversión', budget: `$${campaignBudget.toFixed(2)}/día`, adsCount: '4-5 anuncios', audience: 'Visitantes que no compraron' }
      },
      planAction: parsed.planAction || {
        semana1: ['Implementar primera solución', 'Verificar cambios'],
        semana2: ['Implementar segunda solución', 'Ajustar según resultados'],
        semana3: ['Implementar tercera solución', 'Monitorear métricas'],
        semana4: ['Lanzar campañas publicitarias', 'Medir y optimizar']
      },
      fullReport: parsed.fullReport || ''
    };
  } catch (error) {
    console.error('Error generating audit:', error);
    return {
      scoreGeneral: 30,
      scoreVentas: 20,
      scorePresencia: 30,
      scoreAutomatizacion: 10,
      scoreExperiencia: 25,
      scoreRetencion: 35,
      problems: [
        {
          title: 'Falta de página de ventas optimizada',
          description: 'Sin una página de ventas enfocada, tus visitantes no tienen una ruta clara hacia la compra.',
          impactPercent: 70,
          solution: 'Crear una landing page con oferta clara y botones de acción visibles',
          steps: ['Definir una oferta clara y específica para tu producto estrella', 'Diseñar la página con un solo objetivo: que el visitante compre o deje su dato', 'Agregar llamados a la acción visibles y un formulario simple', 'Incluir testimonios y prueba social cerca del botón de compra'],
          timeEstimate: '4-6 horas'
        },
        {
          title: 'Sin automatización de atención al cliente',
          description: 'Tus clientes potenciales tienen dudas y nadie les responde al instante, por lo que se van.',
          impactPercent: 40,
          solution: 'Implementar un bot de WhatsApp que responda las preguntas más frecuentes',
          steps: ['Identificar las 10 preguntas más frecuentes de tus clientes', 'Configurar respuestas automáticas inteligentes con IA', 'Conectar con WhatsApp Business y tu catálogo', 'Probar el flujo con clientes reales y ajustar'],
          timeEstimate: '3-4 horas'
        },
        {
          title: 'Sin inversión publicitaria estratégica',
          description: 'Sin tráfico pagado, dependes 100% del orgánico que es limitado e impredecible.',
          impactPercent: 50,
          solution: 'Lanzar campañas personalizadas con presupuesto basado en tus servicios',
          steps: ['Calcular presupuesto: 20% diario del promedio de tus servicios', 'Crear primer conjunto: 4-5 anuncios de alcance a nuevo público', 'Crear segundo conjunto: 4-5 anuncios de retargeting a visitantes', 'Monitorear resultados diariamente los primeros 7 días'],
          timeEstimate: '2-3 horas'
        }
      ],
      adBudget: {
        serviceAverage: `$${avgPrice.toFixed(0)}`,
        dailyBudgetPercent: `20% diario del promedio ($${dailyBudget20.toFixed(2)}/día)`,
        dailyBudgetCalc: `($${maxPrice} + $${minPrice}) / 2 = $${avgPrice.toFixed(0)} → 20% = $${dailyBudget20.toFixed(2)}/día`,
        campaignSet1: { objective: 'Alcance + Interés', budget: `$${campaignBudget.toFixed(2)}/día`, adsCount: '4-5 anuncios', audience: 'Público según tipo de negocio' },
        campaignSet2: { objective: 'Retargeting + Conversión', budget: `$${campaignBudget.toFixed(2)}/día`, adsCount: '4-5 anuncios', audience: 'Visitantes que no compraron' }
      },
      planAction: {
        semana1: ['Crear página de ventas con oferta clara', 'Configurar botón de compra y formulario'],
        semana2: ['Instalar bot de WhatsApp con respuestas automáticas', 'Configurar preguntas frecuentes preprogramadas'],
        semana3: ['Lanzar campañas publicitarias personalizadas', 'Crear 4-5 anuncios de alcance por conjunto'],
        semana4: ['Activar retargeting para visitantes que no compraron', 'Medir resultados y optimizar presupuestos']
      },
      fullReport: 'Reporte generado con análisis básico.'
    };
  }
}

export function generateFreeReportEmail(result: AuditResult, name: string): string {
  return `📊 AUDITORÍA EXPRESS — ${name}

TU SCORE: ${result.scoreGeneral}/100

🚨 TUS 3 PROBLEMAS CRÍTICOS:

${result.problems.map((p, i) => `${i + 1}. ${p.title} (Impacto: hasta ${p.impactPercent}% de mejora potencial)`).join('\n')}

💡 ¿Quieres saber exactamente cómo solucionar cada uno?
¿Cuánto podría mejorar tu eficiencia con cada cambio?

👉 Auditoría Completa: Solo $9.99
👉 O adquiere un paquete HOY y tu auditoría es GRATIS

🔗 Obtén tu auditoría completa ahora

---
Daniela Silva, Estratega Digital — Transformamos negocios tradicionales en máquinas de facturación digital`;
}

export function generateCompleteReportMarkdown(result: AuditResult, name: string): string {
  const getEmoji = (score: number) => score >= 70 ? '🟢' : score >= 40 ? '🟡' : '🔴';

  return `# 📊 AUDITORÍA DIGITAL COMPLETA
## ${name}

---

**SCORE GENERAL: ${result.scoreGeneral}/100** ${getEmoji(result.scoreGeneral)}

### DESGLOSE POR ÁREA:

| Área | Score | Estado |
|------|-------|--------|
| Ventas & Conversión | ${result.scoreVentas}/100 | ${getEmoji(result.scoreVentas)} |
| Presencia Digital | ${result.scorePresencia}/100 | ${getEmoji(result.scorePresencia)} |
| Automatización | ${result.scoreAutomatizacion}/100 | ${getEmoji(result.scoreAutomatizacion)} |
| Experiencia de Compra | ${result.scoreExperiencia}/100 | ${getEmoji(result.scoreExperiencia)} |
| Retención de Clientes | ${result.scoreRetencion}/100 | ${getEmoji(result.scoreRetencion)} |

---

## 🚨 PROBLEMAS CRÍTICOS DETECTADOS

${result.problems.map((p, i) => `### ${i + 1}. ${p.title}

**¿Por qué afecta tu negocio?**
${p.description}

**Mejora potencial: hasta ${p.impactPercent}%**

**Solución:**
${p.solution}

**Pasos de implementación:**
${p.steps.map((s, j) => `${j + 1}. ${s}`).join('\n')}

**Tiempo estimado:** ${p.timeEstimate}

---`).join('\n')}

## 📢 CAMPAÑAS PERSONALIZADAS & PRESUPUESTO

**Promedio de tus servicios:** ${result.adBudget.serviceAverage}
**Presupuesto diario recomendado:** ${result.adBudget.dailyBudgetPercent}
**Cálculo:** ${result.adBudget.dailyBudgetCalc}

### Conjunto de Campaña 1:
- **Objetivo:** ${result.adBudget.campaignSet1.objective}
- **Presupuesto:** ${result.adBudget.campaignSet1.budget}
- **Anuncios:** ${result.adBudget.campaignSet1.adsCount}
- **Audiencia:** ${result.adBudget.campaignSet1.audience}

### Conjunto de Campaña 2:
- **Objetivo:** ${result.adBudget.campaignSet2.objective}
- **Presupuesto:** ${result.adBudget.campaignSet2.budget}
- **Anuncios:** ${result.adBudget.campaignSet2.adsCount}
- **Audiencia:** ${result.adBudget.campaignSet2.audience}

⚠️ **IMPORTANTE:** Sin tráfico no hay ventas. Sin publicidad no hay tráfico. Tu negocio optimizado convierte mejor, pero necesita visitantes para funcionar.

---

## 📋 TU PLAN DE ACCIÓN — 4 SEMANAS

**Semana 1:**
${result.planAction.semana1.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**Semana 2:**
${result.planAction.semana2.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**Semana 3:**
${result.planAction.semana3.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**Semana 4:**
${result.planAction.semana4.map((s, i) => `${i + 1}. ${s}`).join('\n')}

---

## 🎯 ¿QUIERES QUE LO IMPLEMENTEMOS POR TI?

| Plan | Precio | Incluye |
|------|--------|---------|
| 🟢 **Impulso** | $197 USD | Página de ventas + Bot básico + 30 días soporte |
| 🟡 **Crecimiento** ⭐ | $497 USD | Todo lo anterior + Marketplace + Email + 2 sesiones estratégicas |
| 🔴 **Dominio** | $997 USD | Ecosistema completo con IA + Mentoría 14 semanas |

💬 Agenda tu llamada GRATIS: wa.me/584221754245

---

*⚠️ Descargo de responsabilidad: Esta auditoría es un diagnóstico orientativo basado en los datos proporcionados. Los porcentajes de mejora son estimaciones de potencial, no garantías de resultados. Los resultados dependen de la implementación de las soluciones y la inversión publicitaria.*

*Daniela Silva, Estratega Digital*`;
}
