import { useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type DataFunctionArgs, json, redirect } from '@remix-run/node'
import { type MetaFunction, useActionData, Form } from '@remix-run/react'
import { AuthenticityTokenInput } from 'remix-utils/csrf/react'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { z } from 'zod'
import { Selector } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { validateCSRF } from '#app/utils/csrf.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { checkHoneypot } from '#app/utils/honeypot.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'

const PreferenceSchema = z.object({
	language: z.enum(['en', 'ne'], { required_error: 'Language is required' }),
	currency: z.enum(['usd', 'npr'], { required_error: 'Currency is required' }),
})

export const meta: MetaFunction = () => {
	return [{ title: 'Set Your Preferences' }]
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
	const submission = parse(formData, { schema: PreferenceSchema })
	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}

	await prisma.userPreferences.create({
		data: {
			currency: submission.value?.currency,
			language: submission.value?.language,
			user: {
				connect: {
					id: userId,
				},
			},
		},
	})

	return redirect('/onboarding/ledger')
}

export default function OnboardingPreferences() {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'onboarding-form',
		constraint: getFieldsetConstraint(PreferenceSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: PreferenceSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="flex min-h-full flex-col items-center justify-center">
			<h1 className="text-5xl font-bold">Choose your preferences</h1>

			<Form className="mt-4 space-y-4" method="POST" {...form.props}>
				<AuthenticityTokenInput />
				<HoneypotInputs />
				<Selector
					name="language"
					selectPlaceholder="Select a language"
					selectLabel="Language"
					options={[
						{ label: 'English', value: 'en' },
						{ label: 'Nepali', value: 'ne' },
					]}
					errors={fields.language.errors}
				/>
				<Selector
					name="currency"
					selectPlaceholder="Select a currency"
					selectLabel="Currency"
					options={[
						{ label: 'USD', value: 'usd' },
						{ label: 'NPR', value: 'npr' },
					]}
					errors={fields.currency.errors}
				/>
				<StatusButton
					className="w-full"
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
