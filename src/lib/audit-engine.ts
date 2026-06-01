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
    area: string; // Which area this problem belongs to
    severity: 'critical' | 'important' | 'opportunity'; // Severity level
    beforeScenario: string; // Current situation
    afterScenario: string; // What happens when fixed
  }>;
  adBudget: {
    serviceAverage: string;
    dailyBudgetPercent: string;
    dailyBudgetCalc: string;
    campaignSet1: { objective: string; budget: string; adsCount: string; audience: string; strategy: string };
    campaignSet2: { objective: string; budget: string; adsCount: string; audience: string; strategy: string };
  };
  planAction: {
    semana1: string[];
    semana2: string[];
    semana3: string[];
    semana4: string[];
  };
  // New: Benefit-oriented answers (the 6 questions)
  moneyLeak: string;       // Reporte de tu mayor fuga de dinero
  socialStrategy: string;  // Estrategias generales para vender mas con RRSS
  goalWithoutSpending: string; // Como alcanzar mi meta de venta sin gastar mas
  whyInvest: string;       // Porque deberia invertir en servicios profesionales
  costOfInaction: string;  // Que pasa si no aplico nada
  digital2026: string;     // Por que es mas rentable un negocio con presencia digital 2026
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

  const prompt = `Eres Daniela Silva, una estratega digital con 8+ años de experiencia que ha transformado cientos de negocios hispanos. Estás analizando el negocio de ${input.name} para darle un diagnóstico REAL, personalizado y accionable — no un reporte genérico.

DATOS DEL NEGOCIO DE ${input.name.toUpperCase()}:
- Nombre: ${input.name}
- Tipo de negocio: ${input.businessType || 'No especificado — infiere según los datos'}
- Sitio web: ${input.website || 'NO tiene — esto es un problema grave'}
- Red social: ${input.socialLink || 'NO proporcionó — evalúa lo que implica'}
- Seguidores: ${input.followers || 'No especificado'}
- Facturación mensual: ${input.monthlyRevenue || 'No especificada'}
- Meta de facturación: ${input.revenueGoal || 'No especificada'}
- Usa automatización/bots: ${input.usesAutomation ? 'Sí' : 'No — está perdiendo clientes por no responder rápido'}
- Frustración principal: ${input.frustration || 'No especificada — pero deduce cuál es la más probable según sus datos'}
- Rango de precios: $${minPrice} - $${maxPrice}
- Presupuesto diario ads (20% del promedio): $${dailyBudget20.toFixed(2)}

REGLAS CRÍTICAS:
1. NUNCA uses frases genéricas como "Es importante optimizar" o "Se recomienda mejorar". Sé ESPECÍFICO para el tipo de negocio de ${input.name}.
2. Cada problema debe mencionar el nombre de ${input.name} o su tipo de negocio. Habla DIRECTAMENTE a su situación.
3. Los escenarios "antes" y "después" deben ser CONCRETOS y visualizables — no abstractos.
4. Las soluciones deben ser paso a paso, como si ${input.name} fuera a hacerlo HOY.
5. Si no tiene sitio web, eso es PROBLEMA #1. Si no tiene automatización, es PROBLEMA #2.
6. Los porcentajes de mejora deben ser conservadores y realistas (15-65%).
7. Las 6 respuestas de beneficio deben ser persuasivas pero honestas — sin exagerar.

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
      "title": "Título específico para el negocio de ${input.name}",
      "description": "Por qué esto afecta ESPECÍFICAMENTE a ${input.name} y su negocio de ${input.businessType || 'su tipo de negocio'}. Menciona datos concretos de su situación.",
      "impactPercent": <número realista 15-65>,
      "solution": "Solución específica y accionable para su caso",
      "steps": ["Paso 1 detallado y específico", "Paso 2 detallado y específico", "Paso 3 detallado y específico", "Paso 4 si aplica"],
      "timeEstimate": "Tiempo realista",
      "area": "ventas|presencia|automatizacion|experiencia|retencion",
      "severity": "critical|important|opportunity",
      "beforeScenario": "Escenario actual: describe cómo está HOY ${input.name} con este problema. Sé visual y concreto.",
      "afterScenario": "Escenario resuelto: describe cómo estará ${input.name} después de solucionarlo. Sé visual y concreto."
    }
  ],
  "adBudget": {
    "serviceAverage": "$${avgPrice.toFixed(0)}",
    "dailyBudgetPercent": "20% diario del promedio ($${dailyBudget20.toFixed(2)}/día)",
    "dailyBudgetCalc": "($${maxPrice} + $${minPrice}) / 2 = $${avgPrice.toFixed(0)} → 20% = $${dailyBudget20.toFixed(2)}/día",
    "campaignSet1": {
      "objective": "Objetivo específico para ${input.businessType || 'este negocio'}",
      "budget": "$${campaignBudget.toFixed(2)}/día",
      "adsCount": "4-5 anuncios",
      "audience": "Audiencia específica para ${input.businessType || 'su nicho'}",
      "strategy": "Estrategia concreta de qué tipo de contenido funcionará para su nicho"
    },
    "campaignSet2": {
      "objective": "Objetivo de retargeting específico",
      "budget": "$${campaignBudget.toFixed(2)}/día",
      "adsCount": "4-5 anuncios",
      "audience": "Audiencia de retargeting específica",
      "strategy": "Estrategia concreta de remarketing para su tipo de cliente"
    }
  },
  "planAction": {
    "semana1": ["2-3 acciones específicas para ${input.name}"],
    "semana2": ["2-3 acciones específicas"],
    "semana3": ["2-3 acciones específicas"],
    "semana4": ["2-3 acciones específicas"]
  },
  "moneyLeak": "Respuesta directa y específica: dónde se le escapa el dinero a ${input.name}, cuánto aproximadamente pierde al mes, y por qué. 3-4 oraciones concretas.",
  "socialStrategy": "Respuesta directa: 2-3 tácticas específicas de redes sociales para ${input.businessType || 'su negocio'} que convierten seguidores en clientes. No genérico.",
  "goalWithoutSpending": "Respuesta directa: cómo ${input.name} puede acercarse a su meta de $${input.revenueGoal || 'su meta'} sin invertir más dinero. Estrategias con lo que YA tiene.",
  "whyInvest": "Respuesta directa: por qué ${input.name} specifically se beneficiaría de invertir en servicios profesionales de Daniela. Datos de su negocio que lo justifican.",
  "costOfInaction": "Respuesta directa: qué pierde ${input.name} mes a mes si no cambia nada. Sé específico con su tipo de negocio y situación.",
  "digital2026": "Respuesta directa: por qué en 2026 un negocio como el de ${input.name} necesita presencia digital optimizada. Datos del mercado relevantes para su nicho.",
  "fullReport": "Reporte completo en markdown con todo el análisis personalizado"
}`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Eres Daniela Silva, estratega digital con 8+ años de experiencia transformando negocios hispanos. Tu tono es directo, profesional pero cercano. Hablas como una consultora que YA vio este problema 100 veces y sabe exactamente qué hacer. NUNCA suenes robótico o genérico. Siempre personaliza cada respuesta al negocio específico. Respondes SOLO en JSON válido, sin texto adicional, sin markdown, sin backticks. Solo el objeto JSON.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.75,
      max_tokens: 5000,
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
      problems: (parsed.problems || []).map((p: any) => ({
        title: p.title || 'Problema detectado',
        description: p.description || '',
        impactPercent: p.impactPercent || 20,
        solution: p.solution || '',
        steps: p.steps || [],
        timeEstimate: p.timeEstimate || '1-2 semanas',
        area: p.area || 'ventas',
        severity: p.severity || 'important',
        beforeScenario: p.beforeScenario || 'Situación actual sin resolver',
        afterScenario: p.afterScenario || 'Situación mejorada tras implementar la solución',
      })),
      adBudget: parsed.adBudget || {
        serviceAverage: `$${avgPrice.toFixed(0)}`,
        dailyBudgetPercent: `20% diario del promedio ($${dailyBudget20.toFixed(2)}/día)`,
        dailyBudgetCalc: `($${maxPrice} + $${minPrice}) / 2 = $${avgPrice.toFixed(0)} → 20% = $${dailyBudget20.toFixed(2)}/día`,
        campaignSet1: { objective: 'Alcance + Interés', budget: `$${campaignBudget.toFixed(2)}/día`, adsCount: '4-5 anuncios', audience: `Público interesado en ${input.businessType || 'tu servicio'}`, strategy: 'Contenido que muestra resultados reales de tu servicio' },
        campaignSet2: { objective: 'Retargeting + Conversión', budget: `$${campaignBudget.toFixed(2)}/día`, adsCount: '4-5 anuncios', audience: 'Visitantes que no compraron', strategy: 'Testimonios y ofertas especiales para quienes ya te conocen' }
      },
      planAction: parsed.planAction || {
        semana1: ['Implementar primera solución crítica', 'Verificar cambios iniciales'],
        semana2: ['Implementar segunda solución', 'Ajustar según resultados'],
        semana3: ['Implementar tercera solución', 'Monitorear métricas'],
        semana4: ['Lanzar campañas publicitarias', 'Medir y optimizar']
      },
      moneyLeak: parsed.moneyLeak || `Tu mayor fuga de dinero está en la falta de un sistema de conversión optimizado. Cada visitante que llega y no compra es dinero que se te escapa diariamente.`,
      socialStrategy: parsed.socialStrategy || `Para tu tipo de negocio, enfócate en contenido que muestre resultados reales y transforma seguidores en clientes con llamados a la acción claros.`,
      goalWithoutSpending: parsed.goalWithoutSpending || `Optimizando lo que ya tienes — mejorando tu perfil, tus respuestas automáticas y tu propuesta de valor — puedes incrementar conversiones sin gastar más.`,
      whyInvest: parsed.whyInvest || `La diferencia entre improvisar y tener una estrategia profesional se mide en facturación: los negocios con estrategia digital profesional convierten hasta 3x más.`,
      costOfInaction: parsed.costOfInaction || `Cada mes sin optimizar tu presencia digital sigues perdiendo clientes potenciales que sí encuentran a tu competencia.`,
      digital2026: parsed.digital2026 || `En 2026, un negocio sin presencia digital optimizada depende 100% del boca a boca, que es lento e impredecible. Los negocios con presencia digital activa generan hasta 3x más que los que solo dependen de referidos.`,
      fullReport: parsed.fullReport || 'Reporte generado con análisis personalizado.'
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
          title: `Falta de página de ventas para ${input.name}`,
          description: `Sin una página de ventas optimizada, ${input.name} está perdiendo cada visitante que llega interesado pero no encuentra una ruta clara hacia la compra. En un negocio de ${input.businessType || 'su tipo'}, esto significa que por cada 10 personas interesadas, solo 1 o 2 terminan comprando.`,
          impactPercent: 65,
          solution: 'Crear una landing page con oferta clara y botones de acción visibles específicos para tu servicio',
          steps: ['Definir tu oferta más atractiva y ponerla como protagonista de la página', 'Diseñar la página con un solo objetivo: que el visitante compre o deje su dato', 'Agregar llamados a la acción visibles y un formulario simple de contacto', 'Incluir testimonios y prueba social cerca del botón de compra'],
          timeEstimate: '4-6 horas',
          area: 'ventas',
          severity: 'critical',
          beforeScenario: `${input.name} comparte links genéricos o perfiles sociales. Los interesados navegan sin dirección y se van sin comprar. Sin página de ventas, no hay embudo ni conversión medible.`,
          afterScenario: `${input.name} tiene una página que guía al visitante paso a paso: ve la oferta, entiende el valor, ve testimonios y tiene un botón claro para comprar o contactar. Las conversiones aumentan visiblemente.`
        },
        {
          title: `Sin automatización de atención para ${input.name}`,
          description: `Cuando un cliente potencial de ${input.name} tiene una duda a las 11pm, nadie responde. Para las 9am cuando podrías responder, ya encontró a alguien más. Sin un bot, pierdes hasta el 40% de clientes potenciales que llegan fuera de horario.`,
          impactPercent: 40,
          solution: 'Implementar un bot de WhatsApp que responda las preguntas más frecuentes automáticamente',
          steps: ['Identificar las 10 preguntas más frecuentes de tus clientes', 'Configurar respuestas automáticas inteligentes con IA', 'Conectar con WhatsApp Business y tu catálogo', 'Probar el flujo con clientes reales y ajustar'],
          timeEstimate: '3-4 horas',
          area: 'automatizacion',
          severity: 'critical',
          beforeScenario: `${input.name} pierde clientes que escriben fuera de horario. Responde manualmente cuando puede, pero muchos ya se fueron con la competencia.`,
          afterScenario: `${input.name} tiene un bot que responde 24/7, califica al lead y agenda la venta. Nunca más pierde un cliente por no responder a tiempo.`
        },
        {
          title: `Sin inversión publicitaria estratégica para ${input.name}`,
          description: `${input.name} depende 100% del tráfico orgánico, que es limitado e impredecible. Sin inversión en anuncios, el negocio crece lento y de forma inconsistente. Cada día sin publicidad es un día que tu competencia le habla a tus clientes potenciales.`,
          impactPercent: 50,
          solution: 'Lanzar campañas personalizadas con presupuesto basado en tus servicios',
          steps: [`Calcular presupuesto: 20% diario del promedio de tus servicios = $${dailyBudget20.toFixed(2)}/día`, 'Crear primer conjunto: 4-5 anuncios de alcance a nuevo público', 'Crear segundo conjunto: 4-5 anuncios de retargeting a visitantes', 'Monitorear resultados diariamente los primeros 7 días'],
          timeEstimate: '2-3 horas',
          area: 'presencia',
          severity: 'important',
          beforeScenario: `${input.name} espera que los clientes lleguen solos. El crecimiento depende de referidos y suerte — impredecible y lento.`,
          afterScenario: `${input.name} tiene tráfico constante y medible. Cada dólar invertido trae visitantes que el embudo convierte. El crecimiento es predecible y escalable.`
        }
      ],
      adBudget: {
        serviceAverage: `$${avgPrice.toFixed(0)}`,
        dailyBudgetPercent: `20% diario del promedio ($${dailyBudget20.toFixed(2)}/día)`,
        dailyBudgetCalc: `($${maxPrice} + $${minPrice}) / 2 = $${avgPrice.toFixed(0)} → 20% = $${dailyBudget20.toFixed(2)}/día`,
        campaignSet1: { objective: 'Alcance + Interés', budget: `$${campaignBudget.toFixed(2)}/día`, adsCount: '4-5 anuncios', audience: `Público interesado en ${input.businessType || 'tu servicio'}`, strategy: 'Contenido que muestra resultados reales de tu servicio' },
        campaignSet2: { objective: 'Retargeting + Conversión', budget: `$${campaignBudget.toFixed(2)}/día`, adsCount: '4-5 anuncios', audience: 'Visitantes que no compraron', strategy: 'Testimonios y ofertas especiales para quienes ya te conocen' }
      },
      planAction: {
        semana1: ['Crear página de ventas con oferta clara', 'Configurar botón de compra y formulario'],
        semana2: ['Instalar bot de WhatsApp con respuestas automáticas', 'Configurar preguntas frecuentes preprogramadas'],
        semana3: ['Lanzar campañas publicitarias personalizadas', 'Crear 4-5 anuncios de alcance por conjunto'],
        semana4: ['Activar retargeting para visitantes que no compraron', 'Medir resultados y optimizar presupuestos']
      },
      moneyLeak: `Tu mayor fuga de dinero está en la falta de un sistema de conversión. Cada persona que te encuentra y no compra es un cliente que se va con la competencia. Sin página de ventas ni automatización, pierdes hasta el 65% de oportunidades que ya llegaron a tu puerta.`,
      socialStrategy: `Para tu negocio, enfócate en contenido que muestre resultados reales: antes/después, testimonios en video, y casos de éxito. Usa historias de Instagram con encuestas y stickers para generar interacción. Cada post debe tener un llamado a la acción que dirija a tu página de ventas.`,
      goalWithoutSpending: `Optimizando lo que ya tienes puedes acercarte a tu meta: mejora tu perfil de Instagram como carta de venta, implementa respuestas rápidas en WhatsApp, y crea una propuesta de valor irresistible que comparta en cada interacción. Sin gastar más, puedes duplicar tu conversión.`,
      whyInvest: `Porque la diferencia entre improvisar y tener una estrategia profesional se mide en facturación. Los negocios de ${input.businessType || 'tu tipo'} con presencia digital profesional convierten hasta 3x más. La inversión se paga sola con los primeros clientes nuevos.`,
      costOfInaction: `Si no aplicas nada, seguirás perdiendo clientes que sí encuentran a tu competencia online. Cada mes sin optimizar es un mes de facturación perdida que no recuperas. El costo de la inacción es siempre mayor que la inversión.`,
      digital2026: `En 2026, un negocio sin presencia digital optimizada depende 100% del boca a boca, que es lento e impredecible. Los negocios con presencia digital activa generan hasta 3x más que los que solo dependen de referidos. El mundo ya compra online — si no estás ahí, no existes.`,
      fullReport: 'Reporte generado con análisis personalizado.'
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
  const getLabel = (score: number) => score >= 70 ? 'Fuerte' : score >= 40 ? 'Necesita mejora' : 'Crítico';

  return `# 📊 AUDITORÍA DIGITAL COMPLETA
## ${name}

---

**SCORE GENERAL: ${result.scoreGeneral}/100** ${getEmoji(result.scoreGeneral)}

### DESGLOSE POR ÁREA:

| Área | Score | Estado |
|------|-------|--------|
| Ventas & Conversión | ${result.scoreVentas}/100 | ${getEmoji(result.scoreVentas)} ${getLabel(result.scoreVentas)} |
| Presencia Digital | ${result.scorePresencia}/100 | ${getEmoji(result.scorePresencia)} ${getLabel(result.scorePresencia)} |
| Automatización | ${result.scoreAutomatizacion}/100 | ${getEmoji(result.scoreAutomatizacion)} ${getLabel(result.scoreAutomatizacion)} |
| Experiencia de Compra | ${result.scoreExperiencia}/100 | ${getEmoji(result.scoreExperiencia)} ${getLabel(result.scoreExperiencia)} |
| Retención de Clientes | ${result.scoreRetencion}/100 | ${getEmoji(result.scoreRetencion)} ${getLabel(result.scoreRetencion)} |

---

## 🚨 PROBLEMAS CRÍTICOS DETECTADOS

${result.problems.map((p, i) => `### ${i + 1}. ${p.title}

**Severidad:** ${p.severity === 'critical' ? '🔴 CRÍTICO' : p.severity === 'important' ? '🟡 IMPORTANTE' : '🟢 OPORTUNIDAD'}
**Área:** ${p.area}

**Situación actual:**
${p.beforeScenario}

**¿Por qué afecta tu negocio?**
${p.description}

**Mejora potencial: hasta ${p.impactPercent}%**

**Cuando lo soluciones:**
${p.afterScenario}

**Solución:**
${p.solution}

**Pasos de implementación:**
${p.steps.map((s, j) => `${j + 1}. ${s}`).join('\n')}

**Tiempo estimado:** ${p.timeEstimate}

---`).join('\n')}

## 💰 TU MAYOR FUGA DE DINERO

${result.moneyLeak}

---

## 📱 ESTRATEGIAS PARA VENDER MÁS CON REDES SOCIALES

${result.socialStrategy}

---

## 🎯 CÓMO ALCANZAR TU META SIN GASTAR MÁS

${result.goalWithoutSpending}

---

## 📈 POR QUÉ INVERTIR EN SERVICIOS PROFESIONALES

${result.whyInvest}

---

## ⚠️ QUÉ PASA SI NO APLICAS NADA

${result.costOfInaction}

---

## 🌐 PRESENCIA DIGITAL RENTABLE EN 2026

${result.digital2026}

---

## 📢 CAMPAÑAS PERSONALIZADAS & PRESUPUESTO

**Promedio de tus servicios:** ${result.adBudget.serviceAverage}
**Presupuesto diario recomendado:** ${result.adBudget.dailyBudgetPercent}
**Cálculo:** ${result.adBudget.dailyBudgetCalc}

### Conjunto de Campaña 1:
- **Objetivo:** ${result.adBudget.campaignSet1.objective}
- **Presupuesto:** ${result.adBudget.campaignSet1.budget}
- **Anuncios:** ${result.adBudget.campaignSet1.adsCount}
- **Audiencia:** ${result.adBudget.campaignSet1.audience}
- **Estrategia:** ${result.adBudget.campaignSet1.strategy}

### Conjunto de Campaña 2:
- **Objetivo:** ${result.adBudget.campaignSet2.objective}
- **Presupuesto:** ${result.adBudget.campaignSet2.budget}
- **Anuncios:** ${result.adBudget.campaignSet2.adsCount}
- **Audiencia:** ${result.adBudget.campaignSet2.audience}
- **Estrategia:** ${result.adBudget.campaignSet2.strategy}

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
| 🟡 **Crecimiento** ⭐ | $497 USD | Todo lo anterior + Marketplace + Email + Asesoría semanal |
| 🔴 **Dominio** | ~~$1190~~ $887 USD | Ecosistema completo con IA + Mentoría 14 semanas |

💬 Agenda tu llamada GRATIS: wa.me/584221754245

---

*⚠️ Descargo de responsabilidad: Esta auditoría es un diagnóstico orientativo basado en los datos proporcionados. Los porcentajes de mejora son estimaciones de potencial, no garantías de resultados. Los resultados dependen de la implementación de las soluciones y la inversión publicitaria.*

*Daniela Silva, Estratega Digital*`;
}
