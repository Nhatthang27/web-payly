import type { MenuItem } from '@/shared/components/ui/menu/menu.type'
import { BanknoteArrowDownIcon, CircleCheckBigIcon, HandCoinsIcon, ScaleIcon, UserIcon } from 'lucide-vue-next'

export const menuItems = [
  { key: 'expense', icon: BanknoteArrowDownIcon, label: 'Khoản chi' },
  { key: 'debt', icon: HandCoinsIcon, label: 'Khoản nợ' },
  { key: 'balance', icon: ScaleIcon, label: 'Công nợ' },
  { key: 'settlement', icon: CircleCheckBigIcon, label: 'Đã thanh toán' },
  { key: 'member', icon: UserIcon, label: 'Thành viên' },
] as const satisfies MenuItem[]

export type GroupMenuKeys = (typeof menuItems)[number]['key']
