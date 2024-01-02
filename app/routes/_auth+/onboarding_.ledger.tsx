import { type DataFunctionArgs, json, redirect } from "@remix-run/node"
import { type MetaFunction } from "@remix-run/react"
import { requireOnboardingEmail } from "./onboarding"


export const meta: MetaFunction = () => {
	return [{ title: 'Create your first ledger' }]
}

export async function loader({ request }: DataFunctionArgs) {
    const email = await requireOnboardingEmail(request)
	return json({ email })
}

export async function action({ request }: DataFunctionArgs) {
    await requireOnboardingEmail(request)
    // TODO:
    // parse the form data 
    // save to db 
    return redirect('/dashboard')
}

export default function OnBoardingLedger() {
    return (
        <>
            <h1>Create your first ledger here</h1>
            <p>Coming soon!</p>
        </>
    )
}