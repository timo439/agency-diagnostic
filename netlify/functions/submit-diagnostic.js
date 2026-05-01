export default async (request, context) => {

  // Only accept POST
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Parse body
  let data;
  try {
    data = await request.json();
  } catch (err) {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Build Airtable record — field names must exactly match your Airtable columns
  const record = {
    fields: {
      // ── METADATA ──
      'Stage Completed':              data.stage_completed              || '',

      // ── FOUNDER ──
      'Founder Name':                 data.founderName                  || '',
      'Agency Name':                  data.agencyName                   || '',

      // ── STAGE 1: FINANCIAL ──
      'Annual Revenue (£)':           data.revenue ? Number(data.revenue) : null,
      'Profit Margin':                data.margin_label                 || '',
      'Revenue Model':                data.revmodel_label               || '',
      'Biggest Client %':             data.conc_label                   || '',

      // ── STAGE 1: CLIENTS ──
      'Client Retention Rate':        data.ret_label                    || '',
      'Lead Sources':                 Array.isArray(data.leads)
                                        ? data.leads.join(', ')
                                        : (data.leads || ''),

      // ── STAGE 1: OPERATIONAL ──
      'Delivery Process':             data.delivery_label               || '',
      'Vacation Test':                data.vac_label                    || '',
      'Management Depth':             data.mgmt_label                   || '',

      // ── STAGE 1: GROWTH ──
      'Niche / Positioning':          data.pos_label                    || '',
      'Pipeline Visibility':          data.pip_label                    || '',

      // ── STAGE 1: OTHER ──
      'Team Size':                    data.hc_label                     || '',
      'Exit Timeline':                data.exit_label                   || '',
      'Biggest Challenge':            data.challenge                    || '',

      // ── SCORES ──
      'Score: Financial Foundation':  data.score_financial  != null ? Number(data.score_financial)  : null,
      'Score: Client Quality':        data.score_clients    != null ? Number(data.score_clients)    : null,
      'Score: Operational Depth':     data.score_ops        != null ? Number(data.score_ops)        : null,
      'Score: Growth & Positioning':  data.score_growth     != null ? Number(data.score_growth)     : null,
      'Total Score (out of 100)':     data.total_score      != null ? Number(data.total_score)      : null,
      'Stage Label':                  data.stage_label                  || '',
      'Indicative Valuation':         data.indicative_valuation         || '',

      // ── RAG RATINGS ──
      'RAG: Financial Foundation':    data.rag_financial                || '',
      'RAG: Client Quality':          data.rag_clients                  || '',
      'RAG: Operational Depth':       data.rag_ops                      || '',
      'RAG: Growth & Positioning':    data.rag_growth                   || '',

      // ── STAGE 2: CLIENTS ──
      'Client Tenure':                data.tenure_label                 || '',
      'Client Spend Trajectory':      data.spendtraj_label              || '',
      'Upsell / Cross-sell Rate':     data.upsell_label                 || '',
      'Number of Active Clients':     data.activeclients_label          || '',
      'Buyer Persona':                data.buyerpersona_label           || '',
      'Client Size':                  data.clientsize_label             || '',
      'Contract Transferability':     data.contracttransfer_label       || '',
      'Sales Cycle Length':           data.salescycle_label             || '',
      'Proposal Close Rate':          data.closerate_label              || '',
      'Marketing Spend':              data.mktspend_label               || '',

      // ── STAGE 2: TEAM ──
      'Client Relationship Owner':    data.relowner_label               || '',
      'Sales Owner':                  data.salesowner_label             || '',
      'Utilisation Rate':             data.utilisation_label            || '',
      'Services Productised':         data.productised_label            || '',
      'Staff Tenure':                 data.stafftenure_label            || '',
      'Founder Time Split':           data.foundersplit_label           || '',
      'Second-in-Command':            data.sic_label                    || '',

      // ── STAGE 2: MARKET ──
      'IP / Frameworks':              data.ip_label                     || '',
      'Thought Leadership':           Array.isArray(data.thoughtleadership)
                                        ? data.thoughtleadership.join(', ')
                                        : (data.thoughtleadership || ''),
      'Case Study Library':           data.casestudies_label            || '',
      'NPS / Satisfaction':           data.nps_label                    || '',
      'Positioning Statement':        data.posstmt                      || '',

      // ── STAGE 2: EXIT ──
      'Written Client Contracts':     data.contracts_label              || '',
      'Financial Rigour':             data.financials_label             || '',
      'IP Documentation':             data.ipdocs_label                 || '',
      'Employment Agreements':        data.employment_label             || '',
      'Data Room Readiness':          data.dataroom_label               || '',
      'Expansion Opportunities':      Array.isArray(data.expansion)
                                        ? data.expansion.join(', ')
                                        : (data.expansion || ''),
      'Growth Strategy':              data.growthstrat_label            || '',
      'Quality of Earnings':          data.qoe_label                    || '',

      // ── INTERNAL DEFAULT ──
      'Status':                       'Diagnostic Received',
    }
  };

  // Remove null and empty-string fields — Airtable errors on blank values
  Object.keys(record.fields).forEach(key => {
    if (record.fields[key] === null || record.fields[key] === '') {
      delete record.fields[key];
    }
  });

  // Log what we're sending
  console.log('Sending to Airtable:', JSON.stringify(record, null, 2));
  console.log('Base ID:', process.env.AIRTABLE_BASE_ID);
  console.log('Table ID:', process.env.AIRTABLE_TABLE_ID);
  console.log('PAT present:', !!process.env.AIRTABLE_PAT);

  // POST to Airtable
  const airtableRes = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}`,
    {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_PAT}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(record),
    }
  );

  const responseText = await airtableRes.text();
  console.log('Airtable status:', airtableRes.status);
  console.log('Airtable response:', responseText);

  if (!airtableRes.ok) {
    return new Response(
      JSON.stringify({ success: false, error: responseText }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const created = JSON.parse(responseText);
  return new Response(
    JSON.stringify({ success: true, id: created.id }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

export const config = { path: '/api/submit-diagnostic' };
