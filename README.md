# LinkIndex PRO

**Indexador Automático de Links - Estilo LinkCentaur**

Uma ferramenta completa para indexação automática de links que funciona localmente no seu navegador com back-end Node.js embutido.

## 🚀 Características

- **Interface Web Responsiva**: Interface moderna e intuitiva que funciona em desktop e mobile
- **Processamento em Tempo Real**: Log em tempo real com barra de progresso
- **Múltiplas Funcionalidades de Indexação**:
  - Envio de pings para serviços como Ping-o-Matic, Feedburner, etc.
  - Criação automática de arquivo RSS
  - Publicação em serviços gratuitos (Pastebin, JustPaste.it)
  - Geração de links encurtados (TinyURL, is.gd)
  - Criação de backlinks em HTML local
  - Simulação de tráfego com user-agents variados
  - Verificação de indexação no Google

## 📋 Pré-requisitos

- **Node.js** versão 14 ou superior
- **npm** (incluído com Node.js)
- Navegador web moderno (Chrome, Firefox, Safari, Edge)

## 🛠️ Instalação e Execução

### 1. Extrair o arquivo

Extraia o arquivo `LinkIndex_PRO.zip` em uma pasta de sua escolha.

### 2. Instalar dependências

Abra o terminal/prompt de comando na pasta extraída e execute:

```bash
npm install
```

### 3. Iniciar a aplicação

```bash
npm start
```

Ou diretamente:

```bash
node server.js
```

### 4. Acessar a interface

Abra seu navegador e acesse:

```
http://localhost:3000
```

## 📖 Como Usar

### 1. Adicionar URLs

- Cole suas URLs na área de texto, uma por linha
- As URLs devem incluir o protocolo (http:// ou https://)
- Exemplo:
  ```
  https://exemplo1.com
  https://exemplo2.com
  https://exemplo3.com
  ```

### 2. Configurar Opções

Marque/desmarque as opções conforme necessário:

- **Simular Tráfego**: Envia requisições HEAD/GET para simular visitas
- **Verificar Indexação**: Verifica se as URLs já estão indexadas no Google
- **Criar RSS**: Gera um arquivo RSS com as URLs
- **Criar Backlinks**: Cria uma página HTML com links para as URLs

### 3. Iniciar Processamento

- Clique em "Iniciar Indexação"
- Acompanhe o progresso em tempo real
- Visualize os logs detalhados
- Veja os resultados ao final

### 4. Arquivos Gerados

Os arquivos são salvos na pasta `output/`:

- **links.xml**: Feed RSS com as URLs
- **backlinks.html**: Página HTML com backlinks
- **Log**: Pode ser salvo clicando em "Salvar Log"

## 🔧 Funcionalidades Detalhadas

### Ping Services

Envia notificações XML-RPC para os seguintes serviços:
- Ping-o-Matic
- Google Blog Search
- Feedburner
- BlogDigger
- NewsGator

### Encurtamento de URLs

Gera versões encurtadas usando:
- TinyURL
- is.gd

### Simulação de Tráfego

- Múltiplas requisições com user-agents diferentes
- Headers realistas para simular navegadores reais
- Delay entre requisições para evitar bloqueios

### Verificação de Indexação

- Usa o operador `site:` do Google
- Verifica se o domínio já está nos resultados de busca
- Relatório detalhado por URL

## 📁 Estrutura do Projeto

```
LinkIndex_PRO/
├── server.js              # Servidor Node.js principal
├── package.json           # Dependências e scripts
├── public/                # Arquivos do front-end
│   ├── index.html        # Interface principal
│   ├── style.css         # Estilos CSS
│   └── script.js         # Lógica JavaScript
├── output/               # Arquivos gerados (criado automaticamente)
│   ├── links.xml         # Feed RSS
│   └── backlinks.html    # Página de backlinks
└── README.md             # Este arquivo
```

## 🌐 API Endpoints

A aplicação expõe os seguintes endpoints:

- `POST /api/process-urls`: Processa as URLs fornecidas
- `GET /api/files`: Lista arquivos gerados
- `GET /api/download/:file`: Download de arquivos gerados

## ⚙️ Configurações Avançadas

### Porta do Servidor

Para alterar a porta padrão (3000), defina a variável de ambiente `PORT`:

```bash
PORT=8080 node server.js
```

### Proxies (Opcional)

O código está preparado para suporte a proxies. Para implementar:

1. Edite o arquivo `server.js`
2. Adicione configuração de proxy nas requisições axios
3. Configure as variáveis de ambiente necessárias

## 🚨 Limitações e Considerações

### Rate Limiting

- Alguns serviços podem ter limitações de taxa
- A aplicação inclui delays para evitar bloqueios
- Use com moderação para evitar banimentos

### Serviços Externos

- Alguns serviços podem estar indisponíveis temporariamente
- A publicação em Pastebin e JustPaste.it está simulada (requer API keys)
- Para uso em produção, configure as APIs necessárias

### Verificação de Indexação

- A verificação do Google pode ser limitada por CAPTCHAs
- Resultados podem variar dependendo da localização
- Use com moderação para evitar bloqueios

## 🔒 Segurança

- A aplicação roda localmente (localhost)
- Não armazena dados pessoais
- Logs são mantidos apenas localmente
- Nenhuma informação é enviada para servidores externos além dos serviços de indexação

## 🐛 Solução de Problemas

### Erro "EADDRINUSE"

Se a porta 3000 estiver em uso:

```bash
# Encontrar processo usando a porta
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # macOS/Linux

# Matar o processo ou usar outra porta
PORT=3001 node server.js
```

### Erro de Dependências

```bash
# Limpar cache e reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### URLs não processadas

- Verifique se as URLs incluem http:// ou https://
- Certifique-se de que as URLs são válidas
- Verifique a conexão com a internet

## 📝 Logs e Debugging

### Logs do Servidor

Os logs do servidor aparecem no terminal onde você executou `node server.js`.

### Logs da Interface

- Use o log em tempo real na interface
- Salve logs importantes clicando em "Salvar Log"
- Use as ferramentas de desenvolvedor do navegador (F12) para debugging

## 🔄 Atualizações

Para atualizar a aplicação:

1. Faça backup dos arquivos da pasta `output/`
2. Substitua os arquivos da aplicação
3. Execute `npm install` novamente
4. Reinicie o servidor

## 📞 Suporte

Esta é uma ferramenta de código aberto. Para problemas:

1. Verifique os logs de erro
2. Consulte a seção de solução de problemas
3. Verifique se todas as dependências estão instaladas
4. Teste com URLs simples primeiro

## 📄 Licença

MIT License - Livre para uso pessoal e comercial.

## 🎯 Versão

**LinkIndex PRO v1.0.0**

---

**Desenvolvido para automação de indexação de links - Use com responsabilidade!**

