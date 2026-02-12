
declare module '*.hbs?raw' {
  const content: string;
  export default content;
}

interface User {
  id?: number;
  login: string;
  email: string;
  phone: string;
  first_name?: string;
  second_name?: string;
  display_name?: string;
}

interface FormData {
  [key: string]: string;
}
