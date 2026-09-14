export {};

declare module "express-serve-static-core" {
  interface Request {
    authUser?: {
      id_usuario: number;
      email: string;
      tipo_usuario: string;
    };
  }
}
