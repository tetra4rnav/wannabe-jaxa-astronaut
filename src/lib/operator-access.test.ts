import assert from 'node:assert/strict';
import test from 'node:test';
import { isOperator, parseAdminEmails, resolveAuthBaseURL, safeNext } from './operator-access.ts';

test('parseAdminEmails splits and lowercases', () => {
	const emails = parseAdminEmails(' Ops@Example.com, second@example.com ');
	assert.equal(emails.has('ops@example.com'), true);
	assert.equal(emails.has('second@example.com'), true);
	assert.equal(parseAdminEmails(undefined).size, 0);
	assert.equal(parseAdminEmails('').size, 0);
});

test('isOperator requires admin role and an allowlisted email', () => {
	const emails = parseAdminEmails('ops@example.com');
	assert.equal(isOperator({ email: 'ops@example.com', role: 'admin' }, emails), true);
	assert.equal(isOperator({ email: 'OPS@example.com', role: 'admin' }, emails), true);
	assert.equal(isOperator({ email: 'ops@example.com', role: 'user' }, emails), false);
	assert.equal(isOperator({ email: 'other@example.com', role: 'admin' }, emails), false);
	assert.equal(isOperator({ email: 'ops@example.com', role: 'admin' }, new Set()), false);
	assert.equal(isOperator(null, emails), false);
});

test('safeNext allows relative paths only', () => {
	assert.equal(safeNext('/admin/?section=catalog'), '/admin/?section=catalog');
	assert.equal(safeNext('https://evil.example/admin'), '/admin');
	assert.equal(safeNext('//evil.example'), '/admin');
	assert.equal(safeNext('/\\evil'), '/admin');
	assert.equal(safeNext(null), '/admin');
});

test('resolveAuthBaseURL keeps local and workers.dev origins', () => {
	const canonical = 'https://wannabe-jaxa-astronaut.diaphana.io';
	assert.equal(
		resolveAuthBaseURL(new URL('http://localhost:4321/login'), canonical),
		'http://localhost:4321',
	);
	assert.equal(
		resolveAuthBaseURL(new URL('https://branch.workers.dev/login'), canonical),
		'https://branch.workers.dev',
	);
	assert.equal(
		resolveAuthBaseURL(new URL('https://evil.example/login'), canonical),
		canonical,
	);
});
