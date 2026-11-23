# AI Trading Intelligence

Dashboard web responsivo para monitorização de mercados e simulação educativa de estratégias técnicas.

## O que está implementado
- 10 pares de criptoativos via Binance REST e WebSocket público.
- Estratégia experimental EMA 9/21, RSI 14 e filtro de volume com candles de 5 minutos.
- Estados de entrada, pré-alerta, saída e indisponibilidade de dados.
- Paper trading local com abertura/fecho simulado, posições abertas, P/L realizado e não realizado.
- 10 ações dos EUA com integração opcional Finnhub (chave do próprio utilizador).
- Alertas no painel e notificações do navegador mediante autorização.
- Capital e risco por posição configuráveis para a simulação.
- Interface adaptável a telemóvel.

## Publicação Cloudflare
O ficheiro `wrangler.toml` configura os ativos estáticos em `./public`. O ponto de entrada do site é `public/index.html`. O comando de deploy configurado no projeto Cloudflare é `npx wrangler deploy`.

## Configurar ações
1. Criar uma chave API no fornecedor Finnhub.
2. No separador **Ações EUA**, inserir a chave e guardar.
3. Carregar em **Atualizar ações**.
A disponibilidade dos candles/quotes depende do plano, do mercado e dos limites do fornecedor. A chave fica no armazenamento local do navegador; não é enviada para este repositório.

## Limitações e segurança
- A aplicação não se liga a corretoras nem envia ordens reais.
- Paper trading é local ao navegador/dispositivo e pode ser perdido se os dados locais forem apagados.
- Não existe autenticação de utilizadores nem sincronização entre dispositivos.
- As cotações dependem de fornecedores externos, conectividade, CORS, limites e disponibilidade.
- Os sinais são regras técnicas experimentais; não são previsões, aconselhamento financeiro ou garantia de lucro.
- Nunca introduza palavras-passe, chaves privadas ou credenciais de corretoras neste painel.
