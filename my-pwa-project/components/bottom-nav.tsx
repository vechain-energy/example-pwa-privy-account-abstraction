import Link from 'next/link'
import { useRouter } from 'next/router'
import {
	UserIcon,
	WalletIcon,
	CurrencyDollarIcon,
} from '@heroicons/react/24/outline'

const BottomNav = () => {
	const router = useRouter()

	return (
		<div className='sm:hidden'>
			<nav className='fixed bottom-0 w-full border-t bg-zinc-900 pb-safe border-orange-800'>
				<div className='mx-auto flex h-16 max-w-md items-center justify-around px-6'>
					{links.map(({ href, label, icon }) => (
						<Link key={label} href={href} className={`flex h-full w-full flex-col items-center justify-center space-y-1 ${
							router.pathname === href ? 'text-orange-500' : 'text-gray-400'
						}`}>
							{icon}
							<span className='text-xs'>{label}</span>
						</Link>
					))}
				</div>
			</nav>
		</div>
	)
}

export default BottomNav

const links = [
	{
		label: 'My Profile',
		href: '/dashboard',
		icon: <UserIcon className='h-5 w-5 text-orange-600' />,
	},
	{
		label: 'Embedded Wallet',
		href: '/embedded-wallet',
		icon: <WalletIcon className='h-5 w-5 text-orange-600' />,
	},
	{
		label: 'Load Assets',
		href: '/load-assets',
		icon: <CurrencyDollarIcon className='h-5 w-5 text-orange-600' />,
	},
]
