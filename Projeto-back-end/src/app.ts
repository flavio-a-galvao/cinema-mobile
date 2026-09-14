import express, { NextFunction, Request, Response, Router } from 'express';
import AuthController from './controllers/auth.controller';
import UsersController from './controllers/users.controller';
import { requireAdmin, requireAuth } from './middlewares/auth.middleware';
import ClientesController from './controllers/clientes.controller';
import ComprasController from './controllers/compras.controller';
import FilmesController from './controllers/filmes.controller';
import SalasController from './controllers/salas.controller';
import AssentosController from './controllers/assentos.controller';
import SessoesController from './controllers/sessoes.controller';
import IngressosController from './controllers/ingressos.controller';
import PagamentosController from './controllers/pagamentos.controller';

const app = express();
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});
app.use(express.json());

const router: Router = Router();

router.get('/', (req: Request, res: Response) => {
    res.send("Hello World (typescript)");
});

router.post('/auth/login', AuthController.login);

router.get('/catalogo/filmes', FilmesController.findAll);
router.get('/catalogo/filmes/:id', FilmesController.getById);
router.get('/catalogo/sessoes', SessoesController.findAll);
router.get('/catalogo/sessoes/:id', SessoesController.getById);
router.get('/catalogo/assentos', AssentosController.findAll);
router.get('/catalogo/assentos/:id', AssentosController.getById);

router.get('/users', UsersController.findAll);
router.post('/users', UsersController.create);
router.get('/users/:id', UsersController.getById);
router.put('/users/:id', requireAuth, UsersController.update);

router.get('/usuarios', UsersController.findAll);
router.post('/usuarios', UsersController.create);
router.get('/usuarios/:id', UsersController.getById);
router.put('/usuarios/:id', requireAuth, UsersController.update);

router.get('/clientes', requireAuth, requireAdmin, ClientesController.findAll);
router.post('/clientes', requireAuth, requireAdmin, ClientesController.create);
router.get('/clientes/me', requireAuth, ClientesController.getMyProfile);
router.post('/clientes/me', requireAuth, ClientesController.upsertMyProfile);
router.get('/clientes/:id', requireAuth, requireAdmin, ClientesController.getById);

router.get('/me/compras', requireAuth, ComprasController.findMyPurchases);

router.get('/filmes', requireAuth, requireAdmin, FilmesController.findAll);
router.post('/filmes', requireAuth, requireAdmin, FilmesController.create);
router.get('/filmes/:id', requireAuth, requireAdmin, FilmesController.getById);
router.put('/filmes/:id', requireAuth, requireAdmin, FilmesController.update);
router.delete('/filmes/:id', requireAuth, requireAdmin, FilmesController.delete);

router.get('/salas', requireAuth, requireAdmin, SalasController.findAll);
router.post('/salas', requireAuth, requireAdmin, SalasController.create);
router.get('/salas/:id', requireAuth, requireAdmin, SalasController.getById);
router.put('/salas/:id', requireAuth, requireAdmin, SalasController.update);
router.delete('/salas/:id', requireAuth, requireAdmin, SalasController.delete);

router.get('/assentos', requireAuth, requireAdmin, AssentosController.findAll);
router.post('/assentos', requireAuth, requireAdmin, AssentosController.create);
router.get('/assentos/:id', requireAuth, requireAdmin, AssentosController.getById);

router.get('/sessoes', requireAuth, requireAdmin, SessoesController.findAll);
router.post('/sessoes', requireAuth, requireAdmin, SessoesController.create);
router.get('/sessoes/:id', requireAuth, requireAdmin, SessoesController.getById);
router.put('/sessoes/:id', requireAuth, requireAdmin, SessoesController.update);
router.delete('/sessoes/:id', requireAuth, requireAdmin, SessoesController.delete);

router.get('/ingressos', requireAuth, IngressosController.findAll);
router.post('/ingressos', requireAuth, IngressosController.create);
router.get('/ingressos/:id', requireAuth, requireAdmin, IngressosController.getById);

router.get('/pagamentos', requireAuth, requireAdmin, PagamentosController.findAll);
router.post('/pagamentos', requireAuth, PagamentosController.create);
router.get('/pagamentos/:id', requireAuth, requireAdmin, PagamentosController.getById);

app.use(router);

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(error);

    if (res.headersSent) {
        return next(error);
    }

    return res.status(500).json({ message: 'Erro interno do servidor.' });
});

export default app;