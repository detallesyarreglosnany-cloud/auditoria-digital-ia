import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateAudit, generateFreeReportEmail, generateCompleteReportMarkdown, type AuditInput } from '@/lib/audit-engine';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const auditInput: AuditInput = {
      name: body.name || '',
      email: body.email || '',
      whatsapp: body.whatsapp || '',
      website: body.website || '',
      socialLink: body.socialLink || '',
      businessType: body.businessType || '',
      followers: body.followers || '',
      monthlyRevenue: body.monthlyRevenue || '',
      revenueGoal: body.revenueGoal || '',
      usesAutomation: body.usesAutomation || false,
      frustration: body.frustration || '',
      auditType: body.auditType || 'free',
      referralCode: body.referralCode || undefined,
      serviceMinPrice: body.serviceMinPrice || undefined,
      serviceMaxPrice: body.serviceMaxPrice || undefined,
    };

    if (!auditInput.name || !auditInput.email) {
      return NextResponse.json(
        { error: 'Nombre y email son obligatorios' },
        { status: 400 }
      );
    }

    // Track referral click if code exists
    if (auditInput.referralCode) {
      try {
        await db.referral.update({
          where: { code: auditInput.referralCode },
          data: { clicks: { increment: 1 } }
        });
      } catch {
        // Referral code not found, continue anyway
      }
    }

    // Generate the audit using AI
    const result = await generateAudit(auditInput);

    // Save lead to database
    const lead = await db.lead.create({
      data: {
        name: auditInput.name,
        email: auditInput.email,
        whatsapp: auditInput.whatsapp,
        website: auditInput.website,
        businessType: auditInput.businessType,
        followers: auditInput.followers,
        monthlyRevenue: auditInput.monthlyRevenue,
        revenueGoal: auditInput.revenueGoal,
        usesAutomation: auditInput.usesAutomation,
        frustration: auditInput.frustration,
        auditType: auditInput.auditType,
        score: result.scoreGeneral,
        reportData: JSON.stringify(result),
        referralCode: auditInput.referralCode,
        source: auditInput.referralCode ? 'referral' : 'organic',
      }
    });

    // Save audit result
    await db.auditResult.create({
      data: {
        leadId: lead.id,
        scoreGeneral: result.scoreGeneral,
        scoreVentas: result.scoreVentas,
        scorePresencia: result.scorePresencia,
        scoreAutomatizacion: result.scoreAutomatizacion,
        scoreExperiencia: result.scoreExperiencia,
        scoreRetencion: result.scoreRetencion,
        problems: JSON.stringify(result.problems),
        recommendations: JSON.stringify(result.adBudget),
        adBudget: JSON.stringify(result.adBudget),
        fullReport: result.fullReport,
      }
    });

    // ─── SEND EMAIL ───
    let emailSent = false;
    try {
      if (resend && process.env.RESEND_API_KEY) {
        if (auditInput.auditType === 'free') {
          const freeEmail = generateFreeReportEmail(result, auditInput.name);
          await resend.emails.send({
            from: 'Daniela Silva <auditoria@danielasilva.com>',
            to: auditInput.email,
            subject: `Tu Auditoría Digital Express — Score: ${result.scoreGeneral}/100`,
            text: freeEmail,
          });
          emailSent = true;
        } else {
          const completeReport = generateCompleteReportMarkdown(result, auditInput.name);
          await resend.emails.send({
            from: 'Daniela Silva <auditoria@danielasilva.com>',
            to: auditInput.email,
            subject: `Tu Auditoría Digital Completa — Score: ${result.scoreGeneral}/100`,
            text: completeReport,
          });
          emailSent = true;
        }
      }
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Don't fail the whole request if email fails
    }

    // ─── PREPARE WHATSAPP REPORT ───
    const waReport = `📊 AUDITORÍA DIGITAL — ${auditInput.name}

🎯 SCORE: ${result.scoreGeneral}/100

🚨 PROBLEMAS CRÍTICOS:
${result.problems.map((p: any, i: number) => `${i + 1}. ${p.title} → Hasta ${p.impactPercent}% de mejora`).join('\n')}

${auditInput.auditType === 'complete' ? `📋 PLAN DE ACCIÓN:
Semana 1: ${result.planAction.semana1.join(', ')}
Semana 2: ${result.planAction.semana2.join(', ')}

📢 PRESUPUESTO ADS: ${result.adBudget.dailyBudgetPercent}

Generado por Daniela Silva, Estratega Digital` : `💡 Obtén soluciones paso a paso + campañas personalizadas → Auditoría Completa $9.99

Generado por Daniela Silva, Estratega Digital`}`;

    // Prepare response based on audit type
    if (auditInput.auditType === 'free') {
      const freeEmail = generateFreeReportEmail(result, auditInput.name);
      return NextResponse.json({
        success: true,
        auditType: 'free',
        leadId: lead.id,
        score: result.scoreGeneral,
        problems: result.problems.map(p => ({
          title: p.title,
          impactPercent: p.impactPercent
        })),
        emailPreview: freeEmail,
        whatsappReport: waReport,
        emailSent,
        message: emailSent ? 'Tu auditoría ha sido enviada a tu email.' : 'Tu auditoría express está lista.'
      });
    } else {
      const completeReport = generateCompleteReportMarkdown(result, auditInput.name);
      return NextResponse.json({
        success: true,
        auditType: 'complete',
        leadId: lead.id,
        score: result.scoreGeneral,
        scores: {
          general: result.scoreGeneral,
          ventas: result.scoreVentas,
          presencia: result.scorePresencia,
          automatizacion: result.scoreAutomatizacion,
          experiencia: result.scoreExperiencia,
          retencion: result.scoreRetencion,
        },
        problems: result.problems,
        adBudget: result.adBudget,
        planAction: result.planAction,
        reportMarkdown: completeReport,
        whatsappReport: waReport,
        emailSent,
        message: emailSent ? 'Tu auditoría completa ha sido enviada a tu email.' : 'Tu auditoría completa ha sido generada.'
      });
    }

  } catch (error) {
    console.error('Audit API error:', error);
    return NextResponse.json(
      { error: 'Error al generar la auditoría. Intenta de nuevo.' },
      { status: 500 }
    );
  }
}
