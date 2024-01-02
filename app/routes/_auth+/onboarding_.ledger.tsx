import { useForm, conform } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type DataFunctionArgs, json, redirect } from '@remix-run/node'
import { type MetaFunction, useActionData, Form } from '@remix-run/react'
import { AuthenticityTokenInput } from 'remix-utils/csrf/react'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { z } from 'zod'
import { Field } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { validateCSRF } from '#app/utils/csrf.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { checkHoneypot } from '#app/utils/honeypot.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'

const LedgerSchema = z.object({
	name: z
		.string({ required_error: 'Name is required' })
		.min(3, { message: 'Name must be at least 3 character long' })
		.max(50, { message: "Name can't be longer than 50 characters" }),
})

export const meta: MetaFunction = () => {
	return [{ title: 'Create your first ledger' }]
}

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)

	return json({ userId })
}

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	await validateCSRF(formData, request.headers)
	checkHoneypot(formData)
	const submission = parse(formData, { schema: LedgerSchema })
	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}

	await prisma.ledger.create({
		data: {
			name: submission.value?.name as string,
			owner: {
				connect: {
					id: userId,
				},
			},
		},
	})

	return redirect('/dashboard')
}

export default function OnboardingPreferences() {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'onboarding-ledger-form',
		constraint: getFieldsetConstraint(LedgerSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: LedgerSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="flex min-h-full flex-col items-center justify-center">
			<h1 className="text-5xl font-bold">Create your first ledger</h1>
			<p className="mt-2 text-sm text-gray-500">
				Ledgers are the way to manage your business transactions
			</p>

			<Form className="mt-4 space-y-4" method="POST" {...form.props}>
				<AuthenticityTokenInput />
				<HoneypotInputs />
				<Field
					labelProps={{ htmlFor: fields.name.id, children: 'Name' }}
					inputProps={{
						...conform.input(fields.name),
						autoComplete: 'name',
						placeholder: 'Enter your business name',
						className: ' w-[350px]',
					}}
					errors={fields.name.errors}
				/>
				<StatusButton
					status={isPending ? 'pending' : actionData?.status ?? 'idle'}
					type="submit"
					disabled={isPending}
				>
					Submit
				</StatusButton>
			</Form>
		</div>
	)
}
