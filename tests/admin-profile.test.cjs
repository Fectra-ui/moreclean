/* eslint-disable @typescript-eslint/no-require-imports -- Offline CommonJS/VM test, following the existing test suite. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const element = (type, props) => ({ type, props });
function load(file, mocks) {
  const output = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 }, fileName: file,
  }).outputText;
  const testModule = { exports: {} };
  vm.runInNewContext(output, { module: testModule, exports: testModule.exports, require(name) {
    if (name === 'react/jsx-runtime') return { jsx: element, jsxs: element };
    if (Object.hasOwn(mocks, name)) return mocks[name];
    throw Error('Unexpected import: ' + name);
  } });
  return testModule.exports.default;
}
function flatten(node) {
  if (!node || typeof node !== 'object') return [];
  return [node, ...[node.props?.children].flat(Infinity).flatMap(flatten)];
}
const formPath = 'src/app/(portal)/medewerker/profiel/MedewerkerProfielForm.tsx';
for (const isOwner of [true, false]) test('admin settings exposes own profile, is_owner=' + isOwner, async () => {
  const profile = { id: 'SELF', first_name: null, last_name: null, role: 'admin', is_owner: isOwner, active: true, company_id: 'COMPANY', email: 'self@example.invalid' };
  let authorized = 0;
  const Form = () => null;
  const Page = load('src/app/(portal)/admin/instellingen/page.tsx', {
    '@/lib/auth/requireAdmin': { requireAdmin: async () => { authorized++; return { profile }; } },
    '@/lib/services/setup': { getSetupStatus: async () => ({ completionPct: 0 }) },
    '../../medewerker/profiel/MedewerkerProfielForm': { __esModule: true, default: Form },
    'next/link': { __esModule: true, default: 'Link' },
    'lucide-react': Object.fromEntries(['Building2','FileText','Package','Layers','Users','Truck','Mail','CreditCard','BarChart2','Settings','ChevronRight','CheckCircle2','AlertTriangle','Clock'].map(x => [x, x])),
  });
  const rendered = flatten(await Page()).find(x => x.type === Form);
  assert.equal(authorized, 1);
  assert.equal(rendered.props.profile, profile);
  assert.equal(rendered.props.email, profile.email);
});
for (const actor of [{role:'admin', owner:true}, {role:'admin', owner:false}, {role:'employee', owner:false}]) test('own name persists without changing other accounts or permissions: ' + actor.role + '/' + actor.owner, async () => {
  const rows = [
    { id: 'SELF', first_name: '', last_name: '', phone: '', role: actor.role, company_id: 'A', active: true, is_owner: actor.owner },
    { id: 'OTHER', first_name: 'Other', last_name: 'Account', role: 'admin', company_id: 'B', active: true, is_owner: true },
  ];
  const beforeOther = JSON.stringify(rows[1]);
  let states = [], cursor = 0, writes = 0;
  const Form = load(formPath, {
    react: { useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], v => { states[i] = typeof v === 'function' ? v(states[i]) : v; }]; } },
    '@/lib/supabase/client': { createClient() { return { from(table) {
      assert.equal(table, 'profiles'); let values, id;
      return { update(v) { values = JSON.parse(JSON.stringify(v)); assert.deepEqual(Object.keys(values).sort(), ['first_name','last_name','phone']); return this; },
        eq(key, value) { assert.equal(key, 'id'); id = value; return this; },
        select(value) { assert.equal(value, 'id'); return this; },
        async single() { assert.equal(id, 'SELF'); Object.assign(rows.find(r => r.id === id), values); writes++; return { data: { id }, error: null }; } };
    } }; } },
  });
  const render = () => { cursor = 0; return Form({ profile: rows[0], email: 'self@example.invalid' }); };
  const tree = render();
  const editable = flatten(tree).filter(n => n.type === 'input' && !n.props.disabled);
  editable[0].props.onChange({ target: { value: 'Ada' } });
  editable[1].props.onChange({ target: { value: 'Lovelace' } });
  await render().props.onSubmit({ preventDefault() {} });
  assert.equal(writes, 1);
  assert.equal([rows[0].first_name, rows[0].last_name].filter(Boolean).join(' '), 'Ada Lovelace');
  assert.equal(rows[0].role, actor.role); assert.equal(rows[0].company_id, 'A'); assert.equal(rows[0].active, true); assert.equal(rows[0].is_owner, actor.owner);
  assert.equal(JSON.stringify(rows[1]), beforeOther);
  states = [];
  assert.equal(flatten(render()).find(n => n.type === 'input').props.value, 'Ada');
});
test('overview reads the same stored first and last name fields', () => {
  const source = fs.readFileSync(path.join(root, 'src/app/(portal)/admin/medewerkers/page.tsx'), 'utf8');
  assert.match(source, /select\("id, first_name, last_name,/);
  assert.match(source, /\[emp.first_name, emp.last_name\]\.filter\(Boolean\)\.join\(" "\)/);
});
