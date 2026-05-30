import ZAI from 'z-ai-web-dev-sdk';

export interface AuditInput {
  name: string;
  email: string;
  whatsapp?: string;
  website?: string;
  businessType?: string;
  followers?: string;
  monthlyRevenue?: string;
  revenueGoal?: string;
  usesAutomation: boolean;
  frustration?: string;
  auditType: 'free' | 'complete';
  referralCode?: string;
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
    dailyBudget: string;
    campaignSet1: { objective: string; budget: string; audience: string };
    campaignSet2: { objective: string; budget: string; audience: string };
  };
  fullReport: string;
}

export async function generateAudit(input: AuditInput): Promise<AuditResult> {
  const zai = await ZAI.create();

  const prompt = `Eres un auditor digital experto especializado en negocios hispanos. Analiza este negocio y genera un reporte de auditoría.

DATOS DEL CLIENTE:
- Nombre: ${input.name}
- Negocio: ${input.businessType || 'No especificado'}
- Sitio web: ${input.website || 'No proporcionado'}
- Seguidores en redes: ${input.followers || 'No especificado'}
- Facturación mensual: ${input.monthlyRevenue || 'No especificada'}
- Meta de facturación: ${input.revenueGoal || 'No especificada'}
- Usa automatización: ${input.usesAutomation ? 'Sí' : 'No'}
- Frustración principal: ${input.frustration || 'No especificada'}

INSTRUCCIONES:
1. Calcula un SCORE general del 1 al 100 basándote en los datos proporcionados
2. Calcula scores individuales para: Ventas & Conversión, Presencia Digital, Automatización, Experiencia de Compra, Retención de Clientes (todos del 1 al 100)
3. Identifica exactamente 3 problemas críticos
4. Para cada problema: da un título claro, descripción detallada de POR QUÉ afecta, impacto en porcentaje (no en dólares), solución paso a paso con pasos numerados, y tiempo estimado de implementación
5. Calcula presupuesto publicitario recomendado basándote en un producto promedio del tipo de negocio
6. NUNCA menciones montos en dólares. Solo porcentajes de mejora potencial.

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
      "steps": ["Paso 1", "Paso 2", "Paso 3"],
      "timeEstimate": "Tiempo estimado"
    }
  ],
  "adBudget": {
    "dailyBudget": "Rango de inversión diaria recomendada",
    "campaignSet1": {
      "objective": "Objetivo de la campaña",
      "budget": "Presupuesto diario para este conjunto",
      "audience": "Descripción de la audiencia"
    },
    "campaignSet2": {
      "objective": "Objetivo de la campaña",
      "budget": "Presupuesto diario para este conjunto",
      "audience": "Descripción de la audiencia"
    }
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
    
    // Clean the response - remove any markdown formatting
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
        dailyBudget: 'No especificado',
        campaignSet1: { objective: 'Alcance', budget: 'No especificado', audience: 'No especificada' },
        campaignSet2: { objective: 'Retargeting', budget: 'No especificado', audience: 'No especificada' }
      },
      fullReport: parsed.fullReport || ''
    };
  } catch (error) {
    console.error('Error generating audit:', error);
    // Return a fallback result
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
          steps: ['Definir una oferta clara', 'Diseñar la página con un solo objetivo', 'Agregar llamados a la acción visibles'],
          timeEstimate: '4-6 horas'
        },
        {
          title: 'Sin automatización de atención al cliente',
          description: 'Tus clientes potenciales tienen dudas y nadie les responde al instante, por lo que se van.',
          impactPercent: 40,
          solution: 'Implementar un bot de WhatsApp que responda las preguntas más frecuentes',
          steps: ['Identificar las 10 preguntas más frecuentes', 'Configurar respuestas automáticas', 'Conectar con WhatsApp Business'],
          timeEstimate: '3-4 horas'
        },
        {
          title: 'Sin inversión publicitaria estratégica',
          description: 'Sin tráfico pagado, dependes 100% del orgánico que es limitado e impredecible.',
          impactPercent: 50,
          solution: 'Lanzar campañas en Meta con 2 conjuntos: alcance y retargeting',
          steps: ['Definir presupuesto diario según precio del producto', 'Crear conjunto de campaña de alcance', 'Crear conjunto de retargeting para visitantes'],
          timeEstimate: '2-3 horas'
        }
      ],
      adBudget: {
        dailyBudget: '10-15 USD/día',
        campaignSet1: { objective: 'Alcance + Interés', budget: '6-8 USD/día', audience: 'Público según tipo de negocio' },
        campaignSet2: { objective: 'Retargeting + Conversión', budget: '4-7 USD/día', audience: 'Visitantes que no compraron en 7 días' }
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
LLAVE DIGITAL 3.0 — Transformamos negocios tradicionales en máquinas de facturación digital`;
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

## 📢 ANÁLISIS DE PUBLICIDAD & TRÁFICO

**Inversión diaria recomendada:** ${result.adBudget.dailyBudget}

### Conjunto de Campaña 1:
- **Objetivo:** ${result.adBudget.campaignSet1.objective}
- **Presupuesto:** ${result.adBudget.campaignSet1.budget}
- **Audiencia:** ${result.adBudget.campaignSet1.audience}

### Conjunto de Campaña 2:
- **Objetivo:** ${result.adBudget.campaignSet2.objective}
- **Presupuesto:** ${result.adBudget.campaignSet2.budget}
- **Audiencia:** ${result.adBudget.campaignSet2.audience}

⚠️ **IMPORTANTE:** Sin tráfico no hay ventas. Sin publicidad no hay tráfico. Tu negocio optimizado convierte mejor, pero necesita visitantes para funcionar.

---

## 📋 TU PLAN DE ACCIÓN — 4 SEMANAS

- **Semana 1:** ${result.problems[0]?.solution || 'Implementar primera solución'}
- **Semana 2:** ${result.problems[1]?.solution || 'Implementar segunda solución'}
- **Semana 3:** ${result.problems[2]?.solution || 'Implementar tercera solución'}
- **Semana 4:** Lanzar campañas publicitarias + medir resultados

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

*Powered by LLAVE DIGITAL 3.0*`;
}
