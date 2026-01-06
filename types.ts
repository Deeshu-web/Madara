
export interface Member {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface MemberSubscription {
  memberId: string;
  committeeYear: number;
  monthlyAmount: number;
}

export type PaymentMethod = 'Cash' | 'Online' | 'Bank';

export interface PaymentRecord {
  memberId: string;
  committeeYear: number;
  monthIndex: number;
  amountPaid: number;
  expectedAmount: number;
  datePaid?: string;
  isPaid: boolean;
  interestCharged: number;
  paymentMethod?: PaymentMethod;
  pendingAmount?: number;
}

export interface Loan {
  id: string;
  memberId: string;
  amount: number;
  interestRate: number; // monthly %
  startDate: string;
  status: 'active' | 'closed';
  notes: string;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  interestPaid: number;
  principalPaid: number;
}

export interface Committee {
  year: number;
  durationMonths: number;
}

export type TabType = 'dashboard' | 'members' | 'committees' | 'payments' | 'loans' | 'search';
