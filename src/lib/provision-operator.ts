import type { Auth } from './auth';

export async function provisionOperator(
	auth: Auth,
	input: { email: string; password: string; name: string },
): Promise<{ id: string; email: string; created: boolean }> {
	const ctx = await auth.$context;
	const email = input.email.trim().toLowerCase();
	const name = input.name.trim() || email;
	const existing = await ctx.internalAdapter.findUserByEmail(email);
	const hash = await ctx.password.hash(input.password);

	if (existing) {
		await ctx.internalAdapter.updateUser(existing.user.id, { role: 'admin', name });
		await ctx.internalAdapter.updatePassword(existing.user.id, hash);
		return { id: existing.user.id, email, created: false };
	}

	const created = await ctx.internalAdapter.createUser(
		{
			email,
			name,
			role: 'admin',
		},
		{ method: 'email-password' },
	);
	if (!created?.id) throw new Error('failed to create operator');

	await ctx.internalAdapter.linkAccount({
		userId: created.id,
		providerId: 'credential',
		accountId: created.id,
		password: hash,
	});
	return { id: created.id, email, created: true };
}
