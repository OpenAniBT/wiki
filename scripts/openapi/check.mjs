import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import Ajv from 'ajv/dist/2020.js';
import { parseDocument } from 'yaml';

const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);

export function resolveReference(document, value) {
  if (!value?.$ref) return value;
  assert.ok(value.$ref.startsWith('#/'), `External reference is not bundled: ${value.$ref}`);
  const resolved = value.$ref.slice(2).split('/').reduce((node, key) => node?.[key.replaceAll('~1', '/').replaceAll('~0', '~')], document);
  assert.ok(resolved, `Missing reference: ${value.$ref}`);
  return resolveReference(document, resolved);
}

export function operations(document) {
  return Object.entries(document.paths).flatMap(([path, item]) => Object.entries(item)
    .filter(([method]) => methods.has(method))
    .map(([method, operation]) => ({ path, method, operation })));
}

export function contractValidator(document) {
  const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false });
  const validators = new Map();
  function validate(schema, value, label) {
    const key = JSON.stringify(schema);
    let validator = validators.get(key);
    if (!validator) {
      validator = ajv.compile({ ...schema, components: document.components });
      validators.set(key, validator);
    }
    assert.ok(validator(value), `${label}: ${ajv.errorsText(validator.errors, { separator: '; ' })}`);
  }
  function response(sample) {
    const operation = document.paths[sample.path]?.[sample.method];
    assert.ok(operation, `${sample.name}: undocumented operation`);
    const response = resolveReference(document, operation.responses[String(sample.status)]);
    assert.ok(response, `${sample.name}: undocumented HTTP ${sample.status}`);
    const media = response.content?.[sample.contentType];
    assert.ok(media?.schema, `${sample.name}: undocumented ${sample.contentType} body`);
    validate(media.schema, sample.body, sample.name);
    if (sample.request) {
      const request = resolveReference(document, operation.requestBody);
      assert.ok(request?.content?.['application/json']?.schema, `${sample.name}: missing JSON request schema`);
      validate(request.content['application/json'].schema, sample.request, `${sample.name} request`);
    }
  }
  return { validate, response };
}

export async function loadContract() {
  const yaml = await readFile('openapi/anibt.yaml', 'utf8');
  const parsed = parseDocument(yaml, { uniqueKeys: true });
  assert.deepEqual(parsed.errors, [], 'OpenAPI YAML must parse without duplicate keys');
  const document = parsed.toJS();
  const fixtures = (await Promise.all(['public-responses.json', 'private-responses.json', 'protocol-responses.json'].map(async file =>
    JSON.parse(await readFile(`openapi/fixtures/${file}`, 'utf8'))))).flat();
  return { document, yaml, fixtures };
}

export async function checkContract() {
  const { document, yaml, fixtures } = await loadContract();
  const { validate, response } = contractValidator(document);
  assert.equal(document.openapi, '3.1.0');
  assert.equal(await readFile('public/openapi.yaml', 'utf8'), yaml, 'public/openapi.yaml is stale; run gen:openapi');
  assert.ok(isDeepStrictEqual(JSON.parse(await readFile('openapi/anibt.json', 'utf8')), document), 'bundled JSON is stale; run gen:openapi');
  for (const schema of Object.values(document.components.schemas)) {
    // Compiling each schema also resolves references in schemas without an example.
    new Ajv({ strict: false, validateFormats: false }).compile({ ...schema, components: document.components });
  }
  const ids = new Set();
  const audit = JSON.parse(await readFile('openapi/audit.json', 'utf8'));
  assert.match(audit.sourceGitSha, /^[0-9a-f]{40}$/u, 'Audit source SHA is not pinned');
  assert.equal(audit.productionVersionVerified, true, 'Audit must record production version verification');
  assert.equal(audit.operations.length, operations(document).length, 'Endpoint audit inventory is stale');
  let examples = 0;
  for (const { path, method, operation } of operations(document)) {
    assert.ok(operation.operationId && !ids.has(operation.operationId), `Duplicate or missing operationId: ${method} ${path}`);
    ids.add(operation.operationId);
    const audited = audit.operations.find(entry => entry.operationId === operation.operationId);
    assert.ok(audited && audited.path === path && audited.method === method && audited.sources.length, `${operation.operationId}: missing source audit`);
    assert.deepEqual(audited.reviewed, ['request', 'authentication', 'success', 'errors', 'cache'], `${operation.operationId}: incomplete audit dimensions`);
    for (const source of audited.sources) {
      assert.match(source, /^(?:src|shared|background-worker)\//u, `${operation.operationId}: source must be a repository path`);
    }
    assert.ok(operation.responses, `${operation.operationId}: missing responses`);
    for (const parameterRef of operation.parameters ?? []) {
      const parameter = resolveReference(document, parameterRef);
      assert.ok(parameter.name && parameter.in && parameter.schema, `${operation.operationId}: incomplete parameter`);
    }
    for (const [status, responseRef] of Object.entries(operation.responses)) {
      const result = resolveReference(document, responseRef);
      for (const [contentType, media] of Object.entries(result.content ?? {})) {
        assert.ok(media.schema, `${operation.operationId} ${status}: missing schema`);
        const values = [...('example' in media ? [media.example] : []), ...Object.values(media.examples ?? {}).map(example => resolveReference(document, example).value)];
        for (const value of values) { validate(media.schema, value, `${operation.operationId} ${status} example`); examples++; }
        if (status.startsWith('2') && contentType === 'application/json') {
          assert.ok(fixtures.some(f => f.path === path && f.method === method && String(f.status) === status), `${operation.operationId} ${status}: missing response witness`);
          assert.ok(values.length, `${operation.operationId} ${status}: missing explicit example`);
        }
      }
    }
    for (const suffix of ['', '.en', '.zh-Hant']) {
      const text = await readFile(`content/docs/open-api/${operation.operationId}${suffix}.mdx`, 'utf8');
      const frontmatter = parseDocument(text.split('---')[1]).toJS();
      assert.equal(frontmatter._openapi.method, method.toUpperCase(), `${operation.operationId}${suffix}: stale method`);
      assert.ok(text.includes(JSON.stringify({ path, method })), `${operation.operationId}${suffix}: stale generated operation`);
      if (suffix !== '') {
        // Operation descriptions are authored in the source OpenAPI locale and
        // are rendered by the interactive page. They must not be copied into
        // another locale's generated MDX by Fumadocs.
        if (operation.description) {
          assert.ok(!text.includes(operation.description), `${operation.operationId}${suffix}: source-language description leaked into locale page`);
        }
        const body = text.split('---').slice(2).join('---');
        if (suffix === '.en') {
          assert.doesNotMatch(body, /\p{Script=Han}/u, `${operation.operationId}.en: Chinese prose leaked into English page`);
        } else {
          assert.doesNotMatch(body, /当前|字幕组|返回|删除|发布/u, `${operation.operationId}.zh-Hant: simplified Chinese prose leaked into Traditional page`);
        }
      }
    }
  }
  for (const fixture of fixtures) {
    const revision = (audit.fixtureRevisions ?? []).find(entry => entry.fixtures.includes(fixture.name));
    const expectedSha = revision ? revision.gitSha : audit.sourceGitSha;
    if (fixture.source.kind === 'production-read') {
      assert.equal(fixture.source.gitSha, expectedSha, `${fixture.name}: witness SHA drift`);
      assert.ok(fixture.source.requestPath, `${fixture.name}: production witness lacks request path`);
    } else {
      assert.equal(fixture.source.kind, 'isolated-http-handler', `${fixture.name}: unknown witness kind`);
      assert.equal(fixture.source.gitSha, expectedSha, `${fixture.name}: isolated witness SHA drift`);
    }
    response(fixture);
  }
  console.log(`OpenAPI check: ${ids.size} operations, ${fixtures.length} response witnesses, ${examples} examples; generated YAML/JSON and three locales agree.`);
  return { document, fixtures };
}
