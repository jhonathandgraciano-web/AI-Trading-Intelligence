# AI Trading Intelligence

Aplicativo independente e adaptável a celular para monitorização de mercados.

## Implementação inicial
- Cotações públicas de criptoativos via Binance REST + WebSocket.
- Análise técnica experimental com EMA 9/21, RSI 14 e confirmação de volume em candles de 5 minutos.
- Estados de pré-alerta, entrada e saída apresentados no painel.
- Simulação local de posições (paper trading); não envia ordens.
- Lista inicial de 10 ações dos EUA, ainda sem feed conectado nesta versão.

## Limitações importantes
- A cotação cripto é atualizada via feed público, mas a estratégia só é reavaliada após o fechamento de candles de 5 minutos.
- A integração de ações exige um fornecedor e uma chave API; cotações gratuitas podem ser atrasadas ou limitadas.
- Não há ligação a corretora, execução automática real, autenticação de utilizadores ou notificações push nesta versão.
- Os sinais são regras técnicas experimentais, não previsões nem garantias de lucro.

## Executar
Abra `index.html` num navegador moderno ou publique como site estático (por exemplo, Cloudflare Pages).

Nunca coloque chaves de corretora ou segredos de negociação no código do navegador. Não use o painel como única base para decisões financeiras.
