/* eslint-disable @typescript-eslint/no-require-imports -- This existing .cjs test harness intentionally uses CommonJS and isolated VM imports. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cp = require('node:child_process');
const ts = require('../node_modules/typescript');
const root = path.resolve(__dirname, '..');
function deepEqual(actual, expected, message) { assert.deepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)), message); }
const baseline = 'bb175335b97d86edc12c1b44c4fd871b75936aeb';
class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : ['2026-10-13T12:00:00Z'])); }
  static now() { return Date.parse('2026-10-13T12:00:00Z'); }
}
const routePaths = [
  'company/route.ts', 'company/logo/route.ts', 'klant/company/route.ts', 'klant/offertes/[id]/route.ts',
  'admin/diensten/route.ts', 'admin/voertuigen/route.ts',
  'quotes/[id]/accept/route.ts', 'quotes/[id]/reject/route.ts', 'quotes/[id]/payment/route.ts', 'quotes/[id]/workflow/route.ts',
  'pdf/quote/[id]/route.ts', 'pdf/invoice/[id]/route.ts',
  'appointments/route.ts', 'appointments/[id]/move/route.ts', 'appointments/ics/route.ts',
  'invoices/route.ts', 'invoices/[id]/credit/route.ts', 'invoices/[id]/paid/route.ts', 'invoices/[id]/send/route.ts',
  'receipts/route.ts', 'receipts/[id]/download/route.ts', 'accounting/quarter/route.ts', 'boekhouding/export/route.ts', 'expenses/export/route.ts',
  'business-units/[id]/route.ts', 'vehicles/route.ts', 'vehicles/assign/route.ts', 'mileage/route.ts', 'mileage/export/route.ts',
  'mileage/[id]/approve/route.ts', 'search/route.ts', 'notifications/route.ts', 'notifications/[id]/read/route.ts',
].map(p => 'src/app/api/' + p);
class Redirect extends Error { constructor(destination) { super(destination); this.destination = destination; } }
class MockResponse {
  constructor(body, options = {}) { this.body = body; this.status = options.status || 200; }
  static json(body, options) { return new MockResponse(body, options); }
  static redirect(url) { return new MockResponse({ location: url }, { status: 307 }); }
}
// MOCK VERIFIED only: no real cookies, tokens, Auth, RLS, Storage or provider traffic.
// Unknown imports, transports, RPCs and writes throw instead of silently succeeding.
function gitSource(relative) {
  return cp.execFileSync('git', ['-c', 'safe.directory=' + root.replaceAll('\\', '/'), '-C', root,
    'show', baseline + ':' + relative], { encoding: 'utf8', maxBuffer: 2e6, stdio: ['ignore', 'pipe', 'pipe'] });
}
const baselineSources = new Map();
function context(options = {}) {
  const identity = { id: options.userId || 'U' };
  const state = {
    user: options.anonymous || options.session === 'new' ? null : identity,
    tokens: [{ id: 'current', valid: options.session !== 'new' }, { id: 'other', valid: true }],
    profile: options.missing ? null : { id: identity.id, role: options.role || 'admin', company_id: options.companyId || 'A', active: Object.hasOwn(options, 'active') ? options.active : true },
    profileError: options.error || null, thrownQuery: options.thrownQuery,
    tables: JSON.parse(JSON.stringify(options.tables || {})), services: options.services || {},
    reads: [], profileReads: [], writes: [], calls: [], rpcs: [], storage: [], bodies: 0, signouts: [], redirects: [], signins: 0,
    unexpected: [],
  };
  function forbidden(message) { state.unexpected.push(message); throw Error(message); }
  const client = {
    auth: {
      getUser: async () => ({ data: { user: state.tokens[0].valid ? state.user : null }, error: null }),
      signInWithPassword: async () => {
        state.signins++;
        if (!options.authError) { state.user = identity; state.tokens[0].valid = true; }
        return { data: { user: options.authError ? null : state.user }, error: options.authError || null };
      },
      signOut: async value => {
        state.signouts.push(value);
        if (options.logoutThrows) throw Error('Synthetic logout failure');
        if (!options.logoutError) {
          state.tokens[0].valid = false;
          if (value?.scope !== 'local') state.tokens[1].valid = false;
        }
        return { error: options.logoutError || null };
      },
    },
    rpc: (name, args) => {
      if (!options.rpcs || !(name in options.rpcs)) return forbidden('Unexpected RPC: ' + name);
      state.rpcs.push({ name, args });
      const result = Promise.resolve().then(() => options.rpcs[name](args, state)); result.single = () => result; return result;
    },
    storage: { from(bucket) { return {
      upload: async (key, bytes, settings) => {
        if (!options.allowStorage) return forbidden('Unexpected storage upload');
        state.storage.push({ bucket, key, bytes: Buffer.from(bytes).toString(), settings }); return { error: null };
      },
      getPublicUrl: key => ({ data: { publicUrl: 'https://example.invalid/' + bucket + '/' + key } }),
    }; } },
    from(table) {
      const filters = []; let selection, operation, value;
      const q = {
        select(v) { selection = v; return q; },
        eq(key, v) { filters.push([key, v]); return q; },
        in(key, v) { filters.push([key, v, 'in']); return q; },
        order() { return q; }, limit() { return q; },
        single() { return result(false); }, maybeSingle() { return result(false); },
        then(resolve, reject) { return result(true).then(resolve, reject); },
        update(v) { operation = 'update'; value = v; return q; },
        insert(v) { operation = 'insert'; value = v; return q; },
        upsert(v) { operation = 'upsert'; value = v; return q; },
        delete() { operation = 'delete'; return q; },
      };
      async function result(many) {
        const matches = row => filters.every(([key, v, operator]) => operator === 'in' ? v.includes(row[key]) : row[key] === v);
        if (operation) {
          if (!options.allowWrites) return forbidden('Unexpected database write: ' + table);
          state.writes.push({ table, operation, value, filters: [...filters] });
          let rows = table === 'profiles' ? [state.profile].filter(Boolean) : (state.tables[table] || []);
          if (operation === 'insert' || operation === 'upsert') {
            const entries = (Array.isArray(value) ? value : [value]).map(v => ({ id: 'Q', ...v }));
            rows = rows.concat(entries); state.tables[table] = rows;
            return { data: many ? entries : entries[0], error: null };
          }
          const affected = rows.filter(matches);
          if (operation === 'update') affected.forEach(row => Object.assign(row, value));
          return { data: many ? affected : affected[0] || null, error: null };
        }
        if (table === 'profiles') {
          state.profileReads.push({ selection, filters: [...filters] });
          if (state.thrownQuery) throw Error('Synthetic database failure');
          return { data: state.profile && matches(state.profile) ? state.profile : null, error: state.profileError };
        }
        state.reads.push({ table, selection, filters: [...filters] });
        const rows = (state.tables[table] || []).filter(matches);
        return { data: many ? rows : rows[0] || null, error: null };
      }
      return q;
    },
  };
  const cache = new Map();
  function load(relative, original = false) {
    const key = original + ':' + relative;
    if (cache.has(key)) return cache.get(key);
    const loadedModule = { exports: {} }; cache.set(key, loadedModule.exports);
    if (original && !baselineSources.has(relative)) baselineSources.set(relative, gitSource(relative));
    const source = original ? baselineSources.get(relative) : fs.readFileSync(path.join(root, relative), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const imports = name => {
      if (name === 'next/server') return { NextResponse: MockResponse };
      if (name === 'next/navigation') return { redirect: destination => { state.redirects.push(destination); throw new Redirect(destination); } };
      if (name === 'next/cache') return { revalidatePath: () => {} };
      if (name === '@/lib/supabase/server') return { createClient: async () => client, createServiceClient: () => client };
      if (options.realEmail && name === '@/lib/email/client') return load('src/lib/email/client.ts', original);
      if (name === 'node:crypto') return require('node:crypto');
      if (['@/lib/auth/apiAuth', '@/lib/auth/requireAdmin', '@/lib/auth/getCompanyId', '@/lib/services/crm/quoteCreateIntent', '@/lib/services/workflow/quoteWorkflowTypes'].includes(name)) return load('src/' + name.slice(2) + '.ts', original);
      if (options.realQuotes && ['@/lib/services/crm/quotes', '@/lib/services/crm/sendQuoteToClient'].includes(name)) return load('src/' + name.slice(2) + '.ts', original);
      if (name === '@/lib/services/crm/sendQuoteToClient') return { QuoteSendError: class extends Error {}, sendQuoteToClient: (...args) => invoke('sendQuoteToClient', args) };
      return new Proxy({}, { get(_, key) {
        if (key === '__esModule') return true;
        if (Object.hasOwn(state.services, key) && typeof state.services[key] !== 'function') return state.services[key];
        return (...args) => invoke(key, args, name);
      } });
    };
    function invoke(name, args, moduleName = '') {
      if (!Object.hasOwn(state.services, name)) return forbidden('Unexpected service invocation: ' + moduleName + '.' + String(name));
      state.calls.push({ name, args }); return state.services[name](...args);
    }
    vm.runInNewContext(code, {
      exports: loadedModule.exports, require: imports, console, Date: FixedDate, Object, Promise, Buffer, URL, URLSearchParams,
      AbortSignal, fetch: (...args) => options.mockFetch ? options.mockFetch(...args) : forbidden('Network forbidden in local tests'), process: { env: options.env || {} },
    }, { filename: (original ? 'baseline/' : '') + relative });
    return loadedModule.exports;
  }
  function request(body = options.body) {
    return {
      nextUrl: new URL(options.url || 'https://example.invalid/api?id=Q&q=synthetic'),
      headers: { get: name => options.headers?.[name] || null },
      json: async () => { state.bodies++; if (body === undefined) return forbidden('Unexpected request body parsing'); return body; },
      formData: async () => { state.bodies++; if (!options.form) return forbidden('Unexpected upload parsing'); return { get: key => options.form[key] ?? null }; },
    };
  }
  return { state, client, load, request };
}
for (const role of ['admin', 'employee', 'customer']) {
  for (const session of ['new', 'existing']) {
    test(role + ' active/inactive guards with ' + session + ' valid session', async () => {
      const c = context({ role, session });
      if (session === 'new') await c.client.auth.signInWithPassword();
      assert.equal(c.state.signins, session === 'new' ? 1 : 0);
      const api = c.load('src/lib/auth/apiAuth.ts');
      const guards = c.load('src/lib/auth/requireAdmin.ts');
      const company = c.load('src/lib/auth/getCompanyId.ts');
      const guard = { admin: 'requireAdmin', employee: 'requireEmployee', customer: 'requireCustomer' }[role];
      assert.equal((await api.getApiIdentity([role])).identity.role, role);
      assert.equal((await guards[guard]()).profile.role, role);
      assert.equal(await company.getCompanyId(), 'A');
      c.state.profile.active = false;
      assert.equal(await api.isActiveProfile('U'), false);
      assert.equal((await api.getApiIdentity([role])).status, 403);
      await assert.rejects(guards[guard](), e => e instanceof Redirect && e.destination === '/login');
      await assert.rejects(company.getCompanyId());
      assert.equal(c.state.reads.length, 0); assert.equal(c.state.writes.length, 0);
    });
  }
  test(role + ' login accepts active and rejects inactive locally', async () => {
    const c = context({ role }); const login = c.load('src/app/login/actions.ts');
    const form = { get: key => key === 'email' ? 'synthetic@example.invalid' : key === 'password' ? 'SYNTHETIC' : null };
    const destination = { admin: '/admin', employee: '/medewerker', customer: '/klant' }[role];
    await assert.rejects(login.loginAction(form), e => e instanceof Redirect && e.destination === destination);
    assert.equal(c.state.signouts.length, 0);
    c.state.profile.active = false;
    const refused = await login.loginAction(form);
    assert.equal(typeof refused.error, 'string');
    assert.equal(c.state.signouts.length, 1); assert.equal(c.state.signouts[0].scope, 'local');
    assert.equal(c.state.redirects.length, 1);
  });
}
for (const options of [{ missing: true }, { error: { message: 'synthetic error' } }, { active: null }]) {
  test('missing/error/nontrue profile refuses private access ' + JSON.stringify(options), async () => {
    const c = context(options); if ('active' in options) c.state.profile.active = options.active;
    const api = c.load('src/lib/auth/apiAuth.ts');
    assert.equal(await api.isActiveProfile('U'), false);
    assert.equal((await api.getApiIdentity(['admin'])).status, 403);
    await assert.rejects(c.load('src/lib/auth/requireAdmin.ts').requireAdmin(), e => e instanceof Redirect);
    await assert.rejects(c.load('src/lib/auth/getCompanyId.ts').getCompanyId());
  });
}
test('thrown profile query fails closed', async () => {
  const c = context({ thrownQuery: true }); assert.equal(await c.load('src/lib/auth/apiAuth.ts').isActiveProfile('U'), false);
});
test('anonymous and wrong role stay refused', async () => {
  const anon = context({ anonymous: true }); assert.equal((await anon.load('src/lib/auth/apiAuth.ts').getApiIdentity(['admin'])).status, 401);
  const customer = context({ role: 'customer' }); assert.equal((await customer.load('src/lib/auth/apiAuth.ts').getApiIdentity(['admin'])).status, 403);
  await assert.rejects(customer.load('src/lib/auth/requireAdmin.ts').requireAdmin(), e => e.destination === '/klant');
});
for (const file of routePaths) {
  const methods = [...fs.readFileSync(path.join(root, file), 'utf8').matchAll(/export async function (GET|POST|PATCH|DELETE|PUT)\b/g)].map(m => m[1]);
  for (const method of methods) {
    for (const role of ['admin', 'employee', 'customer']) {
    for (const options of [{ active: false }, { missing: true }, { error: { message: 'synthetic' } }, { thrownQuery: true }]) {
      test('NEGATIVE ' + role + ' ' + file + ' ' + method + ' blocks before private work ' + JSON.stringify(options), async () => {
        const c = context({ ...options, role }); const result = await c.load(file)[method](c.request(), { params: Promise.resolve({ id: 'Q' }) });
        assert.ok([401, 403].includes(result.status));
        assert.equal(c.state.reads.length, 0); assert.equal(c.state.writes.length, 0); assert.equal(c.state.bodies, 0);
      });
    }
  }
}
}

test('active admin company PATCH retains response and business invocation', async () => {
  let updates = 0;
  const c = context({ services: { updateCompany: async () => { updates++; return { error: null }; } } });
  const result = await c.load('src/app/api/company/route.ts').PATCH({ json: async () => ({ name: 'synthetic' }) });
  assert.equal(result.status, 200); assert.equal(result.body.ok, true); assert.equal(updates, 1);
});
test('active employee/customer cannot enter admin company PATCH', async () => {
  for (const role of ['employee', 'customer']) {
    const c = context({ role }); const result = await c.load('src/app/api/company/route.ts').PATCH(c.request());
    assert.equal(result.status, 401); assert.equal(c.state.bodies, 0);
  }
});
test('active customer detail still enforces client ownership', async () => {
  for (const clientId of ['C', 'OTHER']) {
    const c = context({ role: 'customer', tables: { clients: [{ id: 'C', profile_id: 'U' }], quotes: [{ id: 'Q', client_id: clientId, status: 'sent' }] } });
    const result = await c.load('src/app/api/klant/offertes/[id]/route.ts').GET(c.request(), { params: Promise.resolve({ id: 'Q' }) });
    assert.equal(result.status, clientId === 'C' ? 200 : 404);
  }
});
test('active quote acceptance still blocks another company or customer', async () => {
  for (const fixture of [{ company_id: 'B', profile_id: 'U' }, { company_id: 'A', profile_id: 'OTHER' }]) {
    const c = context({ role: 'customer', tables: { quotes: [{ id: 'Q', company_id: fixture.company_id, client_id: 'C', status: 'sent', workflow_state: 'verzonden' }], clients: [{ id: 'C', company_id: 'A', profile_id: fixture.profile_id }] } });
    const result = await c.load('src/app/api/quotes/[id]/accept/route.ts').POST(c.request(), { params: Promise.resolve({ id: 'Q' }) });
    assert.equal(result.status, fixture.company_id === 'B' ? 404 : 403); assert.equal(c.state.writes.length, 0);
  }
});
test('setup Server Action is blocked before any private write', async () => {
  const c = context({ active: false });
  await assert.rejects(c.load('src/app/(portal)/admin/setup/actions.ts').markStepComplete('company'), e => e instanceof Redirect);
  assert.equal(c.state.writes.length, 0);
});
test('all files outside the approved repair retain baseline content', () => {
  const git = args => cp.execFileSync('git', ['-c', 'safe.directory=' + root.replaceAll('\\', '/'), '-c', 'core.safecrlf=false', '-C', root, ...args], { encoding: 'utf8', maxBuffer: 30e6, stdio: ['ignore', 'pipe', 'pipe'] });
  const allowed = new Set([...routePaths, 'src/lib/auth/apiAuth.ts', 'src/lib/auth/requireAdmin.ts', 'src/lib/auth/getCompanyId.ts', 'src/app/login/actions.ts']);
  const tracked = git(['ls-files', 'src', 'supabase', 'package.json', 'package-lock.json', 'next.config.ts', 'tsconfig.json', 'eslint.config.mjs']).trim().split('\n');
  const normalize = value => value.replace(/\r\n/g, '\n');
  for (const file of tracked) {
    if (!allowed.has(file)) assert.equal(normalize(fs.readFileSync(path.join(root, file), 'utf8')), normalize(git(['show', '5759959e712a17e8c146c6bb36ae967577f41e23:' + file])), file);
  }
});

// Explicit route contracts: permissions here describe the existing route boundary;
// mocked service calls do not prove the service's live RLS or database constraints.
const roles = ['admin', 'employee', 'customer'];
const routes = [
  ['company', 'GET', ['admin'], ['getCompany']],
  ['company', 'PATCH', ['admin'], ['updateCompany']],
  ['company/logo', 'POST', ['admin'], [], 200, ['companies']],
  ['klant/company', 'GET', roles, [], 200, [], ['companies']],
  ['klant/offertes/[id]', 'GET', roles, [], 200, [], ['clients', 'quotes']],
  ['admin/diensten', 'POST', ['admin'], [], 200, ['services']],
  ['admin/diensten', 'PATCH', ['admin'], [], 200, ['services']],
  ['admin/voertuigen', 'POST', ['admin'], [], 200, ['vehicles']],
  ['quotes/[id]/accept', 'POST', ['admin', 'customer'], ['acceptQuote'], 200, [], ['quotes', 'clients']],
  ['quotes/[id]/reject', 'POST', roles, ['rejectQuote']],
  ['quotes/[id]/payment', 'POST', ['admin'], ['markPaymentReceived'], 200, [], ['quotes', 'clients']],
  ['quotes/[id]/workflow', 'POST', ['admin', 'customer'], ['transitionQuote'], 200, [], ['quotes', 'clients']],
  ['pdf/quote/[id]', 'GET', ['admin', 'customer'], ['getCompany', 'createElement', 'renderToBuffer'], 200, [], ['quotes', 'clients']],
  ['pdf/invoice/[id]', 'GET', ['admin', 'customer'], ['getInvoiceFull', 'getCompany', 'createElement', 'renderToBuffer']],
  ['appointments', 'POST', ['admin'], ['createAppointment'], 201],
  ['appointments/[id]/move', 'PATCH', ['admin'], ['moveAppointment']],
  ['appointments/ics', 'GET', roles, ['appointmentToIcs'], 200, [], ['appointments']],
  ['invoices', 'POST', ['admin'], ['createInvoice'], 201],
  ['invoices/[id]/credit', 'POST', ['admin'], ['createCreditInvoice']],
  ['invoices/[id]/paid', 'POST', ['admin'], ['markInvoicePaid']],
  ['invoices/[id]/send', 'POST', ['admin'], ['sendInvoice']],
  ['receipts', 'GET', ['admin', 'employee'], ['listReceipts']],
  ['receipts', 'POST', ['admin', 'employee'], ['uploadReceipt'], 201],
  ['receipts/[id]/download', 'GET', roles, ['getReceiptSignedUrl'], 307, [], ['receipts']],
  ['accounting/quarter', 'GET', ['admin'], ['getQuarterStats']],
  ['accounting/quarter', 'POST', ['admin'], ['closeQuarter']],
  ['boekhouding/export', 'GET', ['admin'], [], 200, [], ['quotes']],
  ['expenses/export', 'GET', ['admin'], ['getExpenses']],
  ['business-units/[id]', 'PATCH', ['admin'], ['updateBusinessUnit']],
  ['vehicles', 'GET', roles, ['getVehicles']],
  ['vehicles/assign', 'GET', roles, ['getAssignmentsForDate']],
  ['vehicles/assign', 'POST', ['admin'], ['upsertAssignment']],
  ['vehicles/assign', 'DELETE', ['admin'], ['deleteAssignment']],
  ['mileage', 'GET', ['admin', 'employee'], ['getMileageLogs']],
  ['mileage', 'POST', ['admin', 'employee'], ['logMileage'], 201],
  ['mileage/export', 'GET', ['admin'], ['getMileageLogs']],
  ['mileage/[id]/approve', 'POST', ['admin'], ['approveMileage']],
  ['search', 'GET', roles, ['globalSearch']],
  ['notifications', 'GET', roles, [], 200, [], ['notifications']],
  ['notifications/[id]/read', 'POST', roles, [], 200, ['notifications']],
];
const syntheticCompany = { id: 'A', name: 'SYNTHETIC COMPANY', iban: 'SYNTHETIC', email: 'company@example.invalid' };
const syntheticFile = { type: 'image/png', size: 9, arrayBuffer: async () => Buffer.from('SYNTHETIC') };
function fixture(entry, role) {
  const [route, method, , calls, status = 200] = entry;
  const quote = { id: 'Q', company_id: 'A', client_id: 'C', quote_number: 'SYN-Q', status: 'sent', workflow_state: 'verzonden', total: 121, quote_items: [], clients: { contact_name: 'SYNTHETIC' } };
  if (route === 'boekhouding/export') Object.assign(quote, { workflow_state: 'betaald', subtotal: 100, vat_amount: 21, discount_pct: 0 });
  const tables = {
    companies: [syntheticCompany], clients: [{ id: 'C', company_id: 'A', profile_id: 'U', contact_name: 'SYNTHETIC', email: 'client@example.invalid' }],
    quotes: [quote], appointments: [{ id: 'Q', scheduled_date: '2026-10-13', clients: { contact_name: 'SYNTHETIC' } }],
    receipts: [{ id: 'Q', file_path: 'A/SYNTHETIC', uploaded_by: 'U' }],
    notifications: [{ id: 'Q', recipient_id: 'U', title: 'SYNTHETIC' }, { id: 'OTHER', recipient_id: 'OTHER', title: 'PRIVATE OTHER' }],
    services: [{ id: 'Q', company_id: 'A' }], vehicles: [{ id: 'Q', company_id: 'A' }],
  };
  const body = { id: 'Q', name: 'SYNTHETIC', license_plate: 'SYN TEST', employeeId: 'U', vehicleId: 'Q', date: '2026-10-13', to: 'akkoord', scheduled_date: '2026-10-13', scheduled_start: '09:00', scheduled_end: '10:00', action: 'close', year: 2026, quarter: 4 };
  const form = { file: syntheticFile, amount: '100', vatPct: '21', receiptDate: '2026-10-13', category: 'overig' };
  const services = {
    getCompany: async () => syntheticCompany, updateCompany: async () => ({ error: null }),
    acceptQuote: async () => true, rejectQuote: async () => undefined, markPaymentReceived: async () => true,
    transitionQuote: async () => ({ error: null }),
    getInvoiceFull: async () => ({ id: 'Q', invoice_number: 'SYN-I', type: 'invoice', client: { id: 'C' } }),
    QuotePdf: () => undefined, InvoicePdf: () => undefined,
    createElement: (component, props) => ({ component: typeof component, props }), renderToBuffer: async () => Buffer.from('SYNTHETIC PDF'),
    createAppointment: async () => ({ id: 'Q', error: null }), moveAppointment: async () => ({ error: null }),
    appointmentToIcs: () => 'BEGIN:VCALENDAR\nSYNTHETIC\nEND:VCALENDAR',
    createInvoice: async () => ({ id: 'Q', error: null }), createCreditInvoice: async () => ({ id: 'Q', error: null }),
    markInvoicePaid: async () => ({ error: null }), sendInvoice: async () => ({ error: null }),
    listReceipts: async () => [{ id: 'Q', supplier: 'SYNTHETIC' }], uploadReceipt: async () => ({ id: 'Q', error: null }),
    getReceiptSignedUrl: async () => 'https://example.invalid/SYNTHETIC', getQuarterStats: async () => ({ count: 1, synthetic: true }),
    closeQuarter: async () => ({ error: null }), getExpenses: async () => [], EXPENSE_TYPE_LABEL: {},
    updateBusinessUnit: async () => ({ error: null }), getVehicles: async () => [{ id: 'Q', name: 'SYNTHETIC' }],
    getAssignmentsForDate: async () => [{ id: 'Q', employee_id: 'U' }], upsertAssignment: async () => ({ error: null }), deleteAssignment: async () => ({ error: null }),
    getMileageLogs: async () => [], logMileage: async () => ({ id: 'Q', error: null }), approveMileage: async () => ({ error: null }),
    globalSearch: async () => [{ id: 'Q', title: 'SYNTHETIC' }],
  };
  // Every expected service is supplied deliberately; unspecified imports remain fatal.
  const selected = Object.fromEntries([...calls, 'QuotePdf', 'InvoicePdf', 'EXPENSE_TYPE_LABEL'].map(key => [key, services[key]]));
  return { role, tables, body, form, services: selected, allowWrites: true, allowStorage: route === 'company/logo', expectedStatus: status, route, method };
}
function snapshot(response, c) {
  deepEqual(c.state.unexpected, [], 'No swallowed mock errors');
  return JSON.parse(JSON.stringify({ status: response.status, body: response.body, reads: c.state.reads, writes: c.state.writes, calls: c.state.calls, storage: c.state.storage }));
}
function verifyBusiness(entry, c, response, options) {
  const [route, method, , calls, status = 200, writes = [], reads = []] = entry;
  assert.equal(response.status, status);
  deepEqual(c.state.calls.map(call => call.name), calls);
  deepEqual(c.state.writes.map(write => write.table), writes);
  const expectedReads = route === 'pdf/invoice/[id]' && options.role === 'customer' ? ['clients'] : reads;
  deepEqual(c.state.reads.map(read => read.table), expectedReads);
  for (const read of c.state.profileReads) deepEqual(read.filters, [['id', 'U']], 'Profile query must target authenticated user');
  for (const write of c.state.writes) {
    if (write.operation === 'insert') assert.equal(write.value.company_id, 'A');
    if (route === 'admin/diensten' && method === 'PATCH') assert.ok(write.filters.some(([key, value]) => key === 'company_id' && value === 'A'));
    if (route === 'notifications/[id]/read') deepEqual(write.filters, [['id', 'Q'], ['recipient_id', 'U']]);
  }
  if (route === 'company' && method === 'GET') deepEqual(response.body, syntheticCompany);
  else if (route === 'company/logo') { assert.equal(c.state.storage.length, 1); assert.equal(c.state.storage[0].key, 'A/logo.png'); assert.match(response.body.url, /example.invalid\/company-assets\/A\/logo.png\?t=/); }
  else if (route === 'klant/company') assert.equal(response.body.id, 'A');
  else if (route === 'klant/offertes/[id]') assert.equal(response.body.quote_number, 'SYN-Q');
  else if (route.startsWith('pdf/')) assert.equal(Buffer.from(response.body).toString(), 'SYNTHETIC PDF');
  else if (route === 'appointments/ics') assert.match(response.body, /BEGIN:VCALENDAR/);
  else if (route === 'receipts/[id]/download') deepEqual(response.body, { location: 'https://example.invalid/SYNTHETIC' });
  else if (route === 'boekhouding/export') { assert.match(response.body, /SYN-Q/); assert.doesNotMatch(response.body, /PRIVATE OTHER/); }
  else if (route === 'expenses/export') assert.match(response.body, /Omschrijving/);
  else if (route === 'mileage/export') assert.match(response.body, /Kil|Begin km/);
  else if (route === 'notifications') { assert.equal(response.body.length, 1); assert.equal(response.body[0].recipient_id, 'U'); }
  else if (route === 'search') deepEqual(JSON.parse(JSON.stringify(response.body)), { results: [{ id: 'Q', title: 'SYNTHETIC' }] });
  else if (route === 'accounting/quarter' && method === 'GET') deepEqual(response.body, { count: 1, synthetic: true });
  else if (['vehicles', 'vehicles/assign', 'mileage', 'receipts'].includes(route) && method === 'GET') assert.ok(Array.isArray(response.body));
  else if (['admin/diensten', 'admin/voertuigen', 'appointments', 'invoices', 'invoices/[id]/credit', 'receipts', 'mileage'].includes(route) && method === 'POST') assert.equal(response.body.id, 'Q');
  else assert.equal(response.body.ok, true);
  const argumentsByName = {
    getCompany: [], updateCompany: [options.body], acceptQuote: ['Q', 'A', 'C'], rejectQuote: ['Q'], markPaymentReceived: ['Q', 'A', 'C'],
    transitionQuote: ['Q', 'akkoord', 'U', 'A', 'C'], getInvoiceFull: ['Q'], moveAppointment: ['Q', '2026-10-13', '09:00', '10:00'],
    createInvoice: [{ ...options.body, actorId: 'U' }], createCreditInvoice: ['Q', 'U'], markInvoicePaid: ['Q', 'U'], sendInvoice: ['Q', 'U'],
    listReceipts: [undefined, undefined], getReceiptSignedUrl: ['A/SYNTHETIC'], getQuarterStats: [2026, 4], closeQuarter: [2026, 4, 'U'],
    getVehicles: [], getAssignmentsForDate: ['2026-10-13'], upsertAssignment: ['U', 'Q', '2026-10-13'], deleteAssignment: ['U', '2026-10-13'],
    approveMileage: ['Q', 'U'], globalSearch: ['synthetic', 'A'], updateBusinessUnit: ['Q', options.body],
    createAppointment: [{ ...options.body, company_id: 'A', created_by: 'U' }], logMileage: [options.body, 'U'],
  };
  for (const call of c.state.calls) if (Object.hasOwn(argumentsByName, call.name)) assert.equal(JSON.stringify(call.args), JSON.stringify(argumentsByName[call.name]), call.name + ' arguments');
  if (route === 'mileage' && method === 'GET' && options.role === 'employee') assert.equal(c.state.calls[0].args[0].employeeId, 'U');
  deepEqual(c.state.unexpected, []);
}
for (const entry of routes) {
  const [route, method, allowed] = entry; const file = 'src/app/api/' + route + '/route.ts';
  for (const role of roles) {
    if (allowed.includes(role)) test('POSITIVE MOCK VERIFIED ' + role + ' ' + method + ' ' + route + ' independent baseline', async () => {
      const options = fixture(entry, role); const before = context(options), after = context(options);
      const oldResponse = await before.load(file, true)[method](before.request(), { params: Promise.resolve({ id: 'Q' }) });
      const newResponse = await after.load(file)[method](after.request(), { params: Promise.resolve({ id: 'Q' }) });
      verifyBusiness(entry, before, oldResponse, options); verifyBusiness(entry, after, newResponse, options);
      deepEqual(snapshot(newResponse, after), snapshot(oldResponse, before));
    });
    else test('NEGATIVE wrong role ' + role + ' ' + method + ' ' + route, async () => {
      const c = context(fixture(entry, role)), before = context(fixture(entry, role));
      const oldResponse = await before.load(file, true)[method](before.request(), { params: Promise.resolve({ id: 'Q' }) });
      const result = await c.load(file)[method](c.request(), { params: Promise.resolve({ id: 'Q' }) });
      deepEqual(snapshot(result, c), snapshot(oldResponse, before));
      assert.equal(result.status, route === 'company' ? 401 : 403); assert.equal(c.state.calls.length, 0); assert.equal(c.state.writes.length, 0); deepEqual(c.state.unexpected, []);
    });
  }
}
test('independent baseline helper really differs for an inactive account', async () => {
  const old = context({ active: false }), current = context({ active: false });
  assert.equal(await old.load('src/lib/auth/getCompanyId.ts', true).getCompanyId(), 'A');
  await assert.rejects(current.load('src/lib/auth/getCompanyId.ts').getCompanyId());
});
for (const role of roles) for (const failure of ['inactive', 'missing', 'error', 'throw']) {
  test('NEGATIVE guards ' + role + ' ' + failure, async () => {
    const c = context({ role, active: failure !== 'inactive', missing: failure === 'missing', error: failure === 'error' ? { message: 'synthetic' } : null, thrownQuery: failure === 'throw' });
    const api = c.load('src/lib/auth/apiAuth.ts'); assert.equal(await api.isActiveProfile('U'), false);
    if (failure === 'throw') await assert.rejects(api.getApiIdentity([role]), /Synthetic database failure/);
    else assert.equal((await api.getApiIdentity([role])).status, 403);
    const guards = c.load('src/lib/auth/requireAdmin.ts');
    for (const name of ['requireAdmin', 'requireEmployee', 'requireCustomer']) await assert.rejects(guards[name](), failure === 'throw' ? /Synthetic database failure/ : e => e instanceof Redirect && e.destination === '/login');
    await assert.rejects(c.load('src/lib/auth/getCompanyId.ts').getCompanyId());
    assert.equal(c.state.reads.length, 0); assert.equal(c.state.writes.length, 0);
  });
}
for (const role of roles) for (const logout of ['success', 'error', 'throw']) for (const failure of ['inactive', 'missing', 'error']) {
  test('NEGATIVE MOCK VERIFIED new session login ' + role + ' ' + failure + ' logout ' + logout, async () => {
    const c = context({ role, session: 'new', active: failure !== 'inactive', missing: failure === 'missing', error: failure === 'error' ? { message: 'synthetic' } : null, logoutError: logout === 'error' ? { message: 'synthetic logout error' } : null, logoutThrows: logout === 'throw' });
    assert.equal((await c.client.auth.getUser()).data.user, null);
    const response = await c.load('src/app/login/actions.ts').loginAction({ get: () => 'synthetic' });
    assert.equal(typeof response.error, 'string'); assert.equal(c.state.signins, 1); deepEqual(c.state.signouts, [{ scope: 'local' }]);
    assert.equal(c.state.tokens[1].valid, true, 'Other mock session remains valid');
    assert.equal(c.state.tokens[0].valid, logout !== 'success', 'Logout failure does not pretend token deletion');
    assert.equal(c.state.redirects.length, 0);
    if (logout !== 'success') assert.equal((await c.load('src/lib/auth/apiAuth.ts').getApiIdentity([role])).status, 403, 'Still-valid mock token cannot bypass profile gate');
    assert.equal(c.state.reads.length, 0); assert.equal(c.state.writes.length, 0);
  });
}
const setupFile = 'src/app/(portal)/admin/setup/actions.ts';
const setupCases = [
  ['markStepComplete', ['company'], ['setup_state']], ['completeSetup', [], ['companies']],
  ['saveCompanyInfo', [{ get: key => key === 'name' ? 'SYNTHETIC COMPANY' : null }], ['companies', 'profiles', 'setup_state']],
  ['importServices', [[{ name: 'SYNTHETIC', description: 'SYNTHETIC', category: 'overig', unit: 'vast', default_price: 100, vat_rate: 21, sort_order: 1 }]], ['services', 'setup_state']],
  ['skipStep', ['company'], ['setup_state']],
];
for (const [name, args, writes] of setupCases) {
  test('POSITIVE MOCK VERIFIED admin setup ' + name, async () => {
    const c = context({ allowWrites: true });
    if (name === 'completeSetup') await assert.rejects(c.load(setupFile)[name](...args), e => e instanceof Redirect && e.destination === '/admin');
    else { const result = await c.load(setupFile)[name](...args); if (result) assert.equal(result.error, null); }
    deepEqual(c.state.writes.map(write => write.table), writes);
    for (const write of c.state.writes) if (write.table !== 'profiles') assert.equal((Array.isArray(write.value) ? write.value[0] : write.value).company_id || write.value.id || write.filters.find(([key]) => key === 'id')?.[1], 'A');
    deepEqual(c.state.unexpected, []);
  });
  for (const role of roles) for (const failure of ['inactive', 'missing', 'error', 'throw']) test('NEGATIVE setup ' + name + ' ' + role + ' ' + failure, async () => {
    const c = context({ role, active: failure !== 'inactive', missing: failure === 'missing', error: failure === 'error' ? { message: 'synthetic' } : null, thrownQuery: failure === 'throw' });
    await assert.rejects(c.load(setupFile)[name](...args)); assert.equal(c.state.reads.length, 0); assert.equal(c.state.writes.length, 0);
  });
  for (const role of ['employee', 'customer']) test('NEGATIVE active wrong role setup ' + name + ' ' + role, async () => {
    const c = context({ role }); await assert.rejects(c.load(setupFile)[name](...args), e => e instanceof Redirect); assert.equal(c.state.writes.length, 0);
  });
}

const syntheticIds = {
  user: '11111111-1111-4111-8111-111111111111', company: '22222222-2222-4222-8222-222222222222',
  client: '33333333-3333-4333-8333-333333333333', quote: '44444444-4444-4444-8444-444444444444',
  provider: '55555555-5555-4555-8555-555555555555',
};
const syntheticQuoteInput = { quote_id: syntheticIds.quote, client_id: syntheticIds.client,
  items: [{ description: 'SYNTHETIC ITEM', quantity: 2, unit_price: 50 }], vat_rate: 21, discount_pct: 0 };
test('POSITIVE actual quote create service keeps atomic RPC intent, totals and retry hash', async () => {
  const options = { userId: syntheticIds.user, companyId: syntheticIds.company, realQuotes: true,
    rpcs: { create_quote_atomic: args => ({ data: { id: args.p_quote_id, quote_number: 'SYN-Q' }, error: null }) } };
  const current = context(options), original = context(options);
  for (const c of [current, original]) {
    const service = c.load('src/lib/services/crm/quotes.ts', c === original);
    const first = await service.createQuote(syntheticQuoteInput, syntheticIds.user);
    const retry = await service.createQuote(syntheticQuoteInput, syntheticIds.user);
    deepEqual(first, { id: syntheticIds.quote, quote_number: 'SYN-Q' }); deepEqual(retry, first);
    assert.equal(c.state.rpcs.length, 2); deepEqual(c.state.rpcs[0], c.state.rpcs[1]);
    const args = c.state.rpcs[0].args; assert.equal(c.state.rpcs[0].name, 'create_quote_atomic');
    assert.equal(args.p_intent.company_id, syntheticIds.company); assert.equal(args.p_actor_id, syntheticIds.user);
    assert.equal(args.p_intent.subtotal, '100.00'); assert.equal(args.p_intent.vat_amount, '21.00'); assert.equal(args.p_intent.total, '121.00');
    assert.match(args.p_request_hash, /^[0-9a-f]{64}$/); assert.equal(c.state.writes.length, 0); deepEqual(c.state.unexpected, []);
  }
  deepEqual(current.state.rpcs, original.state.rpcs);
});
for (const role of roles) test('NEGATIVE actual quote create endpoint inactive ' + role, async () => {
  const c = context({ role, active: false, realQuotes: true });
  const response = await c.load('src/app/api/quotes/route.ts').POST(c.request(syntheticQuoteInput));
  assert.equal(response.status, 403); assert.equal(c.state.bodies, 0); assert.equal(c.state.rpcs.length, 0); assert.equal(c.state.writes.length, 0);
});
test('POSITIVE actual quote create endpoint admin succeeds without send transport', async () => {
  const c = context({ userId: syntheticIds.user, companyId: syntheticIds.company, realQuotes: true,
    rpcs: { create_quote_atomic: () => ({ data: { id: syntheticIds.quote, quote_number: 'SYN-Q' }, error: null }) } });
  const response = await c.load('src/app/api/quotes/route.ts').POST(c.request(syntheticQuoteInput));
  assert.equal(response.status, 200); deepEqual(response.body, { id: syntheticIds.quote, quote_number: 'SYN-Q' }); assert.equal(c.state.rpcs.length, 1); deepEqual(c.state.unexpected, []);
});
test('EXPECTED FAILURE quote RPC conflict remains 409 instead of duplicate success', async () => {
  const c = context({ userId: syntheticIds.user, companyId: syntheticIds.company, realQuotes: true,
    rpcs: { create_quote_atomic: () => ({ data: null, error: { message: 'Quote create conflict SYNTHETIC' } }) } });
  const response = await c.load('src/app/api/quotes/route.ts').POST(c.request(syntheticQuoteInput));
  assert.equal(response.status, 409); assert.equal(c.state.rpcs.length, 1);
});
function sendFixture(mode = 'fresh', extra = {}) {
  const claim = { state: 'sending', request_body: '{"to":"client@example.invalid","synthetic":true}', idempotency_key: 'SYNTHETIC-STABLE-KEY', started_at: FixedDate.now(), last_attempt_at: '2026-10-13T12:00:00Z' };
  const existing = ['complete', 'accepted', 'uncertain'].includes(mode) ? [{ quote_id: 'Q', ...claim, state: mode }] : [];
  const transports = [];
  const options = {
    ...extra, realQuotes: true, realEmail: true, env: { RESEND_API_KEY: 'SYNTHETIC-NOT-A-CREDENTIAL' },
    tables: { quotes: [{ id: 'Q', company_id: 'A', client_id: 'C', quote_number: 'SYN-Q', total: 121, status: 'draft', workflow_state: 'concept', sent_at: null }],
      clients: [{ id: 'C', company_id: 'A', profile_id: 'U', contact_name: 'SYNTHETIC', email: 'client@example.invalid' }], quote_email_sends: existing },
    services: { quoteSentEmail: () => ({ subject: 'SYNTHETIC', html: '<p>SYNTHETIC</p>' }) },
    mockFetch: async (url, request) => {
      transports.push({ url, body: request.body, key: request.headers['Idempotency-Key'] });
      if (mode === 'provider-ambiguous') throw Error('Synthetic transport timeout');
      const status = mode === 'provider-rejected' ? 429 : 200;
      return { ok: status === 200, status, json: async () => status === 429 ? { name: 'rate_limit_exceeded' } : { id: mode === 'invalid-proof' ? null : syntheticIds.provider } };
    },
    rpcs: {
      reserve_quote_email_send: args => ({ data: { ...claim, state: 'reserved', request_body: args.p_request_body }, error: null }),
      claim_quote_email_send: () => mode === 'lease-denied' ? { data: null, error: { message: 'Synthetic lease denied' } } : { data: claim, error: null },
      record_quote_email_outcome: (args, state) => {
        if (mode === 'proof-write-fails') return { data: null, error: { message: 'Synthetic persistence failure' } };
        state.tables.quote_email_sends = [{ quote_id: 'Q', ...claim, state: args.p_state }]; return { data: { ok: true }, error: null };
      },
      finalize_quote_email_send: () => mode === 'finalize-fails' ? { data: null, error: { message: 'Synthetic finalization failure' } } : { data: { ok: true }, error: null },
    },
  };
  return { options, claim, transports };
}
for (const mode of ['fresh', 'complete', 'accepted', 'uncertain']) test('POSITIVE actual send service MOCK VERIFIED ' + mode, async () => {
  const f = sendFixture(mode), c = context(f.options);
  await c.load('src/lib/services/crm/sendQuoteToClient.ts').sendQuoteToClient('Q');
  const expected = { fresh: ['reserve_quote_email_send', 'claim_quote_email_send', 'record_quote_email_outcome', 'finalize_quote_email_send'],
    complete: [], accepted: ['finalize_quote_email_send'], uncertain: ['claim_quote_email_send', 'record_quote_email_outcome', 'finalize_quote_email_send'] }[mode];
  deepEqual(c.state.rpcs.map(rpc => rpc.name), expected);
  assert.equal(f.transports.length, ['complete', 'accepted'].includes(mode) ? 0 : 1);
  if (f.transports.length) {
    assert.equal(f.transports[0].key, f.claim.idempotency_key); assert.equal(f.transports[0].body, f.claim.request_body);
    const proof = c.state.rpcs.find(rpc => rpc.name === 'record_quote_email_outcome');
    assert.equal(proof.args.p_state, 'accepted'); assert.equal(proof.args.p_provider_email_id, syntheticIds.provider);
  }
  deepEqual(c.state.unexpected, []);
});
for (const mode of ['lease-denied', 'provider-rejected', 'provider-ambiguous', 'invalid-proof', 'proof-write-fails', 'finalize-fails']) test('EXPECTED FAILURE actual send service ' + mode, async () => {
  const f = sendFixture(mode), c = context(f.options);
  await assert.rejects(c.load('src/lib/services/crm/sendQuoteToClient.ts').sendQuoteToClient('Q'));
  const proof = c.state.rpcs.find(rpc => rpc.name === 'record_quote_email_outcome');
  if (mode === 'lease-denied') { assert.equal(f.transports.length, 0); assert.equal(proof, undefined); }
  else if (['provider-rejected', 'provider-ambiguous', 'invalid-proof'].includes(mode)) {
    assert.equal(proof.args.p_state, mode === 'provider-rejected' ? 'rejected' : 'uncertain'); assert.equal(proof.args.p_provider_email_id, null);
    assert.equal(c.state.rpcs.some(rpc => rpc.name === 'finalize_quote_email_send'), false);
  } else {
    assert.equal(proof.args.p_state, 'accepted'); assert.equal(proof.args.p_provider_email_id, syntheticIds.provider);
    if (mode === 'proof-write-fails') assert.equal(c.state.rpcs.some(rpc => rpc.name === 'finalize_quote_email_send'), false);
  }
  deepEqual(c.state.unexpected, []);
});
test('POSITIVE send retry after accepted-but-unfinalized preserves proof and avoids duplicate transport', async () => {
  const f = sendFixture('finalize-fails'), c = context(f.options);
  const service = c.load('src/lib/services/crm/sendQuoteToClient.ts');
  await assert.rejects(service.sendQuoteToClient('Q'));
  f.options.rpcs.finalize_quote_email_send = () => ({ data: { ok: true }, error: null });
  await service.sendQuoteToClient('Q');
  assert.equal(f.transports.length, 1); assert.equal(c.state.tables.quote_email_sends[0].state, 'accepted');
  deepEqual(c.state.rpcs.slice(-1).map(rpc => rpc.name), ['finalize_quote_email_send']);
});
for (const role of roles) test('NEGATIVE send service inactive ' + role + ' never claims or sends', async () => {
  const f = sendFixture('fresh', { role, active: false }), c = context(f.options);
  await assert.rejects(c.load('src/lib/services/crm/sendQuoteToClient.ts').sendQuoteToClient('Q'), error => error.status === 403);
  assert.equal(c.state.reads.length, 0); assert.equal(c.state.rpcs.length, 0); assert.equal(f.transports.length, 0);
});
for (const route of ['quotes/[id]/accept', 'quotes/[id]/workflow', 'pdf/quote/[id]']) for (const role of ['admin', 'customer']) {
  test('NEGATIVE company isolation ' + role + ' ' + route, async () => {
    const entry = routes.find(entry => entry[0] === route), c = context(fixture(entry, role)); c.state.tables.quotes[0].company_id = 'OTHER';
    const response = await c.load('src/app/api/' + route + '/route.ts')[entry[1]](c.request(), { params: Promise.resolve({ id: 'Q' }) });
    assert.equal(response.status, 404); assert.equal(c.state.writes.length, 0); assert.equal(c.state.calls.some(call => ['acceptQuote', 'transitionQuote', 'renderToBuffer'].includes(call.name)), false); deepEqual(c.state.unexpected, []);
  });
  if (role === 'customer') test('NEGATIVE customer ownership ' + route, async () => {
    const entry = routes.find(entry => entry[0] === route), c = context(fixture(entry, role)); c.state.tables.clients[0].profile_id = 'OTHER';
    const response = await c.load('src/app/api/' + route + '/route.ts')[entry[1]](c.request(), { params: Promise.resolve({ id: 'Q' }) });
    assert.equal(response.status, 403); assert.equal(c.state.writes.length, 0); assert.equal(c.state.calls.some(call => ['acceptQuote', 'transitionQuote', 'renderToBuffer'].includes(call.name)), false); deepEqual(c.state.unexpected, []);
  });
}
test('NEGATIVE employee receipt ownership still blocks another uploader', async () => {
  const entry = routes.find(entry => entry[0] === 'receipts/[id]/download'), c = context(fixture(entry, 'employee')); c.state.tables.receipts[0].uploaded_by = 'OTHER';
  const response = await c.load('src/app/api/receipts/[id]/download/route.ts').GET(c.request(), { params: Promise.resolve({ id: 'Q' }) });
  assert.equal(response.status, 403); assert.equal(c.state.calls.length, 0);
});
for (const active of [true, false]) test('POSITIVE public quote form anonymous active-flag ' + active + ' no auth requirement', async () => {
  let emails = 0;
  const c = context({ anonymous: true, active, env: { RESEND_API_KEY: 'SYNTHETIC', QUOTE_REQUEST_TO_EMAIL: 'recipient@example.invalid' }, tables: { companies: [syntheticCompany] },
    services: { sendEmail: async request => { emails++; assert.equal(request.to, 'recipient@example.invalid'); assert.equal(request.replyTo, 'visitor@example.invalid'); assert.match(request.html, /&lt;SYNTHETIC&gt;/); } } });
  const response = await c.load('src/app/api/quote-request/route.ts').POST(c.request({ name: '<SYNTHETIC>', email: 'visitor@example.invalid', service: 'SYNTHETIC' }));
  assert.equal(response.status, 200); assert.equal(response.body.ok, true); assert.equal(emails, 1); assert.equal(c.state.profileReads.length, 0); deepEqual(c.state.unexpected, []);
});
test('POSITIVE public form honeypot still avoids email entirely', async () => {
  const c = context({ anonymous: true }); const response = await c.load('src/app/api/quote-request/route.ts').POST(c.request({ website: 'SYNTHETIC BOT' }));
  assert.equal(response.status, 200); assert.equal(c.state.calls.length, 0); assert.equal(c.state.reads.length, 0);
});
test('EXPECTED FAILURE public form provider refusal is 502 rather than success', async () => {
  const c = context({ anonymous: true, env: { RESEND_API_KEY: 'SYNTHETIC', QUOTE_REQUEST_TO_EMAIL: 'recipient@example.invalid' }, tables: { companies: [syntheticCompany] }, services: { sendEmail: async () => { throw Error('Synthetic expected provider refusal'); } } });
  const response = await c.load('src/app/api/quote-request/route.ts').POST(c.request({ name: 'SYNTHETIC', email: 'visitor@example.invalid', service: 'SYNTHETIC' }));
  assert.equal(response.status, 502); assert.equal(response.body.ok, undefined); assert.equal(c.state.calls.length, 1);
});
test('NEGATIVE public form cross origin rejected before private work', async () => {
  const c = context({ anonymous: true, headers: { origin: 'https://other.example.invalid' } });
  const response = await c.load('src/app/api/quote-request/route.ts').POST(c.request({})); assert.equal(response.status, 403); assert.equal(c.state.bodies, 0);
});
test('network is blocked when no explicit synthetic transport exists', async () => {
  const c = context({ env: { RESEND_API_KEY: 'SYNTHETIC' } });
  await assert.rejects(c.load('src/lib/email/client.ts').sendStoredEmail('{}'), /Network forbidden/);
  deepEqual(c.state.unexpected, ['Network forbidden in local tests']);
});
test('login authentication failure keeps existing error without signing out', async () => {
  const c = context({ authError: { message: 'synthetic' } });
  const result = await c.load('src/app/login/actions.ts').loginAction({ get: () => 'synthetic' });
  assert.equal(result.error, 'E-mailadres of wachtwoord onjuist.'); assert.equal(c.state.signouts.length, 0); assert.equal(c.state.redirects.length, 0);
});

for (const role of roles) test('POSITIVE MOCK VERIFIED fresh login session ' + role, async () => {
  const c = context({ role, session: 'new' }); assert.equal((await c.client.auth.getUser()).data.user, null);
  const destination = { admin: '/admin', employee: '/medewerker', customer: '/klant' }[role];
  await assert.rejects(c.load('src/app/login/actions.ts').loginAction({ get: () => 'synthetic' }), error => error instanceof Redirect && error.destination === destination);
  assert.equal(c.state.signins, 1); assert.equal(c.state.signouts.length, 0); assert.equal(c.state.tokens[0].valid, true); assert.equal(c.state.tokens[1].valid, true);
  assert.equal((await c.load('src/lib/auth/apiAuth.ts').getApiIdentity([role])).identity.role, role);
});
for (const role of roles) for (const active of [null, 0, 1, 'true', undefined]) test('NEGATIVE strict active boolean ' + role + ' ' + String(active), async () => {
  const c = context({ role, active }); const api = c.load('src/lib/auth/apiAuth.ts');
  assert.equal(await api.isActiveProfile('U'), false); assert.equal((await api.getApiIdentity([role])).status, 403);
  assert.equal(c.state.reads.length, 0); assert.equal(c.state.writes.length, 0);
});

for (const route of ['klant/offertes/[id]', 'pdf/quote/[id]']) for (const status of ['draft','expired','sent','accepted','rejected']) {
 test('quote customer visibility '+route+' '+status, async()=>{
  const entry=routes.find(e=>e[0]===route);const c=context(fixture(entry,'customer'));c.state.tables.quotes[0].status=status;
  const response=await c.load('src/app/api/'+route+'/route.ts').GET(c.request(),{params:Promise.resolve({id:'Q'})});
  const allowed=['sent','accepted','rejected'].includes(status);assert.equal(response.status,allowed?200:404);
  if(!allowed)assert.equal(c.state.calls.some(call=>call.name==='renderToBuffer'),false);
 });
}
 test('active admin retains draft PDF access',async()=>{const entry=routes.find(e=>e[0]==='pdf/quote/[id]');const c=context(fixture(entry,'admin'));c.state.tables.quotes[0].status='draft';const response=await c.load('src/app/api/pdf/quote/[id]/route.ts').GET(c.request(),{params:Promise.resolve({id:'Q'})});assert.equal(response.status,200);});
