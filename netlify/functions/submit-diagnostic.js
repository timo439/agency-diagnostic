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
      'Submission Date':              new Date().toISOString().split('T')[0],
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
      'S2: Client Tenure':            data.tenure_label                 || '',
      'S2: Spend Trajectory':         data.spendtraj_label              || '',
      'S2: Upsell Rate':              data.upsell_label                 || '',
      'S2: Active Clients':           data.activeclients_label          || '',
      'S2: Buyer Persona':            data.buyerpersona_label           || '',
      'S2: Client Size':              data.clientsize_label             || '',
      'S2: Contract Transfer':        data.contracttransfer_label       || '',
      'S2: Sales Cycle':              data.salescycle_label             || '',
      'S2: Close Rate':               data.closerate_label              || '',
      'S2: Marketing Spend':          data.mktspend_label               || '',

      // ── STAGE 2: TEAM ──
      'S2: Relationship Owner':       data.relowner_label               || '',
      'S2: Sales Owner':              data.salesowner_label             || '',
      'S2: Utilisation':              data.utilisation_label            || '',
      'S2: Productised':              data.productised_label            || '',
      'S2: Staff Tenure':             data.stafftenure_label            || '',
      'S2: Founder Split':            data.foundersplit_label           || '',
      'S2: 2IC / Succession':         data.sic_label                    || '',

      // ── STAGE 2: MARKET ──
      'S2: IP / Frameworks':          data.ip_label                     || '',
      'S2: Thought Leadership':       Array.isArray(data.thoughtleadership)
                                        ? data.thoughtleadership.join(', ')
                                        : (data.thoughtleadership || ''),
      'S2: Case Studies':             data.casestudies_label            || '',
      'S2: NPS':                      data.nps_label                    || '',
      'S2: Positioning Statement':    data.posstmt                      || '',

      // ── STAGE 2: EXIT ──
      'S2: Client Contracts':         data.contracts_label              || '',
      'S2: Financial Rigour':         data.financials_label             || '',
      'S2: IP Documentation':         data.ipdocs_label                 || '',
      'S2: Employment Agreements':    data.employment_label             || '',
      'S2: Data Room':                data.dataroom_label               || '',
      'S2: Expansion':                Array.isArray(data.expansion)
                                        ? data.expansion.join(', ')
                                        : (data.expansion || ''),
      'S2: Growth Strategy':          data.growthstrat_label            || '',
      'S2: Quality of Earnings':      data.qoe_label                    || '',

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

  // If record_id provided → PATCH (update) existing record
  // Otherwise → POST (create) new record
  const recordId = data.record_id;
  const url = recordId
    ? `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}/${recordId}`
    : `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}`;
  const method = recordId ? 'PATCH' : 'POST';

  console.log('Base ID:', process.env.AIRTABLE_BASE_ID);
  console.log('Table ID:', process.env.AIRTABLE_TABLE_ID);
  console.log('PAT present:', !!process.env.AIRTABLE_PAT);
  console.log('Method:', method, recordId ? `record: ${recordId}` : 'new record');

  const airtableRes = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${process.env.AIRTABLE_PAT}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(record),
  });

  const responseText = await airtableRes.text();
  console.log('Airtable status:', airtableRes.status);

  if (!airtableRes.ok) {
    console.log('Airtable error:', responseText);
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
