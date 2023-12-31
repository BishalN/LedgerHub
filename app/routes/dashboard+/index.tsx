import { type MetaFunction } from '@remix-run/node'


// fetch the currently logged in user and its ledger
// if the user doesn't have the ledger than show an empty shell with proper message
// when the user selects a ledger open the ledger window


export const meta: MetaFunction = () => [{ title: 'Ledger Hub | Dashboard' }]

export default function Index() {
	return (
		<main className="relative min-h-screen sm:flex sm:items-center sm:justify-center">
			<h1>Hello welcome to ledger hub Dashboard</h1>
		</main>
	)
}
