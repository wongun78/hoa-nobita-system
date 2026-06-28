import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
export function hasRole(user: { roles: string[] } | null, role: string) { return Boolean(user?.roles?.includes(role)) }
