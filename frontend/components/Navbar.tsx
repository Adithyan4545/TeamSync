import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between py-4 px-8 bg-black bg-opacity-50 backdrop-filter backdrop-blur-lg">
      <div className="flex items-center space-x-2">
        {/* Replace with logo if available */}
        <Image src="/logo.svg" alt="TeamSync" width={40} height={40} priority />
        <span className="text-xl font-semibold text-white">TeamSync</span>
      </div>
      <div className="flex space-x-4">
        <Link href="/" className="text-white hover:text-pink-300 transition">Home</Link>
        <Link href="/teams" className="text-white hover:text-pink-300 transition">Teams</Link>
        <Link href="/login" className="text-white hover:text-pink-300 transition">Login</Link>
        <Link href="/register" className="text-white hover:text-pink-300 transition">Register</Link>
      </div>
    </nav>
  );
}
