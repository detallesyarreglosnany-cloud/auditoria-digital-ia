import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateAudit, generateFreeReportEmail, generateCompleteReportMarkdown, type AuditInput } from '@/lib/audit-engine';
import { upsertBrevoContact, updateBrevoContact, BREVO_LIST_IDS, addContactToList } from '@/lib/brevo';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Daniela's notification email
const DANIELA_EMAIL = process.env.DANIELA_EMAIL || 'danielasilva.digital@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ─── RESEND EMAIL HANDLER ───
    // If resendEmail is true, look up existing audit and resend without regenerating
    if (body.resendEmail && body.email) {
      let emailSent = false;
      try {
        const existingLead = await db.lead.findFirst({
          where: { email: body.email },
          orderBy: { createdAt: 'desc' },
        });

        if (existingLead) {
          // Find latest audit result
          const auditResults = await db.auditResult.findMany({
            where: { leadId: existingLead.id },
            orderBy: { createdAt: 'desc' },
            take: 1,
          });

          if (auditResults.length > 0) {
            const auditData = auditResults[0];
            const result = JSON.parse(auditData.fullReport || '{}');

            if (resend && process.env.RESEND_API_KEY) {
              if (existingLead.auditType === 'free') {
                const freeEmail = generateFreeReportEmail(result, existingLead.name);
                await resend.emails.send({
                  from: 'Daniela Silva <auditoria@danielasilva.com>',
                  to: existingLead.email,
                  subject: `Tu Auditoría Digital Express — Score: ${result.scoreGeneral || result.score}/100`,
                  text: freeEmail,
                });
              } else {
                const completeReport = generateCompleteReportMarkdown(result, existingLead.name);
                await resend.emails.send({
                  from: 'Daniela Silva <auditoria@danielasilva.com>',
                  to: existingLead.email,
                  subject: `Tu Auditoría Digital Completa — Score: ${result.scoreGeneral || result.score}/100`,
                  text: completeReport,
                });
              }
              emailSent = true;
            }
          }
        }
      } catch (emailError) {
        console.error('Resend email error:', emailError);
      }

      return NextResponse.json({ success: true, emailSent, message: emailSent ? 'Reporte reenviado a tu email.' : 'No se pudo reenviar el email.' });
    }

    // ─── SAVE ONLY HANDLER ───
    // When saveOnly is true, just save the lead without generating the full audit
    // Used when user selects complete audit ($9.99) and needs to arrange payment first
    if (body.saveOnly) {
      try {
        const lead = await db.lead.create({
          data: {
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
            auditType: 'complete',
            score: 0,
            reportData: '',
            referralCode: body.referralCode || null,
            source: body.referralCode ? 'referral' : 'organic',
            serviceMinPrice: body.serviceMinPrice || '',
            serviceMaxPrice: body.serviceMaxPrice || '',
            paymentStatus: 'pending',
          }
        });

        // ─── SYNC TO BREVO (Complete audit lead — pending payment) ───
        const brevoResult = await upsertBrevoContact({
          email: body.email || '',
          name: body.name || '',
          whatsapp: body.whatsapp || '',
          website: body.website || '',
          socialLink: body.socialLink || '',
          businessType: body.businessType || '',
          followers: body.followers || '',
          monthlyRevenue: body.monthlyRevenue || '',
          revenueGoal: body.revenueGoal || '',
          usesAutomation: body.usesAutomation || false,
          frustration: body.frustration || '',
          auditType: 'complete',
          referralCode: body.referralCode || '',
          source: body.referralCode ? 'referral' : 'organic',
          serviceMinPrice: body.serviceMinPrice || '',
          serviceMaxPrice: body.serviceMaxPrice || '',
        });

        // Update Brevo sync status
        if (brevoResult.success) {
          await db.lead.update({
            where: { id: lead.id },
            data: { brevoSynced: true, brevoContactId: brevoResult.contactId || '' },
          });
        }

        // Notify Daniela about the new complete audit lead
        try {
          if (resend && process.env.RESEND_API_KEY) {
            await resend.emails.send({
              from: 'Daniela Silva <auditoria@danielasilva.com>',
              to: DANIELA_EMAIL,
              subject: `🔔 Nuevo lead COMPLETO: ${body.name} — $9.99 pendiente de pago`,
              text: `¡Nuevo lead para auditoría COMPLETA!\n\nNombre: ${body.name}\nEmail: ${body.email}\nWhatsApp: ${body.whatsapp || 'No proporcionado'}\nNegocio: ${body.businessType || 'No especificado'}\nFacturación: ${body.monthlyRevenue || 'No especificada'}\nMeta: ${body.revenueGoal || 'No especificada'}\nFrustración: ${body.frustration || 'No especificada'}\nServicios: $${body.serviceMinPrice || '?'} - $${body.serviceMaxPrice || '?'}\n\n⚠️ Pago pendiente — El usuario fue redirigido a WhatsApp para pagar.\n\n${brevoResult.success ? '✅ Sincronizado con Brevo para seguimiento.' : '⚠️ No se sincronizó con Brevo.'}\n\n— Sistema de Auditoría Digital`,
            });
          }
        } catch (notifyError) {
          console.error('Daniela notification error:', notifyError);
        }

        return NextResponse.json({ success: true, leadId: lead.id, message: 'Lead guardado. Pendiente de pago.' });
      } catch (dbError) {
        console.error('Save-only lead error:', dbError);
        return NextResponse.json({ success: true, message: 'Lead procesado.' });
      }
    }

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
        socialLink: auditInput.socialLink,
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
        serviceMinPrice: auditInput.serviceMinPrice || '',
        serviceMaxPrice: auditInput.serviceMaxPrice || '',
        paymentStatus: auditInput.auditType === 'free' ? 'free' : 'pending',
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
        fullReport: JSON.stringify(result),
      }
    });

    // ─── SYNC TO BREVO ───
    // This is the SECRET: recollect all data for email marketing, follow-up, and algorithm learning
    const brevoResult = await upsertBrevoContact({
      email: auditInput.email,
      name: auditInput.name,
      whatsapp: auditInput.whatsapp,
      website: auditInput.website,
      socialLink: auditInput.socialLink,
      businessType: auditInput.businessType,
      followers: auditInput.followers,
      monthlyRevenue: auditInput.monthlyRevenue,
      revenueGoal: auditInput.revenueGoal,
      usesAutomation: auditInput.usesAutomation,
      frustration: auditInput.frustration,
      auditType: auditInput.auditType,
      score: result.scoreGeneral,
      serviceMinPrice: auditInput.serviceMinPrice,
      serviceMaxPrice: auditInput.serviceMaxPrice,
      referralCode: auditInput.referralCode,
      source: auditInput.referralCode ? 'referral' : 'organic',
    });

    // Update Brevo sync status in DB
    if (brevoResult.success) {
      await db.lead.update({
        where: { id: lead.id },
        data: { brevoSynced: true, brevoContactId: brevoResult.contactId || '' },
      });
    }

    // ─── SEND EMAIL TO USER ───
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

    // ─── SEND NOTIFICATION TO DANIELA ───
    try {
      if (resend && process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: 'Daniela Silva <auditoria@danielasilva.com>',
          to: DANIELA_EMAIL,
          subject: `🔔 Nuevo lead: ${auditInput.name} — ${auditInput.auditType === 'free' ? 'Express' : 'Completa'} (Score: ${result.scoreGeneral}/100)`,
          text: `¡Nuevo lead!\n\nNombre: ${auditInput.name}\nEmail: ${auditInput.email}\nWhatsApp: ${auditInput.whatsapp || 'No proporcionado'}\nNegocio: ${auditInput.businessType || 'No especificado'}\nSitio web: ${auditInput.website || 'No'}\nRed social: ${auditInput.socialLink || 'No'}\nTipo: ${auditInput.auditType === 'free' ? 'Express (Gratis)' : 'Completa ($9.99)'}\nScore: ${result.scoreGeneral}/100\nFrustración: ${auditInput.frustration || 'No especificada'}\nServicios: $${auditInput.serviceMinPrice || '?'} - $${auditInput.serviceMaxPrice || '?'}\nCódigo referido: ${auditInput.referralCode || 'Ninguno'}\n\n${brevoResult.success ? '✅ Sincronizado con Brevo para seguimiento.' : '⚠️ No se sincronizó con Brevo.'}\n\n— Sistema de Auditoría Digital`,
        });
      }
    } catch (notifyError) {
      console.error('Daniela notification error:', notifyError);
    }

    // ─── PREPARE WHATSAPP REPORT ───
    const waReport = `📊 AUDITORÍA DIGITAL — ${auditInput.name}

🎯 SCORE: ${result.scoreGeneral}/100

🚨 PROBLEMAS CRÍTICOS:
${result.problems.map((p: any, i: number) => `${i + 1}. ${p.title} → Hasta ${p.impactPercent}% de mejora`).join('\n')}

${auditInput.auditType === 'complete' ? `📋 PLAN DE ACCIÓN:
Semana 1: ${result.planAction.semana1.join(', ')}
Semana 2: ${result.planAction.semana2.join(', ')}

💰 FUGA DE DINERO: ${result.moneyLeak?.substring(0, 200)}...

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
          description: p.description,
          impactPercent: p.impactPercent,
          area: p.area,
          severity: p.severity,
          beforeScenario: p.beforeScenario,
          afterScenario: p.afterScenario,
        })),
        emailPreview: freeEmail,
        whatsappReport: waReport,
        emailSent,
        // Include benefit answers even in free for preview
        moneyLeak: result.moneyLeak,
        costOfInaction: result.costOfInaction,
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
        // New benefit-oriented answers
        moneyLeak: result.moneyLeak,
        socialStrategy: result.socialStrategy,
        goalWithoutSpending: result.goalWithoutSpending,
        whyInvest: result.whyInvest,
        costOfInaction: result.costOfInaction,
        digital2026: result.digital2026,
        reportMarkdown: completeReport,
        whatsappReport: waReport,
        emailSent,
        brevoSynced: brevoResult.success,
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
