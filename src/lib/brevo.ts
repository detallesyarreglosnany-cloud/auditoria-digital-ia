/**
 * Brevo (formerly Sendinblue) API Integration
 * 
 * Captures all lead data for:
 * - Email marketing & automated flows
 * - Client tracking & segmentation
 * - Data recollection for algorithm learning
 * - Follow-up sequences
 * 
 * Uses Brevo REST API v3
 * Docs: https://developers.brevo.com/docs
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3';

// Default list IDs (configure in Brevo dashboard after linking account)
const BREVO_LIST_IDS = {
  free_audit: parseInt(process.env.BREVO_LIST_FREE || '2'),
  complete_audit: parseInt(process.env.BREVO_LIST_COMPLETE || '3'),
  referral_partners: parseInt(process.env.BREVO_LIST_REFERRAL || '4'),
  all_leads: parseInt(process.env.BREVO_LIST_ALL || '5'),
};

interface BrevoContactData {
  email: string;
  name?: string;
  whatsapp?: string;
  businessType?: string;
  followers?: string;
  monthlyRevenue?: string;
  revenueGoal?: string;
  usesAutomation?: boolean;
  frustration?: string;
  website?: string;
  socialLink?: string;
  auditType?: string;
  score?: number;
  serviceMinPrice?: string;
  serviceMaxPrice?: string;
  referralCode?: string;
  source?: string;
}

interface BrevoReferralData {
  email: string;
  name: string;
  phone?: string;
  referralCode: string;
}

/**
 * Create or update a contact in Brevo with all lead data
 * This is the core data recollection function
 */
export async function upsertBrevoContact(data: BrevoContactData): Promise<{ success: boolean; contactId?: string }> {
  if (!BREVO_API_KEY) {
    console.log('[Brevo] No API key configured, skipping contact sync');
    return { success: false };
  }

  try {
    const listIds = [BREVO_LIST_IDS.all_leads];
    if (data.auditType === 'free') listIds.push(BREVO_LIST_IDS.free_audit);
    if (data.auditType === 'complete') listIds.push(BREVO_LIST_IDS.complete_audit);

    const attributes: Record<string, any> = {
      FIRSTNAME: data.name?.split(' ')[0] || '',
      LASTNAME: data.name?.split(' ').slice(1).join(' ') || '',
      WHATSAPP: data.whatsapp || '',
      BUSINESS_TYPE: data.businessType || '',
      FOLLOWERS: data.followers || '',
      MONTHLY_REVENUE: data.monthlyRevenue || '',
      REVENUE_GOAL: data.revenueGoal || '',
      USES_AUTOMATION: data.usesAutomation ? 'Sí' : 'No',
      FRUSTRATION: data.frustration || '',
      WEBSITE: data.website || '',
      SOCIAL_LINK: data.socialLink || '',
      AUDIT_TYPE: data.auditType || '',
      AUDIT_SCORE: data.score || 0,
      SERVICE_MIN_PRICE: data.serviceMinPrice || '',
      SERVICE_MAX_PRICE: data.serviceMaxPrice || '',
      REFERRAL_CODE: data.referralCode || '',
      LEAD_SOURCE: data.source || 'organic',
      LAST_AUDIT_DATE: new Date().toISOString().split('T')[0],
    };

    const response = await fetch(`${BREVO_API_URL}/contacts`, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        attributes,
        listIds,
        updateEnabled: true, // Update if exists
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[Brevo] Contact created/updated: ${data.email} (ID: ${result.id})`);
      return { success: true, contactId: result.id };
    }

    // Handle 404 - contact doesn't exist yet, try creating
    if (response.status === 404) {
      return await createBrevoContact(data);
    }

    // Handle duplicate contact (204 means already in list)
    if (response.status === 204 || response.status === 201) {
      console.log(`[Brevo] Contact already exists: ${data.email}`);
      return { success: true };
    }

    const errorData = await response.text();
    console.error(`[Brevo] Contact upsert error (${response.status}):`, errorData);
    return { success: false };
  } catch (error) {
    console.error('[Brevo] Contact upsert exception:', error);
    return { success: false };
  }
}

/**
 * Create a new Brevo contact (first time)
 */
async function createBrevoContact(data: BrevoContactData): Promise<{ success: boolean; contactId?: string }> {
  try {
    const listIds = [BREVO_LIST_IDS.all_leads];
    if (data.auditType === 'free') listIds.push(BREVO_LIST_IDS.free_audit);
    if (data.auditType === 'complete') listIds.push(BREVO_LIST_IDS.complete_audit);

    const attributes: Record<string, any> = {
      FIRSTNAME: data.name?.split(' ')[0] || '',
      LASTNAME: data.name?.split(' ').slice(1).join(' ') || '',
      WHATSAPP: data.whatsapp || '',
      BUSINESS_TYPE: data.businessType || '',
      FOLLOWERS: data.followers || '',
      MONTHLY_REVENUE: data.monthlyRevenue || '',
      REVENUE_GOAL: data.revenueGoal || '',
      USES_AUTOMATION: data.usesAutomation ? 'Sí' : 'No',
      FRUSTRATION: data.frustration || '',
      WEBSITE: data.website || '',
      SOCIAL_LINK: data.socialLink || '',
      AUDIT_TYPE: data.auditType || '',
      AUDIT_SCORE: data.score || 0,
      SERVICE_MIN_PRICE: data.serviceMinPrice || '',
      SERVICE_MAX_PRICE: data.serviceMaxPrice || '',
      REFERRAL_CODE: data.referralCode || '',
      LEAD_SOURCE: data.source || 'organic',
      LAST_AUDIT_DATE: new Date().toISOString().split('T')[0],
    };

    const response = await fetch(`${BREVO_API_URL}/contacts`, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        attributes,
        listIds,
        updateEnabled: true,
      }),
    });

    if (response.ok || response.status === 201) {
      const result = await response.json();
      console.log(`[Brevo] Contact created: ${data.email} (ID: ${result.id})`);
      return { success: true, contactId: result.id };
    }

    const errorData = await response.text();
    console.error(`[Brevo] Contact creation error (${response.status}):`, errorData);
    return { success: false };
  } catch (error) {
    console.error('[Brevo] Contact creation exception:', error);
    return { success: false };
  }
}

/**
 * Add a contact to a specific Brevo list
 */
export async function addContactToList(email: string, listId: number): Promise<boolean> {
  if (!BREVO_API_KEY) return false;

  try {
    const response = await fetch(`${BREVO_API_URL}/contacts/lists`, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emails: [email],
        listIds: [listId],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[Brevo] Add to list error:', error);
    return false;
  }
}

/**
 * Update contact attributes (e.g., after paying for complete audit)
 */
export async function updateBrevoContact(email: string, attributes: Record<string, any>): Promise<boolean> {
  if (!BREVO_API_KEY) return false;

  try {
    const response = await fetch(`${BREVO_API_URL}/contacts/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ attributes }),
    });

    return response.ok;
  } catch (error) {
    console.error('[Brevo] Update contact error:', error);
    return false;
  }
}

/**
 * Track referral partner in Brevo
 */
export async function upsertBrevoReferralPartner(data: BrevoReferralData): Promise<{ success: boolean }> {
  if (!BREVO_API_KEY) return { success: false };

  try {
    const attributes: Record<string, any> = {
      FIRSTNAME: data.name?.split(' ')[0] || '',
      LASTNAME: data.name?.split(' ').slice(1).join(' ') || '',
      PHONE: data.phone || '',
      REFERRAL_CODE: data.referralCode,
      PARTNER_TYPE: 'referral',
      REGISTRATION_DATE: new Date().toISOString().split('T')[0],
    };

    const response = await fetch(`${BREVO_API_URL}/contacts`, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        attributes,
        listIds: [BREVO_LIST_IDS.all_leads, BREVO_LIST_IDS.referral_partners],
        updateEnabled: true,
      }),
    });

    if (response.ok || response.status === 201 || response.status === 204) {
      console.log(`[Brevo] Referral partner synced: ${data.email}`);
      return { success: true };
    }

    const errorData = await response.text();
    console.error(`[Brevo] Referral partner error:`, errorData);
    return { success: false };
  } catch (error) {
    console.error('[Brevo] Referral partner exception:', error);
    return { success: false };
  }
}

/**
 * Trigger a Brevo automated workflow (e.g., welcome email series)
 * Template IDs are configured in Brevo dashboard
 */
export async function triggerBrevoWorkflow(
  workflowId: string,
  email: string,
  extraData?: Record<string, any>
): Promise<boolean> {
  if (!BREVO_API_KEY) return false;

  try {
    const response = await fetch(`${BREVO_API_URL}/workflows/${workflowId}/trigger`, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        ...extraData,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[Brevo] Workflow trigger error:', error);
    return false;
  }
}

/**
 * Send a transactional email through Brevo
 */
export async function sendBrevoTransactionalEmail(
  templateId: number,
  email: string,
  params: Record<string, any>
): Promise<boolean> {
  if (!BREVO_API_KEY) return false;

  try {
    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId,
        to: [{ email }],
        params,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[Brevo] Transactional email error:', error);
    return false;
  }
}

export { BREVO_LIST_IDS };
