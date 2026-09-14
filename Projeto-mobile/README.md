# Cinema App — Fase 1

Fundação mobile do sistema de cinema existente, em React Native, Expo e TypeScript. Esta fase entrega navegação pública, componentes reutilizáveis, design tokens e preparação do cliente HTTP. A demonstração não depende de backend nem de `.env`.

## Análise anterior à implementação

Foram analisados o backend, os models e o SQL, a aplicação web, os manifests de dependências, a rúbrica em `referencias` e o projeto React Native do professor. Os documentos de referência não ampliam o escopo autorizado desta fase.

- **Backend:** Express 5 e TypeScript, Sequelize 6 com MySQL (`mysql2`). Apesar de `pg` e `pg-hstore` constarem no manifest, o dialect ativo é `mysql`. O servidor escuta na porta 3000 e inicializa o banco antes de aceitar conexões.
- **Banco:** `usuarios`, `clientes`, `filmes`, `salas`, `assentos`, `sessoes`, `ingressos` e `pagamentos`. Sessões relacionam filme e sala; assentos pertencem a salas; ingressos relacionam sessão, cliente e assento; pagamentos referenciam ingressos. O SQL inicial não tem o CPF de `usuarios`, mas o model e a inicialização do servidor adicionam esse campo e seu índice. A ligação usuário/cliente é feita por email nos controllers, não por uma FK `id_usuario` em `clientes`. Esta análise é do código e do SQL, não uma inspeção do banco em execução.
- **Autenticação:** `POST /auth/login` recebe `email` e `senha`, compara bcrypt e retorna `{ token, user }`. JWT expira em 8 horas. O middleware espera `Authorization: Bearer <token>`. Administração aceita `admin` e o alias `adm`; o model também possui `funcionario` e `cliente`. Não se presume que funcionário seja administrador.
- **Web:** React 19.2, React Router e Create React App. A sessão usa `localStorage` e eventos de `window`; o service usa `fetch`. Esses mecanismos de navegador não foram transferidos para o mobile. A identidade existente tem fundo escuro e destaque âmbar, preservados conceitualmente aqui.
- **Professor:** referência para entrada `expo-router/entry`, layouts, organização de componentes e services, aliases TypeScript e ESLint Expo. Seu domínio, telas, assets, cores e endpoint não foram copiados. Não foram trazidos Drawer, animações, image picker ou SecureStore, sem uso nesta fase. Axios já inclui tipos, portanto `@types/axios` não é necessário.
- **Rúbrica:** esta fase inicia arquitetura/padronização e componentização/clean code. CRUD integrado, regras de negócio completas, segurança e validação entre dispositivos, documentação acadêmica/diagramas, Multer e controle funcional de perfis ainda precisam das próximas fases. A fundação não representa atendimento integral da rúbrica.

### Endpoints existentes, para orientar a integração futura

As rotas são definidas em `Projeto-back-end/src/app.ts`, sem prefixo `/api` no Express.

| Acesso | Rotas e métodos |
| --- | --- |
| Público | `GET /`; `POST /auth/login` |
| Catálogo público | `GET /catalogo/filmes`, `/catalogo/sessoes`, `/catalogo/assentos`, e `/:id` em cada recurso |
| Usuários | `GET` e `POST /users`, `GET /users/:id`; mesmos aliases em `/usuarios`; `PUT /users/:id` e `/usuarios/:id` exigem autenticação e edição do próprio usuário |
| Cliente autenticado | `GET` e `POST /clientes/me`; `GET /me/compras`; `GET` e `POST /ingressos`; `POST /pagamentos` |
| Administração | `GET` e `POST /clientes`, `GET /clientes/:id`; CRUD de `/filmes`, `/salas`, `/sessoes` (`GET` coleção e item, `POST`, `PUT /:id`, `DELETE /:id`) |
| Administração | `GET` e `POST /assentos`, `GET /assentos/:id`; `GET /ingressos/:id`; `GET /pagamentos` e `/pagamentos/:id` |

Não foi presumido que toda rota de usuário seja privada: as consultas acima estão públicas no código atual. Revisar isso na fase de segurança, assim como a configuração do segredo JWT. Nenhuma rota do backend foi alterada. A listagem de filmes retorna array sem paginação, ou `{ data, pagination }` quando há `page`/`limit`; os contratos deverão ser tipados quando usados.

## Versões e dependências

A fundação foi criada inicialmente com SDK 54, acompanhando o professor, e migrada para **Expo SDK 57** para funcionar no Expo Go do Android/Motorola usado na apresentação. O professor permanece como referência de arquitetura e boas práticas. As versões agora seguem a matriz oficial do SDK 57; o `package-lock.json` registra a árvore efetivamente instalada. Use `npm ci` para reproduzi-la.

React DOM e React Native Web permitem uma verificação complementar no navegador. A implementação das telas continua sendo React Native, usando `View`, `Text`, `Pressable`, `TextInput` e `StyleSheet`.

O alinhamento utiliza `npx expo install --fix`, em vez de escolher versões independentes para os módulos nativos. `expo-system-ui` continua aplicando o tema escuro no Android. As versões anteriores e atuais estão registradas na seção de migração ao final deste documento.

Referências oficiais: [compatibilidade do SDK 57](https://docs.expo.dev/versions/v57.0.0/), [atualização incremental](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/), [notas do SDK 55](https://expo.dev/changelog/sdk-55), [notas do SDK 56](https://expo.dev/changelog/sdk-56), [notas do SDK 57](https://expo.dev/changelog/sdk-57), [migração do Router](https://docs.expo.dev/router/migrate/sdk-55-to-56/) e [variáveis do Expo](https://docs.expo.dev/guides/environment-variables/).

## Arquitetura e arquivos importantes

```text
Projeto-mobile/
  app/
    _layout.tsx
    (public)/
      _layout.tsx
      index.tsx
      components.tsx
  components/
    Button.tsx
    Input.tsx
    Loading.tsx
    ErrorState.tsx
    EmptyState.tsx
    Screen.tsx
  constants/
    theme.ts
  services/
    api.ts
  .env.example
  .gitignore
  app.json
  eslint.config.js
  package.json
  package-lock.json
  tsconfig.json
```

| Pasta | Motivo |
| --- | --- |
| `app` | Apenas rotas e seus layouts, conforme a convenção do Expo Router. |
| `app/(public)` | Isola as telas públicas e permite inserir grupos irmãos futuramente. |
| `components` | Elementos visuais reutilizáveis, sem acesso ao banco ou regras de negócio. |
| `constants` | Fonte única de padrões visuais, evitando valores espalhados. |
| `services` | Fronteira de comunicação HTTP, independente das telas. |

Não foram criadas pastas vazias. `contexts` entrará quando houver estado global real, como sessão; `hooks`, quando houver comportamento reutilizável; `types`, quando contratos forem compartilhados; `utils`, quando houver funções gerais usadas de fato; `assets`, quando houver imagens/fontes próprias. Por enquanto, props ficam junto de seus componentes e a fonte é a nativa do sistema. O tema estático não precisa de Context nem de um hook.

## Como o Expo Router funciona

1. `package.json` aponta `main` para `expo-router/entry`, que inicia a aplicação e descobre arquivos em `app`.
2. `app/_layout.tsx` instala `SafeAreaProvider`, a barra de status clara e o Stack raiz.
3. `(public)` é um grupo organizacional: os parênteses não aparecem na URL. Seu `_layout.tsx` contém o Stack público.
4. `(public)/index.tsx` corresponde a `/`; `(public)/components.tsx` corresponde a `/components`.
5. O botão inicial chama `router.push('/components')`. O botão de retorno usa o histórico; se a tela foi aberta diretamente sem histórico, faz `router.replace('/')`.

Nas próximas fases, grupos irmãos `(auth)`, `(customer)` e `(admin)` poderão receber seus próprios layouts e telas. O provider de sessão ficará no layout raiz e as proteções dependerão de sessão e papel reais, com tratamento da restauração inicial. Grupos de rotas sozinhos **não são autorização**: o backend continuará validando o JWT e as permissões. Esses grupos ainda não foram criados para não registrar rotas vazias nem simular acesso protegido.

## Componentes e design system

- `Button`: recebe `title`, as props nativas de Pressable e `loading`. Oferece feedback ao pressionar, estado desabilitado e indicador de carregamento. Durante loading, impede novos cliques. Expõe papel, nome e estado para acessibilidade.
- `Input`: recebe `label`, `error` e props nativas de TextInput, incluindo `value`, `onChangeText`, `keyboardType` e `secureTextEntry`. Destaca foco e erro. O valor pertence à tela; o componente controla apenas o foco e não valida regras de negócio.
- `Loading`: combina ActivityIndicator com mensagem configurável.
- `ErrorState`: mostra uma mensagem e, se existir `onRetry`, reaproveita Button para tentar novamente.
- `EmptyState`: comunica ausência de conteúdo com título e descrição; não consulta dados.
- `Screen`: reaproveita SafeAreaView, rolagem, tratamento do teclado e margens. Cresce com flex; a largura é fluida e limitada apenas para leitura confortável em telas grandes. Alturas de controles são mínimas, permitindo texto maior.

`constants/theme.ts` centraliza cores semânticas, espaçamentos, raios, estilos tipográficos, tamanhos e opacidade de estado desabilitado. Exemplo: `theme.colors.primary` é âmbar e `theme.spacing.lg` define uma distância reutilizável. Alterar o token atualiza seus consumidores. Números estruturais como `flex: 1` e largura `100%` são regras de layout, não valores visuais arbitrários.

O tema é escuro nesta fase, com fundo de sala de cinema, destaque âmbar e texto claro. Não há fontes externas, dependência de medidas de um aparelho específico, CSS ou elementos HTML nas telas. A escala de fonte nativa permanece habilitada.

## API e configuração de ambiente

`services/api.ts` exporta `getApi()`. Na primeira chamada, lê `process.env.EXPO_PUBLIC_API_URL`, valida o endereço e cria uma instância Axios com baseURL, timeout de 15 segundos e `Accept: application/json`. Chamadas seguintes reutilizam a instância. Uma URL ausente ou inválida produz erro claro antes de qualquer requisição. Nenhuma tela desta fase chama o service.

A inicialização sob demanda permite executar e demonstrar a fundação sem ter configurado a API. Não há URL de fallback, token, persistência de sessão nem interceptor de autenticação. Na próxima fase, services específicos poderão chamar `getApi().get<T>(caminho)` e consumir `response.data`; `T` será o contrato real do endpoint.

Para preparar a configuração no PowerShell, dentro de `Projeto-mobile`:

```powershell
Copy-Item .env.example .env
```

Edite `.env` substituindo `SEU_IP_LOCAL` pelo IPv4 do computador. O exemplo `http://SEU_IP_LOCAL:3000` pressupõe que o backend esteja executando diretamente e acessível nessa porta. No celular, `localhost` é o próprio celular. O computador e o aparelho precisam se alcançar pela rede.

**O Docker Compose atual publica apenas as portas do Nginx (80/443), não a porta 3000 do backend.** Portanto, o exemplo não é um endereço imediatamente funcional para esse Docker. O proxy existente utiliza `https://cinema.local/api`; esse domínio e seu certificado precisam ser reconhecidos pelo dispositivo para integração futura. Não desative validação TLS e não suponha que o nome local do computador funcione no celular. A adaptação da exposição da API ficará para a fase de integração.

`.env.example` é o modelo versionado, sem valores pessoais; `.env` é a configuração local ignorada pelo Git. A regra existe também no `.gitignore` raiz. O Expo incorpora variáveis `EXPO_PUBLIC_*` no bundle: são públicas e não devem conter senhas, segredos JWT ou credenciais de banco. Reinicie o Expo e recarregue o aplicativo ao alterar o endereço. O código usa acesso direto à variável, necessário para a substituição pelo Expo.

## Executar e apresentar

Pré-requisito: Node compatível com SDK 57 (Node 22.13+; validado aqui com Node 24.14.0) e npm. No Android/Motorola, use o Expo Go compatível com SDK 57 já instalado no aparelho. Conecte celular e computador à mesma rede e escaneie o QR exibido pelo Metro. O SDK 57 suporta Android 7+ e iOS 16.4+; para compilar iOS localmente é necessário macOS com Xcode 26.4+. Caso use development build, ele precisa ser recompilado para SDK 57.

```powershell
cd "C:\Users\Flávio\Desktop\cinema-mobile\Projeto-mobile"
npm ci
npm run typecheck
npm run lint
npm start
```

Na primeira execução após a migração, use `npm start -- --clear` para limpar o cache antigo do Metro. A demonstração continua funcionando sem `.env` e sem backend.

Escaneie o QR com o cliente compatível, na mesma rede. `npm run android` abre um emulador Android instalado/configurado. `npm run ios` precisa de macOS/Xcode para o simulador; no Windows use um aparelho iOS com cliente compatível. `npm run web` serve como demonstração complementar, não substitui testes nativos.

Roteiro de comprovação:

1. Abra o aplicativo: devem aparecer “Cinema App”, a confirmação e o botão âmbar.
2. Toque “Testar componentes”: a mudança de tela comprova a navegação do Router.
3. Digite no Input; verifique teclado, foco e rolagem.
4. Toque “Alternar estado de demonstração”: vazio → carregando → erro → vazio. O loading é uma simulação manual, não uma requisição travada.
5. No erro, veja a mensagem do Input e toque “Tentar novamente” para retornar ao vazio. O botão indisponível não executa ação.
6. Volte ao início e repita usando o retorno do Android. Teste também orientação e fonte ampliada, observando margens e acesso aos botões por rolagem.
7. Mostre `theme.ts`, o layout raiz e o service para explicar a separação de responsabilidades. Demonstre que o aplicativo inicia mesmo sem `.env`.

TypeScript verifica os contratos; lint verifica padrões de código; Metro e exportação verificam compilação. Compatibilidade real de teclado, áreas seguras e leitores de tela exige execução em Android/iOS e não pode ser deduzida só desses checks.

Não há login, cadastro, CRUD, compra, pagamento, seleção de assento, Multer, painel administrativo ou Home definitiva nesta entrega.

## Histórico: validação inicial do SDK 54 em 14/09/2026

Ambiente: Windows, Node 24.14.0 e npm 11.9.0.

| Verificação | Resultado |
| --- | --- |
| Instalação | Concluída, com lockfile próprio do mobile. |
| `npm run typecheck` | Passou, sem erros. |
| `npm run lint` | Passou, sem erros ou avisos; mantém `--max-warnings=0`. |
| `npx expo install --check` | Consulta online passou: dependências compatíveis. |
| `npm start -- --offline --port 8081` | Metro iniciou e serviu a aplicação; encerrado após a validação. |
| `npx expo export --platform all` | Passou para Android, iOS e web, incluindo bytecode Hermes nativo. `dist` é ignorado pelo Git. Isso não gera APK/IPA nem executa um dispositivo. |
| Navegador | Abertura, navegação, digitação, loading, mensagens de erro, retry e retorno conferidos. Botão desabilitado reconhecido. Sem avisos/erros capturados no console. |
| Layout web em 390 × 844 | Sem transbordamento horizontal; é uma conferência complementar, não emulação nativa. |
| Service Axios | Verificação local rejeitou configuração vazia, URL inválida, protocolo FTP e placeholder; confirmou baseURL, timeout e reutilização. Não enviou requisições. |
| Git | Apenas `Projeto-mobile/` novo; branch preservada. Arquivos locais, dependências e exportações ignorados; `.env.example` incluído. |

**Problemas encontrados e tratados:** o sandbox bloqueou inicialmente rede/cache npm, a criação de `~/.expo` e o executável Hermes; as operações passaram ao serem repetidas com a permissão necessária. O lint inicialmente sinalizou `axios.create` como uso ambíguo de exportação; foi corrigido para o import nomeado `create`, sem remover a regra. O Expo ajustou automaticamente o `include` do tsconfig para os arquivos TypeScript existentes. As ferramentas emitiram avisos de variáveis de cor do terminal e de detecção de módulo no teste isolado com Node; não foram erros da aplicação.

**Auditoria histórica do SDK 54:** `npm audit --json` terminou com código 1 e registrou 25 vulnerabilidades (16 moderadas, 9 altas, nenhuma crítica), com caminhos em Expo/Metro, navegação e ferramentas de configuração. Naquele momento, a mudança de SDK estava fora do escopo. Este resultado descreve a instalação anterior e não substitui os resultados da migração abaixo. Também houve avisos de depreciação em dependências como ESLint 9, glob, inflight, rimraf e uuid.

Não foi executado aplicativo em aparelho ou emulador Android/iOS, nem validada uma conexão real mobile–API–banco. O roteiro manual acima permite continuar a comprovação em dispositivos compatíveis. Nenhum commit, push, merge ou troca de branch foi realizado.
