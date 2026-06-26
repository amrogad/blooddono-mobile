export type DemoAccount = {
  role: 'admin' | 'donor' | 'volunteer';
  label: string;
  email: string;
  password: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'admin', label: 'Admin', email: 'admin@blooddono.demo', password: 'Demo123!' },
  { role: 'donor', label: 'Donor', email: 'donor@blooddono.demo', password: 'Demo123!' },
  { role: 'volunteer', label: 'Volunteer', email: 'volunteer@blooddono.demo', password: 'Demo123!' },
];
