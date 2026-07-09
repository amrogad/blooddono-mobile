export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

// Which donor groups can safely give to a given recipient (patient).
// Mirrors the backend `compatible_donor_types` RPC.
const CAN_RECEIVE_FROM: Record<string, string[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

export function compatibleDonorsFor(recipient: string): string[] {
  return CAN_RECEIVE_FROM[recipient] ?? [];
}

export function canDonate(donorGroup: string | undefined | null, recipientGroup: string): boolean {
  if (!donorGroup) return false;
  return compatibleDonorsFor(recipientGroup).includes(donorGroup);
}
