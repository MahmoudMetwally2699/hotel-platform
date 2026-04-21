/**
 * exportAnalyticsPDF.js
 * Data-driven PDF export — uses exact backend field names.
 * NO html2canvas. Pure jsPDF text/shape drawing.
 */

import jsPDF from 'jspdf';

// ─── Formatters ───────────────────────────────────────────────────────────────
const v    = (val, dec = 1)  => (val == null || isNaN(Number(val))) ? '—' : Number(val).toFixed(dec);
const vInt = (val)           => (val == null || isNaN(Number(val))) ? '—' : Math.round(Number(val)).toLocaleString();
const vPct = (val)           => (val == null || isNaN(Number(val))) ? '—' : `${Number(val).toFixed(1)}%`;
const vMon = (val, cur='USD')=> (val == null || isNaN(Number(val))) ? '—'
  : `${Number(val).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} ${cur}`;
const cap  = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

const hexToRgb = (hex) => {
  const c = (hex || '#4F9DC4').replace('#','');
  const n = parseInt(c, 16);
  return [(n>>16)&255, (n>>8)&255, n&255];
};

// ─── Layout ───────────────────────────────────────────────────────────────────
const PW=210, PH=297, MX=12, CW=186, HH=22, FH=14;

// ─── Drawing helpers ──────────────────────────────────────────────────────────

const header = (doc, rgb, title, sub, date, page, total) => {
  doc.setFillColor(...rgb); doc.rect(0,0,PW,HH,'F');
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold'); doc.setFontSize(11);
  doc.text(title, MX, 10);
  doc.setFont('helvetica','normal'); doc.setFontSize(7);
  doc.text(sub, MX, 17);
  doc.text(date, PW-MX, 17, {align:'right'});
  doc.text(`Page ${page} / ${total}`, PW-MX, 10, {align:'right'});
  doc.setTextColor(40,40,40);
  return HH+5;
};

const footer = (doc) => {
  const fy = PH-FH+4;
  doc.setDrawColor(200,200,200); doc.setLineWidth(0.3);
  doc.line(MX, PH-FH, PW-MX, PH-FH);
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5);
  doc.setTextColor(150,150,150);
  doc.text(`Hotel Analytics Platform · ${new Date().toLocaleString()}`, PW/2, fy, {align:'center'});
};

const sectionHeading = (doc, rgb, label, y) => {
  doc.setFillColor(244,248,255);
  doc.rect(MX, y, CW, 7, 'F');
  doc.setFillColor(...rgb); doc.rect(MX, y, 2.5, 7, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(9);
  doc.setTextColor(40,40,40);
  doc.text(label, MX+5, y+5);
  return y+11;
};

const kpiRow = (doc, rgb, items, y) => {
  const bw = CW/items.length;
  items.forEach((m,i) => {
    const x = MX + i*bw;
    doc.setFillColor(249,252,255);
    doc.setDrawColor(210,220,235); doc.setLineWidth(0.3);
    doc.roundedRect(x+1, y, bw-2, 20, 2,2, 'FD');
    doc.setFillColor(...rgb); doc.rect(x+1,y,bw-2,1.2,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(11);
    doc.setTextColor(...rgb);
    doc.text(String(m.value ?? '—'), x+bw/2, y+11, {align:'center', maxWidth: bw-4});
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(90,90,90);
    doc.text(m.label, x+bw/2, y+16, {align:'center', maxWidth: bw-4});
    if (m.sub) {
      doc.setFontSize(6.5); doc.setTextColor(130,130,130);
      doc.text(m.sub, x+bw/2, y+19.5, {align:'center', maxWidth: bw-4});
    }
  });
  doc.setTextColor(40,40,40);
  return y+24;
};

const drawTable = (doc, rgb, heads, rows, widths, startY, addPage) => {
  const rh=6.5, hh=7.5;
  let y=startY;
  const tw=widths.reduce((a,b)=>a+b,0);

  const rowOut = (cells, isHead) => {
    if (isHead) {
      doc.setFillColor(...rgb); doc.rect(MX,y,tw,hh,'F');
      doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(7.5);
    } else {
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(40,40,40);
    }
    let x=MX;
    cells.forEach((cell,i)=>{
      const align = i===0?'left':'right';
      const tx = align==='left'?x+2:x+widths[i]-2;
      doc.text(String(cell??'—'), tx, y+(isHead?5.5:4.5), {align, maxWidth:widths[i]-3});
      x+=widths[i];
    });
    if (!isHead) {
      doc.setDrawColor(225,232,242); doc.setLineWidth(0.2);
      doc.line(MX, y+rh, MX+tw, y+rh);
    }
  };

  rowOut(heads, true); y+=hh;
  rows.forEach((row,idx)=>{
    if (idx%2===0){ doc.setFillColor(246,249,253); doc.rect(MX,y,tw,rh,'F'); }
    rowOut(row,false); y+=rh;
    if (y > PH-FH-16) y=addPage();
  });
  doc.setDrawColor(185,195,215); doc.setLineWidth(0.3);
  doc.rect(MX,startY,tw,y-startY,'S');
  return y+5;
};

const needsPage = (y, needed=50) => y > PH-FH-needed;

// ─── Tab renderers ────────────────────────────────────────────────────────────

const renderRatings = (doc, rgb, data, y0, addPage) => {
  let y=y0;

  // ── Summary: { avgRating, totalReviews, ratingTrend, reviewsTrend, highestRatedService{name,rating} }
  const s = data.summary;
  if (s) {
    y = sectionHeading(doc, rgb, 'Customer Ratings — Key Metrics', y);
    y = kpiRow(doc, rgb, [
      { label:'Average Rating',          value:`${v(s.avgRating,2)} / 5`,  sub:`${vInt(s.totalReviews)} total reviews` },
      { label:'Rating Trend',            value:`${s.ratingTrend>=0?'+':''}${v(s.ratingTrend,1)}%`, sub:'vs previous period' },
      { label:'Review Count Change',     value:`${s.reviewsTrend>=0?'+':''}${v(s.reviewsTrend,1)}%`, sub:'vs previous period' },
      { label:'Top Rated Service',       value:s.highestRatedService?.name || '—', sub:`${v(s.highestRatedService?.rating,2)} ★` },
    ], y);
  }

  // ── Breakdown: { breakdown: [{ serviceType, totalRequests, avgRating, star5, star4, star3, star1_2 }] }
  const bd = data.breakdown?.breakdown;
  if (bd?.length) {
    if (needsPage(y,60)) y=addPage();
    y = sectionHeading(doc, rgb, 'Ratings Breakdown by Service Type', y);
    y = drawTable(doc, rgb,
      ['Service Type','Reviews','Avg Rating','5★','4★','3★','≤2★'],
      bd.map(r=>[
        cap(r.serviceType||r._id||''),
        vInt(r.totalRequests),
        v(r.avgRating,2),
        vInt(r.star5),
        vInt(r.star4),
        vInt(r.star3),
        vInt(r.star1_2),
      ]),
      [58,22,22,18,18,18,30], y, addPage
    );
  }

  // ── By-type: { chartData: [{ name, avgRating, requestCount }] }
  const bt = data.byType?.chartData;
  if (bt?.length) {
    if (needsPage(y,50)) y=addPage();
    y = sectionHeading(doc, rgb, 'Average Rating by Service Type', y);
    y = drawTable(doc, rgb,
      ['Service Type','Avg Rating','Request Count'],
      bt.map(r=>[cap(r.name||r._id||''), v(r.avgRating,2), vInt(r.requestCount)]),
      [96,50,40], y, addPage
    );
  }

  return y;
};

const renderOperational = (doc, rgb, data, y0, addPage) => {
  let y=y0;

  // ── Summary: { avgResponseTime, avgCompletionTime, slaComplianceRate, delayedRequests, totalRequests, slaTrend, responseTrend, completionTrend }
  const s = data.summary;
  if (s) {
    y = sectionHeading(doc, rgb, 'Operational Efficiency — Key Metrics', y);
    y = kpiRow(doc, rgb, [
      { label:'Avg Response Time',   value:`${vInt(s.avgResponseTime)} min`,  sub:`Trend: ${s.responseTrend>=0?'+':''}${v(s.responseTrend,1)}%` },
      { label:'Avg Completion Time', value:`${vInt(s.avgCompletionTime)} min`, sub:`Trend: ${s.completionTrend>=0?'+':''}${v(s.completionTrend,1)}%` },
      { label:'SLA Compliance Rate', value:vPct(s.slaComplianceRate), sub:`Trend: ${s.slaTrend>=0?'+':''}${v(s.slaTrend,1)}%` },
      { label:'Delayed Requests',    value:vInt(s.delayedRequests),   sub:`of ${vInt(s.totalRequests)} total` },
    ], y);
  }

  // ── SLA by service: { slaByService: [{ serviceType, totalBookings, onTimeBookings, delayedBookings, onTimePercentage, avgDelay }] }
  const sla = data.slaByService?.slaByService;
  if (sla?.length) {
    if (needsPage(y,60)) y=addPage();
    y = sectionHeading(doc, rgb, 'SLA Performance by Service Type', y);
    y = drawTable(doc, rgb,
      ['Service','Total','On-Time','Delayed','On-Time %','Avg Delay (min)'],
      sla.map(r=>[
        cap(r.serviceType||r._id||''),
        vInt(r.totalBookings),
        vInt(r.onTimeBookings),
        vInt(r.delayedBookings),
        vPct(r.onTimePercentage),
        vInt(r.avgDelay),
      ]),
      [58,24,24,24,30,26], y, addPage
    );
  }

  // ── Service details: { serviceDetails: [{ serviceType, serviceName, bookingNumber, guestName, status, actualCompletionTime, isCompletionOnTime, slaStatus }] }
  const sd = data.serviceDetails?.serviceDetails;
  if (sd?.length) {
    if (needsPage(y,60)) y=addPage();
    y = sectionHeading(doc, rgb, 'Recent Service Requests (up to 50)', y);
    y = drawTable(doc, rgb,
      ['Booking #','Service','Guest','Status','Actual (min)','SLA'],
      sd.slice(0,50).map(r=>[
        r.bookingNumber||'—',
        cap(r.serviceType||''),
        r.guestName?.trim()||'—',
        cap(r.status||r.slaStatus||''),
        vInt(r.actualCompletionTime),
        r.isCompletionOnTime===true?'✓ On Time':r.isCompletionOnTime===false?'✗ Delayed':'Pending',
      ]),
      [36,30,38,28,26,28], y, addPage
    );
  }

  return y;
};

const renderRevenue = (doc, rgb, data, y0, addPage) => {
  let y=y0;
  const cur = data.summary?.currency || data.byCategory?.currency || 'USD';

  // ── Summary: { totalRevenue, internalRevenue, externalRevenue, externalCommission, trend, currency }
  const s = data.summary;
  if (s) {
    y = sectionHeading(doc, rgb, 'Revenue Analysis — Key Metrics', y);
    y = kpiRow(doc, rgb, [
      { label:'Total Revenue',      value:vMon(s.totalRevenue, cur),     sub:`Trend: ${s.trend>=0?'+':''}${v(s.trend,1)}%` },
      { label:'Internal Revenue',   value:vMon(s.internalRevenue, cur),  sub:'Hotel-operated services' },
      { label:'External Revenue',   value:vMon(s.externalRevenue, cur),  sub:'Third-party providers' },
      { label:'External Commission',value:vMon(s.externalCommission,cur),sub:'Hotel markup earned' },
    ], y);
  }

  // ── By category: { categoryData: [{ category, revenue, bookingCount, avgRevenue, percentage }], currency }
  const catData = data.byCategory?.categoryData;
  if (catData?.length) {
    if (needsPage(y,60)) y=addPage();
    y = sectionHeading(doc, rgb, 'Revenue by Service Category', y);
    y = drawTable(doc, rgb,
      ['Category','Revenue','Bookings','Avg per Booking','Share %'],
      catData.map(r=>[
        cap(r.category||r._id||''),
        vMon(r.revenue, cur),
        vInt(r.bookingCount),
        vMon(r.avgRevenue, cur),
        vPct(r.percentage),
      ]),
      [48,46,24,46,22], y, addPage
    );
  }

  // ── Internal services: { totalInternalRevenue, services: [{ serviceType, totalRevenue, bookingCount, avgRevenue, percentage }], currency }
  const intSvc = data.internalServices?.services;
  if (intSvc?.length) {
    if (needsPage(y,50)) y=addPage();
    y = sectionHeading(doc, rgb, 'Internal Services Revenue', y);
    y = drawTable(doc, rgb,
      ['Service','Total Revenue','Bookings','Avg Revenue','Share %'],
      intSvc.map(r=>[
        cap(r.serviceType||r._id||''),
        vMon(r.totalRevenue, cur),
        vInt(r.bookingCount),
        vMon(r.avgRevenue, cur),
        vPct(r.percentage),
      ]),
      [48,46,24,46,22], y, addPage
    );
  }

  // ── External providers: { providers: [{ providerName, serviceType, totalRevenue, basePrice, hotelCommission, bookingCount, avgMarkup }] }
  const extProv = data.externalProviders?.providers;
  if (extProv?.length) {
    if (needsPage(y,50)) y=addPage();
    y = sectionHeading(doc, rgb, 'External Providers Revenue', y);
    y = drawTable(doc, rgb,
      ['Provider','Service','Revenue','Commission','Bookings','Markup %'],
      extProv.map(r=>[
        r.providerName||cap(r._id?.providerName||''),
        cap(r.serviceType||r._id?.serviceType||''),
        vMon(r.totalRevenue, cur),
        vMon(r.hotelCommission, cur),
        vInt(r.bookingCount),
        vPct(r.avgMarkup),
      ]),
      [46,30,40,36,20,14], y, addPage
    );
  }

  return y;
};

const renderSpending = (doc, rgb, data, y0, addPage) => {
  let y=y0;
  const cur = data.summary?.currency || 'USD';

  // ── Summary: { avgCustomerSpending, totalCustomers, totalServiceRequests, mostPopularService, mostPopularServiceCount, currency }
  const s = data.summary;
  if (s) {
    y = sectionHeading(doc, rgb, 'Customer Spending — Key Metrics', y);
    y = kpiRow(doc, rgb, [
      { label:'Avg Spend / Customer', value:vMon(s.avgCustomerSpending, cur), sub:null },
      { label:'Unique Customers',     value:vInt(s.totalCustomers),             sub:null },
      { label:'Total Service Requests',value:vInt(s.totalServiceRequests),      sub:null },
      { label:'Most Popular Service', value:cap(s.mostPopularService||'—'),     sub:`${vInt(s.mostPopularServiceCount)} requests` },
    ], y);
  }

  // ── Service popularity: { services: [{ serviceType, totalRequests, totalRevenue, avgSpending, uniqueCustomers }] }
  const pop = data.servicePopularity?.services;
  if (pop?.length) {
    if (needsPage(y,60)) y=addPage();
    y = sectionHeading(doc, rgb, 'Service Popularity', y);
    y = drawTable(doc, rgb,
      ['Service','Requests','Revenue','Customers','Avg/Customer'],
      pop.map(r=>[
        cap(r.serviceType||r._id||''),
        vInt(r.totalRequests),
        vMon(r.totalRevenue, cur),
        vInt(r.uniqueCustomers),
        vMon(r.avgSpending, cur),
      ]),
      [56,26,48,26,30], y, addPage
    );
  }

  // ── Comprehensive: { services: [{ serviceType, totalRequests, totalRevenue, avgSpending, uniqueCustomers, requestGrowth, revenueGrowth, repeatCustomerRate }] }
  const comp = data.comprehensive?.services;
  if (comp?.length) {
    if (needsPage(y,60)) y=addPage();
    y = sectionHeading(doc, rgb, 'Comprehensive Performance', y);
    y = drawTable(doc, rgb,
      ['Service','Requests','Revenue','Req Growth','Rev Growth','Repeat Rate'],
      comp.map(r=>[
        cap(r.serviceType||r._id||''),
        vInt(r.totalRequests),
        vMon(r.totalRevenue, cur),
        vPct(r.requestGrowth),
        vPct(r.revenueGrowth),
        v(r.repeatCustomerRate, 2),
      ]),
      [42,22,46,26,26,24], y, addPage
    );
  }

  return y;
};

// ─── Main export ──────────────────────────────────────────────────────────────

export const exportAnalyticsPDF = async ({
  activeTab,
  selectedRange,
  selectedService,
  primaryColor='#4F9DC4',
  analyticsData={},
  t,
  onStart,
  onEnd,
}) => {
  onStart?.();
  try {
    const doc = new jsPDF({orientation:'portrait', unit:'mm', format:'a4'});
    const rgb = hexToRgb(primaryColor);

    const tabLabel  = t?.(`performanceAnalyticsPage.tabs.${activeTab}`, cap(activeTab)) || cap(activeTab);
    const rngLabel  = t?.(`performanceAnalyticsPage.dateRanges.${selectedRange}`, selectedRange) || selectedRange;
    const svcLabel  = selectedService==='all'
      ? (t?.('performanceAnalyticsPage.serviceTypes.all','All Services')||'All Services')
      : cap(selectedService);

    const title   = `Performance Analytics – ${tabLabel}`;
    const subtext = `Service: ${svcLabel}  |  Range: ${rngLabel}`;
    const dateStr = new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});

    let pageNum=1;

    const addPage = () => {
      footer(doc);
      doc.addPage();
      pageNum++;
      return header(doc, rgb, title, subtext, dateStr, pageNum, '…');
    };

    let y = header(doc, rgb, title, subtext, dateStr, pageNum, '…');

    if (activeTab==='ratings') {
      y = renderRatings(doc, rgb, {
        summary:   analyticsData.ratingSummary,
        breakdown: analyticsData.ratingsBreakdown,
        byType:    analyticsData.ratingsByType,
      }, y, addPage);
    } else if (activeTab==='operational') {
      y = renderOperational(doc, rgb, {
        summary:        analyticsData.operationalSummary,
        slaByService:   analyticsData.slaByService,
        serviceDetails: analyticsData.serviceDetails,
      }, y, addPage);
    } else if (activeTab==='revenue') {
      y = renderRevenue(doc, rgb, {
        summary:           analyticsData.revenueSummary,
        byCategory:        analyticsData.revenueByCategory,
        internalServices:  analyticsData.internalServices,
        externalProviders: analyticsData.externalProviders,
      }, y, addPage);
    } else if (activeTab==='spending') {
      y = renderSpending(doc, rgb, {
        summary:           analyticsData.spendingSummary,
        servicePopularity:  analyticsData.servicePopularity,
        comprehensive:     analyticsData.comprehensive,
      }, y, addPage);
    }

    footer(doc);

    // Fix page totals in headers
    const totalPages = doc.internal.getNumberOfPages();
    for (let p=1; p<=totalPages; p++) {
      doc.setPage(p);
      doc.setFillColor(...rgb);
      doc.rect(PW-50, 0, 50, 13, 'F');
      doc.setFont('helvetica','normal'); doc.setFontSize(7);
      doc.setTextColor(255,255,255);
      doc.text(`Page ${p} / ${totalPages}`, PW-MX, 10, {align:'right'});
    }

    doc.save(`analytics-${activeTab}-${new Date().toISOString().slice(0,10)}.pdf`);
  } catch(err) {
    console.error('[PDF Export]', err);
    throw err;
  } finally {
    onEnd?.();
  }
};
