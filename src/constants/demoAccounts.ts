export type DemoAccount = {
  role: 'admin' | 'user';
  label: string;
  email: string;
  password: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'admin', label: 'Admin', email: 'admin@blooddono.demo', password: 'Demo123!' },
  { role: 'user', label: 'User', email: 'donor@blooddono.demo', password: 'Demo123!' },
];
