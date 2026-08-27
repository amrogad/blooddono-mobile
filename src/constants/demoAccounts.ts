export type DemoAccount = {
  role: 'user';
  label: string;
  email: string;
  password: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'user', label: 'User', email: 'donor@blooddono.demo', password: 'Demo123!' },
];
