import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateAudit, generateFreeReportEmail, generateCompleteReportMarkdown, type AuditInput } from '@/lib/audit-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const auditInput: AuditInput = {
      name: body.name || '',
      email: body.email || '',
      whatsapp: body.whatsapp || '',
      website: body.website || '',
      businessType: body.businessType || '',
      followers: body.followers || '',
      monthlyRevenue: body.monthlyRevenue || '',
      revenueGoal: body.revenueGoal || '',
      usesAutomation: body.usesAutomation || false,
      frustration: body.frustration || '',
      auditType: body.auditType || 'free',
      referralCode: body.referralCode || undefined,
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
        message: 'Tu auditoría express ha sido generada. Revisa tu email.'
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
        reportMarkdown: completeReport,
        message: 'Tu auditoría completa ha sido generada.'
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
