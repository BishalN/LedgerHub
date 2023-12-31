import { type MetaFunction } from '@remix-run/node'


export const meta: MetaFunction = () => [{ title: 'Ledger Hub' }]

export default function Index() {
	return (
		<main className="relative min-h-screen sm:flex sm:items-center sm:justify-center">
			<h1>Hello welcome to ledger hub</h1>
		</main>
	)
}
