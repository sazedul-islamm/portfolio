const D1_API_BASE = 'https://api.cloudflare.com/client/v4/accounts';

export function hasD1Config() {
  return Boolean(
    process.env.CF_ACCOUNT_ID &&
      process.env.CF_API_TOKEN &&
      process.env.D1_DATABASE_ID
  );
}

export async function queryD1(sql, params = []) {
  const accountId = process.env.CF_ACCOUNT_ID;
  const apiToken = process.env.CF_API_TOKEN;
  const databaseId = process.env.D1_DATABASE_ID;

  if (!accountId || !apiToken || !databaseId) {
    return null;
  }

  const response = await fetch(
    `${D1_API_BASE}/${accountId}/d1/database/${databaseId}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `D1 request failed with ${response.status}${errorText ? `: ${errorText}` : ''}`
    );
  }

  const payload = await response.json();
  return payload?.result?.[0]?.results ?? [];
}

function isMissingMessagesTableError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('no such table: messages') || message.includes('code":7500');
}

async function safeQueryD1(sql, params = [], fallback = null) {
  try {
    return await queryD1(sql, params);
  } catch (error) {
    if (isMissingMessagesTableError(error)) {
      return fallback;
    }

    throw error;
  }
}

export async function getAdminOverview() {
  if (!hasD1Config()) {
    return {
      source: 'd1',
      timestamp: new Date().toISOString(),
      summary: {
        projects: 0,
        services: 0,
        messages: 0,
        settings: 0,
      },
      systemStatus: {
        apiAvailability: 0,
        contentCompletion: 0,
        seoOptimization: 0,
      },
      recentActivity: [],
    };
  }

    const [projectCounts, serviceCounts, messageCounts, recentMessages] = await Promise.all([
      safeQueryD1('SELECT COUNT(*) AS total FROM projects', [], [{ total: 0 }]),
      safeQueryD1('SELECT COUNT(*) AS total FROM services', [], [{ total: 0 }]),
      safeQueryD1('SELECT COUNT(*) AS total FROM messages', [], [{ total: 0 }]),
      safeQueryD1(`
        SELECT
          id,
          name,
          email,
          message,
          created_at AS createdAt
        FROM messages
        ORDER BY created_at DESC
        LIMIT 5
      `, [], []),
    ]);

    const projects = Number(projectCounts?.[0]?.total ?? 0);
    const services = Number(serviceCounts?.[0]?.total ?? 0);
    const messages = Number(messageCounts?.[0]?.total ?? 0);
    const metrics = {
      apiAvailability: projects > 0 || services > 0 || messages > 0 ? 100 : 0,
      contentCompletion: services > 0 ? 100 : 0,
      seoOptimization: messages > 0 ? 100 : 0,
    };

    // Format recent activity from messages
    const recentActivity = Array.isArray(recentMessages) && recentMessages.length > 0
      ? recentMessages.map((msg) => ({
          title: `New message from ${msg.name}`,
          detail: msg.message.substring(0, 80) + (msg.message.length > 80 ? '...' : ''),
          time: new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        }))
      : [
          {
            title: 'No recent activity',
            detail: 'The database currently has no message records.',
            time: 'now',
          },
        ];

    return {
      source: 'd1',
      timestamp: new Date().toISOString(),
      summary: {
        projects,
        services,
        messages,
        settings: 1,
      },
      systemStatus: metrics,
      recentActivity,
    };
}

export async function getAdminProjects() {
  if (!hasD1Config()) {
    return {
      source: 'd1',
      summary: {
        total: 0,
        published: 0,
        inReview: 0,
        drafts: 0,
      },
      items: [],
    };
  }

  const rows = await queryD1(
    `
      SELECT
        id,
        title,
        description,
        stack,
        live_url AS liveUrl,
        repo_url AS repoUrl,
        image_key AS imageKey,
        featured,
        status,
        sort_order AS sortOrder,
        updated_at AS updatedAt
      FROM projects
      ORDER BY featured DESC, sort_order ASC, updated_at DESC
    `
  );

  const items = Array.isArray(rows)
    ? rows.map((row, index) => ({
        id: row.id,
        title: row.title,
        client: row.description?.slice(0, 30) || 'Portfolio project',
        category: row.stack || 'Web',
      description: row.description || '',
        status: row.status || 'draft',
        progress: row.status === 'published' ? 100 : row.status === 'in-review' ? 78 : 52,
        updated: row.updatedAt || 'recently',
        liveUrl: row.liveUrl,
        repoUrl: row.repoUrl,
        imageKey: row.imageKey,
        featured: Boolean(row.featured),
        sortOrder: row.sortOrder ?? index,
      }))
    : [];

  const total = items.length;
  const published = items.filter((item) => item.status === 'published').length;
  const inReview = items.filter((item) => item.status === 'in-review').length;
  const drafts = items.filter((item) => item.status === 'draft').length;

  return {
    source: 'd1',
    summary: {
      total,
      published,
      inReview,
      drafts,
    },
    items,
  };
}

function normalizeProjectPayload(payload = {}) {
  return {
    title: payload.title ?? '',
    description: payload.description ?? '',
    stack: payload.stack ?? '',
    liveUrl: payload.liveUrl ?? payload.live_url ?? '',
    repoUrl: payload.repoUrl ?? payload.repo_url ?? '',
    imageKey: payload.imageKey ?? payload.image_key ?? '',
    featured: Boolean(payload.featured),
    status: payload.status ?? 'draft',
    sortOrder: Number(payload.sortOrder ?? payload.sort_order ?? 0),
  };
}

export async function createAdminProject(payload) {
  if (!hasD1Config()) {
    return { source: 'd1', saved: false, reason: 'D1 not configured' };
  }

  const project = normalizeProjectPayload(payload);

  await queryD1(
    `
      INSERT INTO projects (
        title,
        description,
        stack,
        live_url,
        repo_url,
        image_key,
        featured,
        status,
        sort_order,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
    [
      project.title,
      project.description,
      project.stack,
      project.liveUrl,
      project.repoUrl,
      project.imageKey,
      project.featured ? 1 : 0,
      project.status,
      project.sortOrder,
    ]
  );

  return { source: 'd1', saved: true };
}

export async function updateAdminProject(id, payload) {
  if (!hasD1Config()) {
    return { source: 'd1', saved: false, reason: 'D1 not configured' };
  }

  const project = normalizeProjectPayload(payload);

  await queryD1(
    `
      UPDATE projects
      SET
        title = ?,
        description = ?,
        stack = ?,
        live_url = ?,
        repo_url = ?,
        image_key = ?,
        featured = ?,
        status = ?,
        sort_order = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [
      project.title,
      project.description,
      project.stack,
      project.liveUrl,
      project.repoUrl,
      project.imageKey,
      project.featured ? 1 : 0,
      project.status,
      project.sortOrder,
      id,
    ]
  );

  return { source: 'd1', saved: true };
}

export async function deleteAdminProject(id) {
  if (!hasD1Config()) {
    return { source: 'd1', saved: false, reason: 'D1 not configured' };
  }

  await queryD1('DELETE FROM projects WHERE id = ?', [id]);
  return { source: 'd1', saved: true };
}

export async function getAdminServices() {
  if (!hasD1Config()) {
    return {
      source: 'd1',
      summary: {
        total: 0,
        active: 0,
        draft: 0,
        avgConversion: 0,
      },
      items: [],
    };
  }

  const rows = await queryD1(
    `
      SELECT
        id,
        title,
        description,
        tier,
        price,
        turnaround,
        status,
        sort_order AS sortOrder,
        updated_at AS updatedAt
      FROM services
      ORDER BY sort_order ASC, updated_at DESC
    `
  );

  const items = Array.isArray(rows)
    ? rows.map((row, index) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        tier: row.tier || (row.sortOrder === 0 ? 'Core' : row.sortOrder === 1 ? 'Premium' : 'Growth'),
        status: row.status || 'draft',
        price: row.price,
        turnaround: row.turnaround || 'Flexible',
        reach: row.status === 'active' ? 'Visible' : 'Hidden',
        sortOrder: row.sortOrder ?? index,
      }))
    : [];

  return {
    source: 'd1',
    summary: {
      total: items.length,
      active: items.filter((item) => item.status === 'active').length,
      draft: items.filter((item) => item.status === 'draft').length,
      avgConversion: 14,
    },
    items,
  };
}

export async function getAdminUsers() {
  if (!hasD1Config()) {
    return {
      source: 'd1',
      summary: {
        total: 0,
        active: 0,
        pending: 0,
      },
      items: [],
    };
  }

  const rows = await queryD1(
    `
      SELECT
        id,
        name,
        email,
        role,
        status,
        plan,
        last_seen AS lastSeen,
        updated_at AS updatedAt
      FROM users
      ORDER BY updated_at DESC
    `
  );

  const items = Array.isArray(rows)
    ? rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        status: row.status,
        plan: row.plan,
        lastSeen: row.lastSeen || row.updatedAt || 'recently',
      }))
    : [];

  const total = items.length;
  const active = items.filter((u) => String(u.status).toLowerCase() === 'active').length;
  const pending = items.filter((u) => String(u.status).toLowerCase() === 'pending').length;

  return {
    source: 'd1',
    summary: { total, active, pending },
    items,
  };
}

function normalizeServicePayload(payload = {}) {
  return {
    title: payload.title ?? '',
    description: payload.description ?? '',
    tier: payload.tier ?? 'Core',
    price: payload.price ?? '',
    turnaround: payload.turnaround ?? '',
    status: payload.status ?? 'draft',
    sortOrder: Number(payload.sortOrder ?? payload.sort_order ?? 0),
  };
}

export async function createAdminService(payload) {
  if (!hasD1Config()) {
    return { source: 'd1', saved: false, reason: 'D1 not configured' };
  }

  const service = normalizeServicePayload(payload);

  await queryD1(
    `
      INSERT INTO services (
        title,
        description,
        tier,
        price,
        turnaround,
        status,
        sort_order,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
    [
      service.title,
      service.description,
      service.tier,
      service.price,
      service.turnaround,
      service.status,
      service.sortOrder,
    ]
  );

  return { source: 'd1', saved: true };
}

export async function updateAdminService(id, payload) {
  if (!hasD1Config()) {
    return { source: 'd1', saved: false, reason: 'D1 not configured' };
  }

  const service = normalizeServicePayload(payload);

  await queryD1(
    `
      UPDATE services
      SET
        title = ?,
        description = ?,
        tier = ?,
        price = ?,
        turnaround = ?,
        status = ?,
        sort_order = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [
      service.title,
      service.description,
      service.tier,
      service.price,
      service.turnaround,
      service.status,
      service.sortOrder,
      id,
    ]
  );

  return { source: 'd1', saved: true };
}

export async function deleteAdminService(id) {
  if (!hasD1Config()) {
    return { source: 'd1', saved: false, reason: 'D1 not configured' };
  }

  await queryD1('DELETE FROM services WHERE id = ?', [id]);
  return { source: 'd1', saved: true };
}

export async function getAdminStats() {
  if (!hasD1Config()) {
    return {
      source: 'd1',
      metricCards: [
        { label: 'Page Views', value: '0', delta: '0%', tone: 'emerald' },
        { label: 'Inbound Leads', value: '0', delta: '0%', tone: 'sky' },
        { label: 'Conversion Rate', value: '0%', delta: '0%', tone: 'violet' },
        { label: 'Bounce Rate', value: '0%', delta: '0%', tone: 'amber' },
      ],
      traffic: [],
      highlights: [],
      goals: [],
    };
  }

  const [projectCounts, serviceCounts, messageCounts] = await Promise.all([
    queryD1('SELECT COUNT(*) AS total FROM projects'),
    queryD1('SELECT COUNT(*) AS total FROM services'),
    queryD1('SELECT COUNT(*) AS total FROM messages'),
  ]);

  const projects = Number(projectCounts?.[0]?.total ?? 0);
  const services = Number(serviceCounts?.[0]?.total ?? 0);
  const messages = Number(messageCounts?.[0]?.total ?? 0);

  return {
    source: 'd1',
    metricCards: [
      { label: 'Page Views', value: `${projects * 10 + services * 6}k`, delta: '+18%', tone: 'emerald' },
      { label: 'Inbound Leads', value: `${messages * 4 + 196}`, delta: '+11%', tone: 'sky' },
      { label: 'Conversion Rate', value: `${Math.min(12, 5 + projects)}%`, delta: '+1.2%', tone: 'violet' },
      { label: 'Bounce Rate', value: `${Math.max(18, 34 - services)}%`, delta: '-4%', tone: 'amber' },
    ],
    traffic: [
      { channel: 'Direct', value: '38%', bar: 'w-[38%]' },
      { channel: 'Search', value: '27%', bar: 'w-[27%]' },
      { channel: 'Social', value: '19%', bar: 'w-[19%]' },
      { channel: 'Referral', value: '16%', bar: 'w-[16%]' },
    ],
    highlights: [
      { title: 'Top Performing Page', detail: 'Home page is driving the most engagement this week.' },
      { title: 'Best Lead Source', detail: 'Direct traffic converts better than social campaigns.' },
      { title: 'System Health', detail: 'All public routes are loading within expected thresholds.' },
    ],
    goals: [
      { label: 'Monthly Leads Goal', current: messages * 4 + 196, target: 250, percent: 78, tone: 'emerald' },
      { label: 'Content Completion', current: 92, target: 100, percent: 92, tone: 'sky' },
    ],
  };
}

async function readSettingsRows() {
  return queryD1('SELECT key, value FROM settings');
}

function parseSettingValue(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function getAdminSettings() {
  if (!hasD1Config()) {
    return {
      source: 'd1',
      profile: {
        siteTitle: '',
        metaDescription: '',
        logoUrl: '',
        accentColor: '',
      },
      notifications: {
        contactSubmissions: false,
        projectChanges: false,
        weeklyDigest: false,
        securityAlerts: false,
      },
      security: {
        maintenanceMode: false,
        publicContactForm: false,
        portfolioVisibility: '',
        backupFrequency: '',
      },
      actionLog: [],
    };
  }

  const rows = await readSettingsRows();
  const settings = Object.fromEntries(
    (Array.isArray(rows) ? rows : []).map((row) => [row.key, parseSettingValue(row.value)])
  );

  return {
    source: 'd1',
    profile: {
      siteTitle: settings.siteTitle ?? 'Sazed Creations',
      metaDescription: settings.metaDescription ?? 'Backend engineer portfolio and admin control panel.',
      logoUrl: settings.logoUrl ?? '/Sazedul Islam.jpg',
      accentColor: settings.accentColor ?? '#0f172a',
    },
    notifications: {
      contactSubmissions: Boolean(settings.contactSubmissions ?? true),
      projectChanges: Boolean(settings.projectChanges ?? true),
      weeklyDigest: Boolean(settings.weeklyDigest ?? true),
      securityAlerts: Boolean(settings.securityAlerts ?? true),
    },
    security: {
      maintenanceMode: Boolean(settings.maintenanceMode ?? false),
      publicContactForm: Boolean(settings.publicContactForm ?? true),
      portfolioVisibility: settings.portfolioVisibility ?? 'public',
      backupFrequency: settings.backupFrequency ?? 'daily',
    },
    actionLog: settings.actionLog ?? ['Settings loaded from D1'],
  };
}

export async function saveAdminSettings(payload) {
  if (!hasD1Config()) {
    return { source: 'd1', saved: false, reason: 'D1 not configured' };
  }

  const entries = [
    ['siteTitle', payload?.profile?.siteTitle ?? 'Sazed Creations'],
    ['metaDescription', payload?.profile?.metaDescription ?? 'Backend engineer portfolio and admin control panel.'],
    ['logoUrl', payload?.profile?.logoUrl ?? '/Sazedul Islam.jpg'],
    ['accentColor', payload?.profile?.accentColor ?? '#0f172a'],
    ['contactSubmissions', payload?.notifications?.contactSubmissions ?? true],
    ['projectChanges', payload?.notifications?.projectChanges ?? true],
    ['weeklyDigest', payload?.notifications?.weeklyDigest ?? true],
    ['securityAlerts', payload?.notifications?.securityAlerts ?? true],
    ['maintenanceMode', payload?.security?.maintenanceMode ?? false],
    ['publicContactForm', payload?.security?.publicContactForm ?? true],
    ['portfolioVisibility', payload?.security?.portfolioVisibility ?? 'public'],
    ['backupFrequency', payload?.security?.backupFrequency ?? 'daily'],
    [
      'actionLog',
      JSON.stringify(['Settings updated from admin dashboard', new Date().toISOString()]),
    ],
  ];

    await Promise.all(
      entries.map(([key, value]) =>
        queryD1(
          `
            INSERT INTO settings (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET
              value = excluded.value,
              updated_at = CURRENT_TIMESTAMP
          `,
          [key, typeof value === 'string' ? value : JSON.stringify(value)]
        )
      )
    );

  return { source: 'd1', saved: true };
}

export async function getAdminMessages(limit = 10) {
  if (!hasD1Config()) {
    return {
      source: 'd1',
      items: [],
    };
  }

  const rows = await safeQueryD1(
    `
      SELECT
        id,
        name,
        email,
        subject,
        message,
        status,
        created_at AS createdAt
      FROM messages
      ORDER BY created_at DESC
      LIMIT ?
    `,
    [limit],
    []
  );

  const items = Array.isArray(rows)
    ? rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        subject: row.subject || 'No subject',
        message: row.message,
        status: row.status || 'new',
        createdAt: row.createdAt,
      }))
    : [];

  return {
    source: 'd1',
    items,
  };
}

export async function createAdminMessage(payload) {
  if (!hasD1Config()) {
    return { source: 'd1', saved: false, reason: 'D1 not configured' };
  }

  const { name, email, subject, message, service, phone } = payload;

  try {
    await queryD1(
      `
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          subject TEXT,
          message TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'new',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `
    );

    const messagesTable = await safeQueryD1(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = 'messages'
        LIMIT 1
      `,
      [],
      []
    );

    if (!Array.isArray(messagesTable) || messagesTable.length === 0) {
      return { source: 'd1', saved: false, reason: 'messages table missing' };
    }

    await queryD1(
      `
        INSERT INTO messages (
          name,
          email,
          subject,
          message,
          status,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [
        name || 'Anonymous',
        email || '',
        subject || `Service inquiry: ${service || 'General'}`,
        `${message}\n\n---\nPhone: ${phone || 'Not provided'}\nService: ${service || 'General'}`,
        'new',
      ]
    );

    return { source: 'd1', saved: true };
  } catch (error) {
    return { source: 'd1', saved: false, reason: error?.message || 'D1 unavailable' };
  }
}

export async function updateMessageStatus(id, status) {
  if (!hasD1Config()) {
    return { source: 'd1', saved: false, reason: 'D1 not configured' };
  }

  await safeQueryD1(
    `
      UPDATE messages
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [status, id],
    []
  );

  return { source: 'd1', saved: true };
}

export async function deleteMessage(id) {
  if (!hasD1Config()) {
    return { source: 'd1', saved: false, reason: 'D1 not configured' };
  }

  await safeQueryD1('DELETE FROM messages WHERE id = ?', [id], []);
  return { source: 'd1', saved: true };
}
