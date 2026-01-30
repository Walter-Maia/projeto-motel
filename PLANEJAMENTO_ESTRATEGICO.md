# MONTBLANC — IDEIAS PARA REDUZIR DESPESAS E AUMENTAR LUCRO (ESQUELETO DO PROJETO)
Versão: rascunho (ideias / backlog)
Objetivo: anexar este TXT ao projeto para orientar as próximas alterações.

========================================
0) COMO O PROJETO ESTÁ HOJE (referência rápida)
========================================
- Sistema principal (gerência): páginas "Início", "Quartos", "Cozinha", "Estoque", "Segurança".
- Cliente (display pequeno): pedidos (cardápio), acompanhar pedidos e "Minha Conta" + solicitar fechamento.
- Persistência: localStorage (quartos, estoque, pratos, pedidos, histórico, notificações).
Observação: é um esqueleto — implementar por etapas e validar no uso real.

========================================
1) META: REDUZIR DESPESAS (CUSTO) — MÓDULOS NOVOS
========================================

1.1) MÓDULO “COMPRAS / FORNECEDORES” (comparar preços por fornecedor)
------------------------------------------------
Problema: compras feitas “no automático” geram desperdício de dinheiro (itens mais caros, frete mal calculado, falta de histórico).
Solução: uma tela onde o gerente cadastra fornecedores e preços, e o sistema calcula:
- qual fornecedor tem o melhor preço por item;
- qual combinação dá menor total (considerando frete/taxa mínima);
- quanto economizou vs “preço padrão”/última compra.

A) ENTIDADES (localStorage sugerido)
- fornecedores[]:
  - id, nome, tipo (supermercado/distribuidora/fabricante), contato, endereço,
    frete (fixo/por faixas), pedidoMinimo, prazoEntrega, observações
  - exemplo: "Villefort", "Mart Minas", "Ambev" etc.
- cotacoes[]:
  - id, fornecedorId, itemEstoqueId, precoUnitario, unidade,
    dataColeta, validade (opcional), observacao (ex: “promoção”)
- comprasPlanejadas[] (carrinho):
  - id, itens: [{itemEstoqueId, quantidadeDesejada, unidade}], estratégia, data

B) TELAS / FLUXO
- Tela 1: Cadastro de Fornecedor (CRUD).
- Tela 2: Cotação Rápida (seleciona item do estoque + preço por fornecedor).
- Tela 3: “Carrinho de Compras”
  - o gerente seleciona itens do ESTOQUE e quantidades (ex: repor até 2x do mínimo)
  - botão: “Calcular melhor opção”
  - Resultado 1: “Mais barato por item” (mix de fornecedores) -> lista por fornecedor
  - Resultado 2: “Menos fornecedores (reduz frete)” -> total por fornecedor (com frete/pedido mínimo)
  - Exportar: imprimir/gerar texto “Lista de compras por fornecedor”

C) REGRAS / CÁLCULOS IMPORTANTES
- Se “validade” da cotação venceu, ignorar.
- Se fornecedor tem pedido mínimo, avisar quando total de compra ficar abaixo.
- Se fornecedor cobra frete, somar no total ou aplicar faixas.
- Histórico de preços: salvar “último preço pago” por item para medir economia.
- Sugestão automática de compra: se estoque <= mínima → sugerir repor.

D) GANHO DIRETO
- Economiza no CMV (custo de mercadoria vendida) e reduz “correria” (compras urgentes mais caras).
- Diminui “falta de item” que impede venda (perda de receita).

------------------------------------------------

1.2) “CUSTO POR PRATO” + “MARGEM” (reduzir desperdício e aumentar lucro real)
------------------------------------------------
Hoje o prato usa ingredientes do estoque.
Melhorar adicionando:
- estoque.item.custoUnitario (R$ por unidade do item)
- prato.custoEstimado = soma(ingrediente.quantidade * custoUnitario)
- prato.margem = valorVenda - custoEstimado
- prato.margemPercent = margem / valorVenda

Tela/relatório:
- lista de pratos com: valorVenda, custo, margem, alerta de baixa margem
- “top 10” pratos mais lucrativos e os que mais dão trabalho e pouco lucro

Uso:
- ajustar preços com base em margem real
- remover/otimizar itens que dão prejuízo ou margem baixa

------------------------------------------------

1.3) ESTOQUE INTELIGENTE (comprar certo e evitar perda)
------------------------------------------------
Aprimorar estoque com:
- “Consumo médio/dia” por item (calculado pelo histórico de pedidos)
- “dias de cobertura” = quantidadeAtual / consumoMedioDia
- “ponto de reposição” (lead time de entrega * consumo + segurança)
- alertas:
  - estoque baixo (já existe) + “vai acabar em X dias”
  - itens com baixa rotatividade (parados há 30/60/90 dias)
  - itens vencendo (se adicionar validade por lote)

Extra:
- Registrar “perda/avaria” (quebra, vencimento) para medir desperdício.

========================================
2) META: AUMENTAR LUCRO — UPSSELL, PERSONALIZAÇÃO, SERVIÇOS
========================================

2.1) “PRODUTO PERSONALIZÁVEL” — COPÃO (o cliente monta)
------------------------------------------------
Ideia: gerente cadastra um “produto base” (Copão) e o cliente monta com adicionais disponíveis.

A) ENTIDADES
- produtosBase[] (ex: Copão 500ml / 700ml):
  - id, nome, precoBase, volume, maxAdicionais, imagem (opcional), ativo
- adicionais[] (itens selecionáveis):
  - id, nome, estoqueId (link com item do estoque), consumo (qtd por adicional),
    precoExtra, categoria (bebida/energético/gelo/fruta etc), ativo
- pedidosPersonalizados[] (ou tratar como pedido normal):
  - id, quartoId, tipo: 'copao', baseId, adicionaisEscolhidos[], valorTotal, status, timestamp

B) LÓGICA
- Verificar estoque de cada adicional (igual já faz com ingredientes).
- Dar baixa no estoque conforme “consumo” do adicional.
- Preço = precoBase + soma(precoExtra).
- Margem: usar custoUnitario do estoque e calcular lucro do copão.

C) UI (CLIENTE COM DISPLAY PEQUENO)
- Fluxo em 3 passos com botões grandes:
  1) Selecionar tamanho do copão (bases).
  2) Selecionar adicionais (até max) — mostrar “Selecionados: 2/5”.
  3) Confirmar pedido (mostrar preço final e tempo estimado).
- Importante: evitar listas enormes. Mostrar só os “ativos” + “mais vendidos” primeiro.

D) GANHO DIRETO
- Personalização aumenta ticket médio
- “Adicionais” têm margem alta

------------------------------------------------

2.2) “CATÁLOGO DE SERVIÇOS EXTRAS” (alternativa segura e legal)
------------------------------------------------
Observação importante:
- Não implementar funcionalidades para intermediar “serviços sexuais” ou “seleção de pessoas para fins ilegais”.
- Porém, é viável (e recomendado) ter um catálogo de serviços/amenidades LEGAIS do motel.

Exemplos de itens do catálogo (alto lucro / baixo custo):
- Kit higiene premium (escova, pasta, etc.)
- Troca extra de toalhas/roupão
- Decoração romântica (pétalas, velas LED, balões)
- Late checkout (cobrança por hora extra)
- Limpeza express / limpeza extra
- Itens do mini bar (snacks) com margem alta
- “Combo” (bebida + snack + gelo)
- “Surpresa/Presente” (chocolate, vinho sem álcool, etc. conforme regra do local)

A) ENTIDADES
- servicos[]: id, nome, descricaoCurta, preco, tempoEstimado, ativo, imagem (opcional)
- solicitacoesServico[]: id, quartoId, servicoId, status, timestamp, observacoes

B) UI
- No cliente: tela semelhante a pedir comida (cards grandes).
- No gerente/portaria: fila de solicitações + botão “aceitar / em execução / concluído”.

------------------------------------------------

2.3) “PROMOÇÕES / PRECIFICAÇÃO INTELIGENTE”
------------------------------------------------
- Regras por dia/horário: segunda a quinta mais barato; sexta/sábado mais caro.
- Cupom automático em horários mortos (“Happy Hour” de copão, combo de pratos).
- Upgrade de suíte (vago -> oferecer upgrade com desconto) para aumentar ocupação e ticket.

------------------------------------------------

2.4) “COMBOS” E “RECOMENDAÇÕES AUTOMÁTICAS” (aumenta ticket sem poluir UI)
------------------------------------------------
Meta: quando o cliente escolher um item, sugerir 1–2 complementos (botões grandes).
Exemplos:
- Bebida -> “Adicionar gelo?” / “Adicionar energético?”
- Prato -> “Adicionar sobremesa?” / “Adicionar bebida?”
- Copão -> “Adicionar dose extra?” / “Adicionar fruta?”

Regras:
- Mostrar no máximo 2 sugestões (display pequeno).
- Priorizar itens com alta margem e estoque sobrando (baixa rotatividade).

2.5) “UPGRADE” E “HORA EXTRA” COM PRECIFICAÇÃO DINÂMICA
------------------------------------------------
- Se ocupação baixa, oferecer upgrade com desconto (ex: Deluxe -> VIP)
- Se ocupação alta, aplicar preço cheio e sugerir “hora extra” com taxa premium
- Ofertas guiadas no checkout (“Quer mais 1h por R$ X?”)

2.6) “AGENDA DE RESERVA” (se for aplicável) + TAXA DE NO-SHOW
------------------------------------------------
- Reservas para horários de pico (Dia dos Namorados, feriados)
- Cobrança de sinal (PIX) com prazo, para reduzir no-show
- “Lista de espera” e notificação quando suíte ficar disponível

2.7) “PROGRAMA DE FIDELIDADE” SIMPLES (sem complicar)
------------------------------------------------
- Pontos por consumo (ex: a cada R$ X = 1 ponto)
- Troca por benefícios (hora extra, upgrade, bebida, desconto)
- No display pequeno, mostrar só: “Saldo de pontos + resgatar”

2.8) “CUPONS” POR CANAL / PARCERIAS
------------------------------------------------
- Cupom por parceiro (taxi, app de mobilidade, bar, restaurante)
- Cupom por indicação (cliente indica outro → ambos ganham benefício)
- Rastreamento: relatório de cupons mais usados e melhor retorno.

2.9) “SERVIÇOS DE ALTA MARGEM” (catálogo legal, reforçando)
------------------------------------------------
- Decoração “romântica” em 3 níveis (básico / premium / luxo)
- Cesta surpresa / chocolates / flores (fornecedores locais)
- Pacote “aniversário” ou “pedido de namoro” (setup + late checkout)
- “Cinema no quarto” (pipoca/snacks + aluguel de projetor/streaming interno, se houver)

2.10) “FRAUDE / VAZAMENTO DE RECEITA” (evita perda invisível)
------------------------------------------------
- Auditoria de descontos: registrar quem aplicou e por quê
- “Itens cancelados” no pedido: logar e reportar
- “Saída sem fechamento”: alerta para gerente
- Relatório de divergência (consumo vs baixa de estoque) -> suspeita de perda.


========================================
3) PORTARIA / QUARTOS — VISUALIZAÇÃO RÁPIDA (pré-visualização do quarto)
========================================
Meta: uma tela separada para portaria ver “vagos” e selecionar rápido, com prévia do quarto.

3.1) PÁGINA “PORTARIA” (ou “MAPA DE QUARTOS”)
- Mostrar apenas “Vagos” com cards grandes.
- Ao clicar, abrir modal com:
  - fotos (carrossel simples)
  - comodidades (lista curta: ar, hidro, frigobar, etc.)
  - valor/hora e valor extra
  - botão “Selecionar este quarto” (marcar como ocupado e iniciar uso)

3.2) CAMPOS NOVOS NO QUARTO
- fotos[] (urls/base64), descricao, comodidades[], tipo (VIP/Deluxe/Standard)
- tempoLimpezaPadrao (min) para prever quando fica pronto
- observacoesDeManutencao (para travar venda se tiver problema)

3.3) BENEFÍCIO
- mais agilidade na portaria (menos erro)
- reduz tempo de quarto parado (aumenta ocupação → aumenta receita)

========================================
4) REDUÇÃO DE CUSTO “OPERACIONAL” (checklists + manutenção)
========================================
4.1) CHECKLIST DE LIMPEZA (padrão e por tipo de suíte)
- checklistTemplates[]: por tipo
- limpezaRegistros[]: quartoId, funcionario, inicio/fim, observacoes, itens repostos
- Métrica: tempo médio de limpeza por suíte
- Alerta: se uma suíte “limpando” passar do tempo padrão

4.2) MANUTENÇÃO PREVENTIVA
- chamados[]: quartoId, tipo (hidro/ar/chuveiro/tv), prioridade, status, fotos
- travar quarto como “manutenção” (novo status) quando necessário
- evita prejuízo por dano maior e reclamações

4.3) CONSUMO DE ENERGIA / “DESLIGAR AUTOMÁTICO” (ideia de processo)
- Checklist “desligar ar/TV/luzes” ao mudar status para “vago/limpando”
- Meta: reduzir conta de energia (processo + auditoria)

========================================
5) RELATÓRIOS NOVOS (para decisões que aumentam margem)
========================================
5.1) RELATÓRIO “LUCRO BRUTO”
- Receita total (já existe)
- Custo estimado (pratos + copão + serviços usando custoUnitario)
- Lucro bruto e margem %
- Top lucrativos vs top vendidos
- Itens com desperdício (perda/avaria)

5.2) RELATÓRIO “FORNECEDORES / ECONOMIA”
- economia mensal por trocar fornecedor
- itens campeões de economia
- “preço médio” por item ao longo do tempo

5.3) TELA “FINANCEIRO” (filtros por ano/mês/dia + datas especiais)
------------------------------------------------
Objetivo: permitir que o gerente enxergue rapidamente o que mais dá retorno e o que mais gira,
para decidir promoções, compras e preço.

A) FILTROS
- Período:
  - Ano / Mês / Dia (seleção simples)
  - Intervalo personalizado (data início/fim) [opcional]
- Atalhos de “Datas Especiais” (com comparativo):
  - Natal (25/12)
  - Ano Novo (31/12 e 01/01)
  - Dia dos Namorados (12/06) [Brasil]
  - Carnaval (datas variáveis) [opcional]
  - Feriados locais (cadastrar manualmente)
- Comparar com:
  - mesmo período do mês anterior
  - mesmo período do ano anterior

B) KPIs PRINCIPAIS (cards grandes)
- Receita total do período
- Ticket médio (receita / nº de check-ins ou / nº de pedidos)
- Ocupação média (quartos ocupados / total)
- Tempo médio de permanência
- Receita por suíte (VIP/Deluxe/Standard)
- Receita por categoria de produto (bebidas, pratos, adicionais, serviços)
- Lucro bruto estimado (se custoUnitario estiver preenchido no estoque)

C) “TOP” LISTAS (o que aparece pra decisão rápida)
- Suítes mais utilizadas / mais lucrativas (por valor e por margem)
- Produtos mais pedidos (top 10)
- Produtos com maior lucro (top 10) [precisa custo]
- Horários de pico (heatmap simples por hora)
- Dias da semana mais fortes (seg–dom)
- Itens com baixa margem (alerta)
- Itens com alta devolução/perda (se registrar avaria)

D) VISUAL (SEM COMPLICAR)
- Gráfico simples de barras por dia do mês (receita diária)
- Tabela “Top Suítes” e “Top Produtos”
- Botão “Exportar resumo” (texto/CSV) para WhatsApp/planilha

E) DADOS NECESSÁRIOS (já existem ou fáceis de derivar)
- Histórico de pedidos (já existe como “historicoPedidos”)
- Check-in/checkout ou status de quarto (se não houver, registrar “entrada/saída”)
- Preços dos itens e (ideal) custoUnitario para margem

F) BENEFÍCIO
- Toma decisão de preço e promoções com base em dados
- Ajuda a focar no que realmente aumenta a margem

========================================
6) UI/UX — CLIENTE COM DISPLAY PEQUENO (importante)
========================================
Regras para a interface do cliente:
- Botões grandes (touch), pouco texto, fonte alta.
- Fluxos curtos e guiados (passo 1/2/3).
- “Voltar” e “Cancelar” sempre visíveis.
- Timeout: se ficar parado 30–60s, volta para home.
- Evitar rolagem longa: usar categorias + “mais vendidos”.
- Confirmar sempre antes de criar pedido (já existe modal).

========================================
7) PONTOS DE IMPLEMENTAÇÃO (para o dev)
========================================
- Criar novas páginas no menu (index.html):
  - Compras/Fornecedores
  - Portaria
  - Serviços (catálogo)
  - Financeiro/Relatórios (opcional)
- Adicionar novos managers no script.js (padrão do projeto):
  - FornecedoresManager
  - ComprasManager
  - PortariaManager
  - ServicosManager
  - ProdutosPersonalizaveisManager (Copão)
- Reaproveitar lógica existente:
  - Baixa no estoque e validação (já feita no cliente e na gerência)
  - Notificações (cliente solicita fechamento → notificação no dashboard)
- Regras de permissão (futuro):
  - Login/roles: gerente vs funcionário (o esqueleto pode prever isso)
  - Auditoria: registrar “quem alterou preço/estoque/prato”

========================================
8) BACKLOG RÁPIDO (ordem sugerida)
========================================
1) Portaria (pré-visualização + selecionar quarto)  [impacto rápido]
2) Compras/Fornecedores (cadastro + cotação + cálculo) [reduz custo]
3) Custo por prato + margem [melhora preço e cardápio]
4) Copão personalizável [aumenta ticket médio]
5) Catálogo de serviços legais [upsell]
6) Checklists e manutenção [reduz custo operacional]

========================================
9) NOTAS FINAIS
========================================
- Este TXT é um guia. Ajustar conforme regras internas do motel e legislação local.
- Qualquer funcionalidade que envolva dados pessoais (foto, cadastro etc.) precisa de cuidado com privacidade e consentimento.


========================================
10) PLAYBOOK DE DATAS ESPECIAIS (para aumentar receita sem virar caos)
========================================
- Criar “Pacotes” prontos (um clique) no Financeiro/Configurações:
  - Pacote Dia dos Namorados: Suíte X + Decoração + Copão + Snack
  - Pacote Ano Novo: Suíte + late checkout + combo bebidas
- Pré-cadastro de estoque mínimo por evento:
  - gelo, energético, copos, itens de decoração, toalhas extras
- Regra de preço por evento:
  - faixa de preço e limite de ocupação (quando faltar pouco, preço ajusta)
- Checklists de operação:
  - limpeza reforçada, reposição, manutenção preventiva 1 semana antes
- Indicadores pós-evento:
  - receita do evento, ticket médio, itens mais vendidos, faltas no estoque
