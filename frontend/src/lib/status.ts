export const STATUS: Record<string, { label: string; badge: string; dot: string; num: string; hl: string; bar: string }> = {
  supported: {
    label: 'Supported',
    badge: 'bg-green-50 text-green-700 border-green-200',
    dot: 'bg-green-500',
    num: 'text-green-600',
    hl: 'bg-[#DCFCE7]',
    bar: 'bg-green-500',
  },
  uncertain: {
    label: 'Uncertain',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    num: 'text-amber-500',
    hl: 'bg-[#FDE7C0]',
    bar: 'bg-amber-400',
  },
  unsupported: {
    label: 'Unsupported',
    badge: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
    num: 'text-red-500',
    hl: 'bg-[#FEE2E2]',
    bar: 'bg-red-500',
  },
  verifying: {
    label: 'Verifying...',
    badge: 'bg-gray-50 text-gray-600 border-gray-200',
    dot: 'bg-gray-400 animate-pulse',
    num: 'text-gray-500',
    hl: 'bg-gray-100',
    bar: 'bg-gray-300',
  },
};
