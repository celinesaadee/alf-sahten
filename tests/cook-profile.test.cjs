const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, context = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText;
  vm.runInNewContext(code,{exports,...context},{filename:file});return exports;
}
const links = load('src/lib/cookProfile.ts',{URL});
test('normalizes Instagram handles and website domains into safe links',()=>{
  assert.equal(links.normalizeProfileUrl('@maya.kitchen','instagram'),'https://www.instagram.com/maya.kitchen/');
  assert.equal(links.normalizeProfileUrl('instagram.com/maya','instagram'),'https://instagram.com/maya');
  assert.equal(links.normalizeProfileUrl(' example.com/recipes ','website'),'https://example.com/recipes');
  const result=links.cookSocialLinks('https://www.instagram.com/maya/','https://www.example.com/recipes');
  assert.equal(result.instagram.label,'@maya');assert.equal(result.website.label,'example.com');
});
test('rejects executable URLs, embedded credentials and misleading Instagram hosts',()=>{
  for(const value of ['javascript:alert(1)','data:image/svg+xml,test','https://user:password@example.com','not a url']) {
    assert.equal(links.normalizeProfileUrl(value,'website'),null,value);
  }
  assert.equal(links.normalizeProfileUrl('https://instagram.com.evil.example/name','instagram'),null);
  assert.equal(links.normalizeProfileUrl('https://example.com','instagram'),null);
  assert.equal(links.normalizeProfileUrl('','photo'),'');
  assert.equal(links.cookSocialLinks('javascript:alert(1)',null).instagram,null);
});
function server(data,error=null) {
  let handler;
  load('supabase/functions/cook-statistics/index.ts',{
    Request,Response,console:{warn(){}},
    Deno:{env:{get:key=>key==='SUPABASE_URL'?'https://example.supabase.co':'test-server-key'},serve:fn=>handler=fn},
    require:spec=>spec.startsWith('npm:')?{createClient:()=>({rpc:async()=>({data,error})})}:{},
  });
  return (body,method='POST')=>handler(new Request('https://example.test',{method, ...(method==='POST'?{body:JSON.stringify(body)}:{})}));
}
test('public statistics return aggregate counts only; unknown cooks and invalid inputs are rejected',async()=>{
  const statistics={recipe_count:2,follower_count:1,following_count:3,total_saves:4};
  const response=await server(statistics)({cookId:'11111111-1111-4111-8111-111111111111'});
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{statistics});
  assert.equal((await server(null)({cookId:'11111111-1111-4111-8111-111111111111'})).status,404);
  assert.equal((await server(null)({cookId:'bad'})).status,400);
  assert.equal((await server(null)({cookId:'11111111-1111-4111-8111-111111111111',extra:'x'.repeat(300)})).status,400);
  assert.equal((await server(null)({},'GET')).status,405);
  assert.equal((await server(null)({},'OPTIONS')).status,200);
  assert.equal((await server(null,{code:'42501'})({cookId:'11111111-1111-4111-8111-111111111111'})).status,503);
});

const { photoCrop } = load('src/lib/photoCrop.ts');
test('photo crops keep square and cover rectangles inside the source at every pan and zoom', () => {
  for (const [width,height] of [[1200,600],[600,1200],[800,800]]) {
    for (const aspect of [1,3]) for (const zoom of [1,2,4]) for (const x of [-1,0,1]) for (const y of [-1,0,1]) {
      const crop = photoCrop(width,height,aspect,{x,y,zoom});
      assert.ok(crop.x >= 0 && crop.y >= 0);
      assert.ok(crop.x + crop.width <= width + 1e-8);
      assert.ok(crop.y + crop.height <= height + 1e-8);
      assert.ok(Math.abs(crop.width / crop.height - aspect) < 1e-8);
    }
  }
  const left=photoCrop(1200,600,1,{x:-1,y:0,zoom:2});
  const right=photoCrop(1200,600,1,{x:1,y:0,zoom:2});
  assert.equal(left.x,0); assert.equal(right.x,900); assert.equal(left.width,300);
});

test('photo save updates only the selected photo for the signed-in cook and propagates failures', async () => {
  const calls=[];
  let fail=false;
  const api={auth:{getUser:async()=>({data:{user:{id:'owner-id'}},error:null})},
    from:table=>({update:payload=>{calls.push({table,payload});return {eq:(column,id)=>{
      calls.push({column,id});return {select:()=>({single:async()=>({data:fail?null:{profile_image_url:'photo'},error:fail?new Error('save failed'):null})})};
    }};}})};
  const {saveCookPhoto}=load('src/services/cooks.ts',{require:()=>({supabase:api})});
  await saveCookPhoto('profile','https://example.com/avatar.webp');
  assert.equal(calls[0].table,'cook_profiles');
  assert.equal(JSON.stringify(calls[0].payload),JSON.stringify({profile_image_url:'https://example.com/avatar.webp'}));
  assert.equal(calls[1].column,'user_id');assert.equal(calls[1].id,'owner-id');
  fail=true;await assert.rejects(saveCookPhoto('cover','https://example.com/cover.webp'),/save failed/);
});
