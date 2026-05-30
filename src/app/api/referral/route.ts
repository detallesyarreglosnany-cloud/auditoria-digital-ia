import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// GET /api/referral?code=XXX — Get referral info
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'Código de referido requerido' }, { status: 400 });
  }

  const referral = await db.referral.findUnique({
    where: { code }
  });

  if (!referral) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    referrerName: referral.referrerName,
    clicks: referral.clicks,
    conversions: referral.conversions
  });
}

// POST /api/referral — Create a new referral code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, email, phone } = body;
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nombre y email son obligatorios' },
        { status: 400 }
      );
    }

    // Check if referral already exists for this email
    const existing = await db.referral.findFirst({
      where: { referrerEmail: email }
    });

    if (existing) {
      // Send email with existing code
      const existingLink = `${process.env.NEXT_PUBLIC_SITE_URL || ''}?ref=${existing.code}`;
      try {
        if (resend && process.env.RESEND_API_KEY) {
          await resend.emails.send({
            from: 'Daniela Silva <auditoria@danielasilva.com>',
            to: email,
            subject: `Tu código de referido — ${existing.code}`,
            text: `¡Hola ${name}!\n\nYa tienes un código de referido registrado:\n\n🔗 Tu enlace: ${existingLink}\n📋 Tu código: ${existing.code}\n\nComparte este enlace y gana 10% de comisión por cada paquete vendido:\n- Impulso $197 → $19.70\n- Crecimiento $497 → $49.70\n- Dominio $997 → $99.70\n\nDaniela Silva, Estratega Digital`,
          });
        }
      } catch (e) { console.error('Referral email error:', e); }

      return NextResponse.json({
        success: true,
        code: existing.code,
        referralLink: existingLink,
        message: 'Ya tienes un código de referido. Te lo enviamos a tu email.'
      });
    }

    // Generate unique code from name
    const baseCode = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 8);
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const code = `${baseCode}${randomSuffix}`;

    const referral = await db.referral.create({
      data: {
        code,
        referrerName: name,
        referrerEmail: email,
        referrerPhone: phone || null,
      }
    });

    const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || ''}?ref=${referral.code}`;

    // Send confirmation email
    let emailSent = false;
    try {
      if (resend && process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: 'Daniela Silva <auditoria@danielasilva.com>',
          to: email,
          subject: `Tu código de referido — ${referral.code}`,
          text: `¡Hola ${name}!\n\n¡Tu código de referido está listo!\n\n🔗 Tu enlace: ${referralLink}\n📋 Tu código: ${referral.code}\n\nComparte este enlace y gana 10% de comisión por cada paquete vendido:\n- Impulso $197 → $19.70\n- Crecimiento $497 → $49.70\n- Dominio $997 → $99.70\n\nDaniela Silva, Estratega Digital`,
        });
        emailSent = true;
      }
    } catch (e) { console.error('Referral email error:', e); }

    // Build WhatsApp confirmation message
    const waMsg = encodeURIComponent(`¡Hola ${name}! Tu código de referido está listo:\n\n🔗 Enlace: ${referralLink}\n📋 Código: ${referral.code}\n\nComparte y gana 10% por cada paquete vendido.\n- Impulso $197 → $19.70\n- Crecimiento $497 → $49.70\n- Dominio $997 → $99.70`);

    return NextResponse.json({
      success: true,
      code: referral.code,
      referralLink,
      whatsappLink: `https://wa.me/?text=${waMsg}`,
      emailSent,
      message: emailSent ? 'Código creado y enviado a tu email.' : 'Código de referido creado exitosamente.'
    });

  } catch (error) {
    console.error('Referral API error:', error);
    return NextResponse.json(
      { error: 'Error al crear el código de referido' },
      { status: 500 }
    );
  }
}
