/* eslint-disable @typescript-eslint/no-require-imports -- Existing offline Node/VM tests. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('../node_modules/typescript');
const sql = fs.readFileSync('supabase/migrations/034_atomic_invoice_creation.sql','utf8');
function context(result) {
  const calls=[], events=[], writes=[];
  const client={
    rpc: async (name,args)=>{calls.push({name,args});return result;},
    from: table=>({select:()=>({eq:()=>({single:async()=>({data:{contact_name:'Synthetic',company_name:null},error:null})})}),insert:()=>{writes.push(table);throw Error('Independent write forbidden');}}),
  };
  const exports={};
  const imports={
    '@/lib/supabase/server':{createClient:async()=>client,createServiceClient:()=>{throw Error('Service role forbidden');}},
    '@/lib/auth/getCompanyId':{getCompanyId:async()=>'company-A'},
    '@/lib/events':{publish:async e=>events.push(e)},
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/services/finance/invoices.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
    {exports,Date,console,require:name=>{assert.ok(name in imports,name);return imports[name];}});
  return {api:exports,calls,events,writes};
}
const input={actorId:'actor-A',clientId:'client-A',issueDate:'2026-10-21',dueDate:'2026-11-21',
  items:[{description:'Synthetic',quantity:1.25,unitPrice:10.15}],discountPct:3.5,vatRate:21};
test('invoice header and lines use exactly one user-session RPC; event follows success',async()=>{
  const c=context({data:{id:'invoice-A',invoice_number:'MC-2026-0001'},error:null});
  const r=await c.api.createInvoice(input);
  assert.equal(r.id,'invoice-A');assert.equal(r.error,null);
  assert.equal(c.calls.length,1);assert.equal(c.calls[0].name,'create_invoice_atomic');
  const {p_invoice:h,p_items:items}=c.calls[0].args;
  assert.equal(h.client_id,'client-A');assert.equal(h.company_id,undefined);assert.equal(h.created_by,undefined);
  assert.equal(items.length,1);assert.equal(items[0].total_price,1.25*10.15);
  assert.equal(c.events.length,1);assert.equal(c.events[0].type,'invoice.created');
  assert.equal(c.writes.length,0);
});
test('invoice retains existing JavaScript financial calculation before numeric database rounding',async()=>{
  const c=context({data:{id:'invoice-A',invoice_number:'MC-2026-0001'},error:null});
  await c.api.createInvoice(input);const h=c.calls[0].args.p_invoice;
  const subtotal=1.25*10.15*(1-3.5/100),vat=subtotal*(21/100);
  assert.equal(h.subtotal,subtotal);assert.equal(h.vat_amount,vat);assert.equal(h.total,subtotal+vat);
});
test('credit uses authoritative source within one RPC and preserves event payload',async()=>{
  const c=context({data:{id:'credit-A',invoice_number:'MC-2026-0002',client_id:'client-A',client_name:'Synthetic',original_total:'15.42'},error:null});
  const r=await c.api.createCreditInvoice('original-A','actor-A');
  assert.equal(r.id,'credit-A');assert.equal(c.calls.length,1);
  assert.equal(c.calls[0].name,'create_credit_invoice_atomic');
  assert.equal(c.calls[0].args.p_original_id,'original-A');
  assert.match(c.calls[0].args.p_today,/^\d{4}-\d{2}-\d{2}$/);
  assert.equal(c.events[0].type,'invoice.credit_created');assert.equal(c.events[0].payload.total,15.42);
  assert.equal(c.writes.length,0);
});
for(const operation of ['invoice','credit'])for(const reason of ['line constraint failure','unauthorized','inactive','wrong tenant','number exhausted'])test(operation+' RPC failure: '+reason+' has no independent writes or success event',async()=>{
  const c=context({data:null,error:{message:reason}});
  const r=operation==='invoice'?await c.api.createInvoice(input):await c.api.createCreditInvoice('original-A','actor-A');
  assert.equal(r.id,null);assert.equal(r.error,reason);assert.equal(c.events.length,0);assert.equal(c.writes.length,0);assert.equal(c.calls.length,1);
});
for(const data of [null,{}, {id:'unconfirmed'}])test('unconfirmed invoice RPC result fails closed '+JSON.stringify(data),async()=>{
  const c=context({data,error:null});const r=await c.api.createInvoice(input);assert.equal(r.id,null);assert.ok(r.error);assert.equal(c.events.length,0);
});
const bodies=sql.split('create function public.').slice(1);
assert.equal(bodies.length,2);
for(const body of bodies)test(body.split('(')[0]+' SQL transaction and authorization contract',()=>{
  assert.match(body,/security invoker set search_path = ''/);
  assert.match(body,/v_actor uuid := auth.uid\(\)/);
  assert.match(body,/id = v_actor and role = 'admin' and active is true/);
  assert.match(body,/if v_company is null then raise exception/);
  assert.match(body,/transaction_isolation/);
  assert.match(body,/lock table public.invoices in share row exclusive mode/);
  assert.ok(body.indexOf('lock table public.invoices')<body.indexOf('select greatest'));
  assert.match(body,/group by invoice_number having count\(\*\) > 1/);
  assert.match(body,/coalesce\(max\(split_part\(invoice_number, '-', 3\)::bigint\), 0\)/);
  assert.match(body,/if v_next > 9999 then raise exception/);
  assert.match(body,/'MC-' \|\| v_year \|\| '-' \|\| pg_catalog.lpad\(v_next::text, 4, '0'\)/);
  assert.match(body,/insert into public.invoices/);assert.match(body,/insert into public.invoice_items/);
  assert.doesNotMatch(body,/exception\s+when|security definer/i);
});
test('credit SQL copies negative quantities and totals; positive original unit prices retained',()=>{
  assert.match(sql,/select v_id, description, -quantity, unit_price, -total_price, sort_order/);
  assert.match(sql,/-v_original.subtotal, v_original.discount_pct, v_original.vat_rate/);
  assert.match(sql,/-v_original.vat_amount, -v_original.total/);
  assert.match(sql,/lock table public.invoice_items in share mode/);
  assert.match(sql,/id = p_original_id and company_id = v_company/);
});
test('only authenticated may execute; no grants or modifications of existing tables/policies',()=>{
  for(const sig of ['create_invoice_atomic(jsonb, jsonb)','create_credit_invoice_atomic(uuid, date)']){
    assert.ok(sql.includes('revoke all on function public.'+sig+' from public, anon, authenticated, service_role;'));
    assert.ok(sql.includes('grant execute on function public.'+sig+' to authenticated;'));
  }
  assert.doesNotMatch(sql,/create table|alter table|create policy|delete from|grant .*on table|update public\./i);
  assert.ok(sql.trim().startsWith('--'));assert.ok(sql.trim().endsWith('commit;'));
});

test('missing original retains existing API error text',async()=>{
 const c=context({data:null,error:{message:'Original invoice not available'}});const r=await c.api.createCreditInvoice('missing','actor-A');assert.equal(r.error,'Originele factuur niet gevonden');assert.equal(c.events.length,0);
});
