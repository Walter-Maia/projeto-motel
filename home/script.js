// Dados Globais
let quartos = JSON.parse(localStorage.getItem('quartos')) || [];
let estoque = JSON.parse(localStorage.getItem('estoque')) || [];
let pratos = JSON.parse(localStorage.getItem('pratos')) || [];
let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
let historico = JSON.parse(localStorage.getItem('historico')) || [];

// Theme Manager
class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem('theme') || 'light';
    this.themeToggle = document.querySelector('.theme-toggle');
    this.init();
  }

  init() {
    this.applyTheme();
    this.themeToggle.addEventListener('click', () => this.toggleTheme());
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    localStorage.setItem('theme', this.theme);
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme();
  }
}

// Sidebar
class Sidebar {
  constructor() {
    this.sidebar = document.querySelector('.sidebar');
    this.toggleBtn = document.querySelector('.toggle-btn');
    this.navLinks = document.querySelectorAll('.nav-list a');
    this.sections = document.querySelectorAll('.page');
    this.themeToggle = document.querySelector('.theme-toggle');
  }

  handleToggle() {
    this.sidebar.classList.toggle('collapsed');
  }

  handleNavClick(e) {
    e.preventDefault();
    this.navLinks.forEach(link => link.classList.remove('active'));
    e.currentTarget.classList.add('active');

    this.sections.forEach(section => section.classList.remove('active'));
    
    let sectionId = e.currentTarget.getAttribute('data-page');
    let section = document.getElementById(sectionId);
    section.classList.add('active');

    if (sectionId === 'inicio') {
      this.themeToggle.classList.remove('hidden');
      dashboardManager.atualizar();
    } else {
      this.themeToggle.classList.add('hidden');
    }

    if (sectionId === 'cozinha') {
      cozinhaManager.renderizar();
    }
  }

  init() {
    this.toggleBtn.addEventListener('click', () => this.handleToggle());
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => this.handleNavClick(e));
    });
  }
}

// Dashboard Manager
class DashboardManager {
  constructor() {
    this.checkInterval = null;
  }

  iniciar() {
    this.atualizar();
    this.checkInterval = setInterval(() => this.verificarNotificacoes(), 10000);
  }

  verificarNotificacoes() {
    const notificacoes = JSON.parse(localStorage.getItem('notificacoes')) || [];
    const naoLidas = notificacoes.filter(n => !n.lida);
    
    const container = document.getElementById('notificacoesContainer');
    
    if (naoLidas.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = naoLidas.map(notif => `
      <div class="notificacao">
        <div class="notificacao-conteudo">
          <h3>🔔 Solicitação de Fechamento de Conta</h3>
          <p><strong>${notif.quartoNome}</strong> solicitou fechamento da conta</p>
          <p>Valor total: <strong>${notif.valor}</strong></p>
        </div>
        <div class="notificacao-actions">
          <button class="btn-notif success" onclick="dashboardManager.processarFechamento(${notif.id})">
            Processar
          </button>
          <button class="btn-notif dismiss" onclick="dashboardManager.dispensarNotificacao(${notif.id})">
            Dispensar
          </button>
        </div>
      </div>
    `).join('');
  }

  processarFechamento(notifId) {
    const notificacoes = JSON.parse(localStorage.getItem('notificacoes')) || [];
    const notif = notificacoes.find(n => n.id === notifId);
    
    if (!notif) return;

    const quarto = quartos.find(q => q.id === notif.quartoId);
    if (quarto) {
      document.querySelector('[data-page="quartos"]').click();
      
      setTimeout(() => {
        quartosManager.abrirDetalhesModal(quarto.id);
      }, 300);
    }

    notif.lida = true;
    localStorage.setItem('notificacoes', JSON.stringify(notificacoes));
    this.verificarNotificacoes();
  }

  dispensarNotificacao(notifId) {
    const notificacoes = JSON.parse(localStorage.getItem('notificacoes')) || [];
    const notif = notificacoes.find(n => n.id === notifId);
    
    if (notif) {
      notif.lida = true;
      localStorage.setItem('notificacoes', JSON.stringify(notificacoes));
    }
    
    this.verificarNotificacoes();
  }

  atualizar() {
    document.getElementById('totalClientes').textContent = historico.length;

    const quartosOcupados = quartos.filter(q => q.status === 'ocupado').length;
    document.getElementById('quartosOcupados').textContent = quartosOcupados;

    const pedidosAtivos = pedidos.filter(p => p.status !== 'entregue').length;
    document.getElementById('pedidosPendentes').textContent = pedidosAtivos;

    const receitaTotal = historico.reduce((sum, h) => sum + h.valorTotal, 0);
    document.getElementById('receitaTotal').textContent = `R$ ${receitaTotal.toFixed(0)}`;

    const suitesContador = {};
    historico.forEach(h => {
      suitesContador[h.quarto] = (suitesContador[h.quarto] || 0) + 1;
    });
    const suitesOrdenadas = Object.entries(suitesContador)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const suitesHTML = suitesOrdenadas.length > 0
      ? suitesOrdenadas.map(([nome, qtd]) => `
          <li class="rank-item">
            <span>${nome}</span>
            <strong>${qtd}x</strong>
          </li>
        `).join('')
      : '<li class="rank-item"><span>Nenhum dado disponível</span></li>';
    
    document.getElementById('suitesRank').innerHTML = suitesHTML;

    const pratosContador = {};
    historico.forEach(h => {
      if (h.pedidos) {
        h.pedidos.forEach(p => {
          pratosContador[p.prato] = (pratosContador[p.prato] || 0) + 1;
        });
      }
    });
    const pratosOrdenados = Object.entries(pratosContador)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const pratosHTML = pratosOrdenados.length > 0
      ? pratosOrdenados.map(([nome, qtd]) => `
          <li class="rank-item">
            <span>${nome}</span>
            <strong>${qtd}x</strong>
          </li>
        `).join('')
      : '<li class="rank-item"><span>Nenhum dado disponível</span></li>';
    
    document.getElementById('pratosRank').innerHTML = pratosHTML;

    this.verificarEstoqueBaixo();
    this.verificarNotificacoes();
  }

  verificarEstoqueBaixo() {
    const alertaContainer = document.getElementById('alertasEstoque');
    const alertasLista = document.getElementById('alertasLista');
    
    const itensAbaixo = estoque.filter(item => {
      const limiteMinimo = item.quantidadeMinima || 10;
      return item.quantidade <= limiteMinimo;
    });
    
    if (itensAbaixo.length === 0) {
      alertaContainer.style.display = 'none';
      return;
    }

    alertaContainer.style.display = 'block';
    alertasLista.innerHTML = itensAbaixo.map(item => `
      <div class="alerta-item">
        <span><strong>${item.nome}</strong> está com estoque baixo</span>
        <span>${item.quantidade} ${item.unidade} (Mínimo: ${item.quantidadeMinima || 10})</span>
      </div>
    `).join('');
  }

  gerarRelatorio() {
    if (historico.length === 0) {
      alert('Não há dados suficientes para gerar o relatório.');
      return;
    }

    const receitaTotal = historico.reduce((sum, h) => sum + h.valorTotal, 0);
    const receitaQuartos = historico.reduce((sum, h) => sum + h.valorQuarto, 0);
    const receitaPedidos = receitaTotal - receitaQuartos;
    const ticketMedio = receitaTotal / historico.length;

    const pratosContador = {};
    historico.forEach(h => {
      if (h.pedidos) {
        h.pedidos.forEach(p => {
          pratosContador[p.prato] = (pratosContador[p.prato] || 0) + 1;
        });
      }
    });
    const pratoMaisVendido = Object.entries(pratosContador).sort((a, b) => b[1] - a[1])[0];

    const relatorio = `
═══════════════════════════════════════════
        📊 RELATÓRIO DE VENDAS
        MONTBLANC HOTEL
═══════════════════════════════════════════

📅 Período: Todos os registros
👥 Total de Clientes: ${historico.length}

💰 RECEITA
─────────────────────────────────────────
Receita Total:      R$ ${receitaTotal.toFixed(2)}
Receita Quartos:    R$ ${receitaQuartos.toFixed(2)}
Receita Pedidos:    R$ ${receitaPedidos.toFixed(2)}
Ticket Médio:       R$ ${ticketMedio.toFixed(2)}

🍽️ PRATOS
─────────────────────────────────────────
Mais Vendido: ${pratoMaisVendido ? pratoMaisVendido[0] : 'N/A'}
Quantidade: ${pratoMaisVendido ? pratoMaisVendido[1] : 0}x

🏨 QUARTOS
─────────────────────────────────────────
Quartos Cadastrados: ${quartos.length}
Quartos Ocupados: ${quartos.filter(q => q.status === 'ocupado').length}

📦 ESTOQUE
─────────────────────────────────────────
Itens Cadastrados: ${estoque.length}
Alertas de Estoque Baixo: ${estoque.filter(e => e.quantidade <= (e.quantidadeMinima || 10)).length}

═══════════════════════════════════════════
        Gerado em ${new Date().toLocaleString('pt-BR')}
═══════════════════════════════════════════
    `;

    alert(relatorio);
    console.log(relatorio);
  }
}

// Quartos Manager
class QuartosManager {
  constructor() {
    this.filtroAtual = 'todos';
    this.paginaAtual = 1;
    this.itensPorPagina = 9;
    this.quartoSelecionado = null;
    this.quartoDetalhes = null;
    this.intervalId = null;
    
    this.init();
  }

  init() {
    document.getElementById('addQuartoBtn').addEventListener('click', () => this.abrirModal());
    document.getElementById('closeQuartoModal').addEventListener('click', () => this.fecharModal());
    document.getElementById('cancelQuartoBtn').addEventListener('click', () => this.fecharModal());
    document.getElementById('quartoForm').addEventListener('submit', (e) => this.salvarQuarto(e));
    
    document.getElementById('closeStatusModal').addEventListener('click', () => this.fecharStatusModal());
    document.getElementById('closeDetalhesModal').addEventListener('click', () => this.fecharDetalhesModal());

    document.querySelectorAll('.status-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const status = e.currentTarget.getAttribute('data-status');
        this.alterarStatus(status);
      });
    });

    document.querySelectorAll('.filtro-btn[data-tipo="quarto"]').forEach(btn => {
      btn.addEventListener('click', (e) => this.filtrar(e));
    });

    document.getElementById('prevPageQuartos').addEventListener('click', () => this.paginaAnterior());
    document.getElementById('nextPageQuartos').addEventListener('click', () => this.proximaPagina());

    document.getElementById('btnFazerPedido').addEventListener('click', () => this.fazerPedido());
    document.getElementById('btnFecharConta').addEventListener('click', () => this.fecharConta());

    this.renderizar();
  }

  abrirModal() {
    document.getElementById('quartoModal').classList.add('active');
    document.getElementById('quartoForm').reset();
  }

  fecharModal() {
    document.getElementById('quartoModal').classList.remove('active');
  }

  abrirStatusModal(id) {
    this.quartoSelecionado = id;
    const quarto = quartos.find(q => q.id === id);
    
    if (quarto.status === 'ocupado') {
      this.abrirDetalhesModal(id);
    } else {
      document.getElementById('statusModal').classList.add('active');
    }
  }

  fecharStatusModal() {
    document.getElementById('statusModal').classList.remove('active');
    this.quartoSelecionado = null;
  }

  abrirDetalhesModal(id) {
    this.quartoDetalhes = quartos.find(q => q.id === id);
    if (!this.quartoDetalhes) return;

    document.getElementById('detalhesQuartoTitulo').textContent = 
      `${this.quartoDetalhes.nome} - #${this.quartoDetalhes.numero}`;
    
    this.atualizarDetalhes();
    this.atualizarSelectPratos();
    
    document.getElementById('detalhesQuartoModal').classList.add('active');
    
    this.intervalId = setInterval(() => this.atualizarDetalhes(), 60000);
  }

  fecharDetalhesModal() {
    document.getElementById('detalhesQuartoModal').classList.remove('active');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.quartoDetalhes = null;
  }

  atualizarDetalhes() {
    if (!this.quartoDetalhes) return;

    const quarto = quartos.find(q => q.id === this.quartoDetalhes.id);
    if (!quarto) return;

    const statusLabel = {
      'vago': 'Vago',
      'ocupado': 'Ocupado',
      'limpando': 'Limpando'
    };

    document.getElementById('detalhesStatus').textContent = statusLabel[quarto.status];

    if (quarto.inicioUso) {
      const inicio = new Date(quarto.inicioUso);
      const agora = new Date();
      const diffMs = agora - inicio;
      const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      document.getElementById('detalhesTempo').textContent = 
        `${diffHoras}h ${diffMinutos}min`;
      
      const valorQuarto = this.calcularValorQuarto(quarto);
      document.getElementById('detalhesValor').textContent = 
        `R$ ${valorQuarto.toFixed(2)}`;
    }

    const pedidosQuarto = pedidos.filter(p => p.quartoId === quarto.id);
    const pedidosHTML = pedidosQuarto.length > 0
      ? pedidosQuarto.map(p => {
          let statusIcon = '⏳ Pendente';
          if (p.status === 'preparo') statusIcon = '🔄 Em preparo';
          if (p.status === 'pronto') statusIcon = '✅ Pronto';
          if (p.status === 'entregue') statusIcon = '✔️ Entregue';
          
          return `
            <div class="pedido-item">
              <strong>${p.prato}</strong> - R$ ${p.valor.toFixed(2)}
              <br><small>${statusIcon}</small>
            </div>
          `;
        }).join('')
      : '<p style="color: var(--text-secondary);">Nenhum pedido</p>';
    
    document.getElementById('pedidosQuarto').innerHTML = pedidosHTML;

    const valorTotal = this.calcularTotalConta(quarto);
    document.getElementById('valorTotalConta').textContent = `R$ ${valorTotal.toFixed(2)}`;
  }

  calcularValorQuarto(quarto) {
    if (!quarto.inicioUso) return 0;
    
    const inicio = new Date(quarto.inicioUso);
    const agora = new Date();
    const diffHoras = (agora - inicio) / (1000 * 60 * 60);
    
    if (diffHoras <= 1) {
      return quarto.valorHora;
    } else {
      const horasExtras = Math.ceil(diffHoras - 1);
      return quarto.valorHora + (horasExtras * quarto.valorExtra);
    }
  }

  calcularTotalConta(quarto) {
    const valorQuarto = this.calcularValorQuarto(quarto);
    const pedidosQuarto = pedidos.filter(p => p.quartoId === quarto.id);
    const valorPedidos = pedidosQuarto.reduce((sum, p) => sum + p.valor, 0);
    return valorQuarto + valorPedidos;
  }

  atualizarSelectPratos() {
    const select = document.getElementById('selecionarPrato');
    select.innerHTML = '<option value="">Selecione um prato</option>' +
      pratos.map(p => `<option value="${p.id}">${p.nome} - R$ ${p.valor.toFixed(2)}</option>`).join('');
  }

  fazerPedido() {
    const pratoId = parseInt(document.getElementById('selecionarPrato').value);
    if (!pratoId) {
      alert('Selecione um prato!');
      return;
    }

    const prato = pratos.find(p => p.id === pratoId);
    if (!prato) return;

    let estoqueOk = true;
    prato.ingredientes.forEach(ing => {
      const item = estoque.find(e => e.id === ing.estoqueId);
      if (!item || item.quantidade < ing.quantidade) {
        estoqueOk = false;
        alert(`Estoque insuficiente de ${item ? item.nome : 'item'}`);
      }
    });

    if (!estoqueOk) return;

    prato.ingredientes.forEach(ing => {
      const item = estoque.find(e => e.id === ing.estoqueId);
      if (item) {
        item.quantidade -= ing.quantidade;
      }
    });
    localStorage.setItem('estoque', JSON.stringify(estoque));

    const pedido = {
      id: Date.now(),
      quartoId: this.quartoDetalhes.id,
      quartoNome: `${this.quartoDetalhes.nome} #${this.quartoDetalhes.numero}`,
      pratoId: prato.id,
      prato: prato.nome,
      valor: prato.valor,
      status: 'pendente',
      timestamp: new Date().toISOString()
    };

    pedidos.push(pedido);
    localStorage.setItem('pedidos', JSON.stringify(pedidos));

    alert('Pedido enviado para a cozinha!');
    this.atualizarDetalhes();
    document.getElementById('selecionarPrato').value = '';
  }

  fecharConta() {
    if (!confirm('Deseja realmente fechar a conta deste quarto?')) return;

    const quarto = quartos.find(q => q.id === this.quartoDetalhes.id);
    if (!quarto) return;

    const valorTotal = this.calcularTotalConta(quarto);
    const pedidosQuarto = pedidos.filter(p => p.quartoId === quarto.id);

    historico.push({
      id: Date.now(),
      quarto: `${quarto.nome} #${quarto.numero}`,
      valorQuarto: this.calcularValorQuarto(quarto),
      pedidos: pedidosQuarto.map(p => ({ prato: p.prato, valor: p.valor })),
      valorTotal: valorTotal,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('historico', JSON.stringify(historico));

    pedidos = pedidos.filter(p => p.quartoId !== quarto.id);
    localStorage.setItem('pedidos', JSON.stringify(pedidos));

    quarto.status = 'limpando';
    quarto.inicioUso = null;
    localStorage.setItem('quartos', JSON.stringify(quartos));

    alert(`Conta fechada! Total: R$ ${valorTotal.toFixed(2)}`);
    this.fecharDetalhesModal();
    this.renderizar();
  }

  salvarQuarto(e) {
    e.preventDefault();
    
    const quarto = {
      id: Date.now(),
      nome: document.getElementById('quartoNome').value,
      numero: document.getElementById('quartoNumero').value,
      tipo: document.getElementById('quartoTipo').value,
      valorHora: parseFloat(document.getElementById('quartoValorHora').value),
      valorExtra: parseFloat(document.getElementById('quartoValorExtra').value),
      status: 'vago',
      inicioUso: null
    };

    quartos.push(quarto);
    localStorage.setItem('quartos', JSON.stringify(quartos));
    
    this.fecharModal();
    this.renderizar();
  }

  deletarQuarto(id) {
    if (confirm('Deseja realmente excluir este quarto?')) {
      quartos = quartos.filter(q => q.id !== id);
      localStorage.setItem('quartos', JSON.stringify(quartos));
      this.renderizar();
    }
  }

  alterarStatus(novoStatus) {
    const quarto = quartos.find(q => q.id === this.quartoSelecionado);
    if (quarto) {
      quarto.status = novoStatus;
      
      if (novoStatus === 'ocupado') {
        quarto.inicioUso = new Date().toISOString();
      } else if (novoStatus === 'vago') {
        quarto.inicioUso = null;
      }
      
      localStorage.setItem('quartos', JSON.stringify(quartos));
      this.fecharStatusModal();
      this.renderizar();
    }
  }

  filtrar(e) {
    document.querySelectorAll('.filtro-btn[data-tipo="quarto"]').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    this.filtroAtual = e.target.getAttribute('data-filtro');
    this.paginaAtual = 1;
    this.renderizar();
  }

  getQuartosFiltrados() {
    if (this.filtroAtual === 'todos') {
      return quartos;
    }
    return quartos.filter(q => q.status === this.filtroAtual);
  }

  paginaAnterior() {
    if (this.paginaAtual > 1) {
      this.paginaAtual--;
      this.renderizar();
    }
  }

  proximaPagina() {
    const quartosFiltrados = this.getQuartosFiltrados();
    const totalPaginas = Math.ceil(quartosFiltrados.length / this.itensPorPagina);
    
    if (this.paginaAtual < totalPaginas) {
      this.paginaAtual++;
      this.renderizar();
    }
  }

  renderizar() {
    const quartosFiltrados = this.getQuartosFiltrados();
    const totalPaginas = Math.max(1, Math.ceil(quartosFiltrados.length / this.itensPorPagina));
    
    if (this.paginaAtual > totalPaginas) {
      this.paginaAtual = totalPaginas;
    }

    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;
    const quartosParaMostrar = quartosFiltrados.slice(inicio, fim);

    const grid = document.getElementById('quartosGrid');
    if (quartosParaMostrar.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>Nenhum quarto encontrado</h3>
          <p>Adicione novos quartos ou altere os filtros.</p>
        </div>
      `;
    } else {
      grid.innerHTML = quartosParaMostrar.map(quarto => `
        <div class="item-card quarto-card ${quarto.status}" onclick="quartosManager.abrirStatusModal(${quarto.id})">
          <button class="item-delete" onclick="event.stopPropagation(); quartosManager.deletarQuarto(${quarto.id})">×</button>
          <div class="quarto-numero">#${quarto.numero}</div>
          <div class="quarto-nome">${quarto.nome}</div>
          <div class="quarto-tipo">${this.getTipoLabel(quarto.tipo)}</div>
          <span class="status-badge ${quarto.status}">
            ${this.getStatusLabel(quarto.status)}
          </span>
        </div>
      `).join('');
    }

    document.getElementById('currentPageQuartos').textContent = this.paginaAtual;
    document.getElementById('totalPagesQuartos').textContent = totalPaginas;
    
    document.getElementById('prevPageQuartos').disabled = this.paginaAtual === 1;
    document.getElementById('nextPageQuartos').disabled = this.paginaAtual === totalPaginas;
  }

  getTipoLabel(tipo) {
    const labels = {
      'standard': 'Standard',
      'vip': 'VIP',
      'master': 'Master',
      'master-duplex': 'Master Duplex'
    };
    return labels[tipo] || tipo;
  }

  getStatusLabel(status) {
    const labels = {
      'vago': 'Vago',
      'ocupado': 'Ocupado',
      'limpando': 'Limpando'
    };
    return labels[status] || status;
  }
}

// Cozinha Manager
class CozinhaManager {
  constructor() {
    this.filtroAtual = 'todos';
    this.init();
  }

  init() {
    document.getElementById('addPratoBtn').addEventListener('click', () => this.abrirModal());
    document.getElementById('closePratoModal').addEventListener('click', () => this.fecharModal());
    document.getElementById('cancelPratoBtn').addEventListener('click', () => this.fecharModal());
    document.getElementById('pratoForm').addEventListener('submit', (e) => this.salvarPrato(e));
    document.getElementById('btnAddIngrediente').addEventListener('click', () => this.adicionarIngrediente());

    document.querySelectorAll('.filtro-btn[data-tipo="pedido"]').forEach(btn => {
      btn.addEventListener('click', (e) => this.filtrar(e));
    });

    this.renderizar();
  }

  abrirModal() {
    document.getElementById('pratoModal').classList.add('active');
    document.getElementById('pratoForm').reset();
    document.getElementById('ingredientesSelecionados').innerHTML = '';
    this.ingredientesTemp = [];
    this.atualizarSelectEstoque();
  }

  fecharModal() {
    document.getElementById('pratoModal').classList.remove('active');
  }

  atualizarSelectEstoque() {
    const select = document.getElementById('estoqueSelect');
    select.innerHTML = '<option value="">Selecione um item</option>' +
      estoque.map(e => `<option value="${e.id}">${e.nome} (${e.quantidade} ${e.unidade})</option>`).join('');
  }

  adicionarIngrediente() {
    const estoqueId = parseInt(document.getElementById('estoqueSelect').value);
    const quantidade = parseFloat(document.getElementById('quantidadeIngrediente').value);

    if (!estoqueId || !quantidade || quantidade <= 0) {
      alert('Selecione um item e informe a quantidade!');
      return;
    }

    const item = estoque.find(e => e.id === estoqueId);
    if (!item) return;

    if (!this.ingredientesTemp) this.ingredientesTemp = [];

    this.ingredientesTemp.push({
      estoqueId: estoqueId,
      nome: item.nome,
      quantidade: quantidade,
      unidade: item.unidade
    });

    this.renderizarIngredientes();
    document.getElementById('estoqueSelect').value = '';
    document.getElementById('quantidadeIngrediente').value = '';
  }

  renderizarIngredientes() {
    const container = document.getElementById('ingredientesSelecionados');
    container.innerHTML = this.ingredientesTemp.map((ing, index) => `
      <div class="ingrediente-item">
        <span>${ing.nome} - ${ing.quantidade} ${ing.unidade}</span>
        <button onclick="cozinhaManager.removerIngrediente(${index})">Remover</button>
      </div>
    `).join('');
  }

  removerIngrediente(index) {
    this.ingredientesTemp.splice(index, 1);
    this.renderizarIngredientes();
  }

  salvarPrato(e) {
    e.preventDefault();

    if (!this.ingredientesTemp || this.ingredientesTemp.length === 0) {
      alert('Adicione pelo menos um ingrediente!');
      return;
    }

    const prato = {
      id: Date.now(),
      nome: document.getElementById('pratoNome').value,
      valor: parseFloat(document.getElementById('pratoValor').value),
      ingredientes: this.ingredientesTemp
    };

    pratos.push(prato);
    localStorage.setItem('pratos', JSON.stringify(pratos));

    alert('Prato criado com sucesso!');
    this.fecharModal();
    this.renderizar();
  }

  deletarPrato(id) {
    if (confirm('Deseja realmente excluir este prato?')) {
      pratos = pratos.filter(p => p.id !== id);
      localStorage.setItem('pratos', JSON.stringify(pratos));
      this.renderizar();
    }
  }

  alterarStatusPedido(pedidoId, novoStatus) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (pedido) {
      pedido.status = novoStatus;
      localStorage.setItem('pedidos', JSON.stringify(pedidos));
      this.renderizar();
    }
  }

  concluirPedido(pedidoId) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (pedido) {
      pedido.status = 'entregue';
      localStorage.setItem('pedidos', JSON.stringify(pedidos));
      this.renderizar();
    }
  }

  filtrar(e) {
    document.querySelectorAll('.filtro-btn[data-tipo="pedido"]').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    this.filtroAtual = e.target.getAttribute('data-filtro');
    this.renderizar();
  }

  renderizar() {
    let pedidosFiltrados = pedidos.filter(p => p.status !== 'entregue');
    
    if (this.filtroAtual !== 'todos') {
      if (this.filtroAtual === 'entregue') {
        pedidosFiltrados = pedidos.filter(p => p.status === 'entregue');
      } else {
        pedidosFiltrados = pedidosFiltrados.filter(p => p.status === this.filtroAtual);
      }
    } else {
      // "Todos" mostra ativos + entregues
      pedidosFiltrados = pedidos;
    }

    const pedidosLista = document.getElementById('pedidosLista');
    if (pedidosFiltrados.length === 0) {
      pedidosLista.innerHTML = '<div class="empty-state"><h3>Nenhum pedido ativo</h3></div>';
    } else {
      pedidosLista.innerHTML = pedidosFiltrados.map(p => `
        <div class="pedido-card ${p.status}">
          <div class="pedido-header">
            <div class="pedido-quarto">${p.quartoNome}</div>
            <span class="status-badge ${p.status}">${this.getStatusLabel(p.status)}</span>
          </div>
          <div class="pedido-prato">${p.prato}</div>
          <div style="color: var(--accent-red); font-weight: 600;">R$ ${p.valor.toFixed(2)}</div>
          <div class="pedido-actions">
            ${p.status === 'pendente' ? `
              <button class="btn-preparo" onclick="cozinhaManager.alterarStatusPedido(${p.id}, 'preparo')">Iniciar Preparo</button>
            ` : ''}
            ${p.status === 'preparo' ? `
              <button class="btn-pronto" onclick="cozinhaManager.alterarStatusPedido(${p.id}, 'pronto')">Marcar como Pronto</button>
            ` : ''}
            ${p.status === 'pronto' ? `
              <button class="btn-concluir" onclick="cozinhaManager.concluirPedido(${p.id})">Concluir Entrega</button>
            ` : ''}
            ${p.status === 'entregue' ? `
              <button class="btn-concluir" onclick="cozinhaManager.removerPedido(${p.id})" style="background: var(--status-ocupado);">
                🗑️ Remover da Lista
              </button>
            ` : ''}
          </div>
        </div>
      `).join('');
    }

    const pratosGrid = document.getElementById('pratosGrid');
    if (pratos.length === 0) {
      pratosGrid.innerHTML = '<div class="empty-state"><h3>Nenhum prato cadastrado</h3></div>';
    } else {
      pratosGrid.innerHTML = pratos.map(p => `
        <div class="prato-card">
          <button class="item-delete" onclick="cozinhaManager.deletarPrato(${p.id})">×</button>
          <div class="prato-nome">${p.nome}</div>
          <div class="prato-valor">R$ ${p.valor.toFixed(2)}</div>
          <div class="prato-ingredientes">
            <strong>Ingredientes:</strong><br>
            ${p.ingredientes.map(ing => `${ing.nome} (${ing.quantidade} ${ing.unidade})`).join(', ')}
          </div>
        </div>
      `).join('');
    }
  }

  removerPedido(pedidoId) {
    if (confirm('Deseja remover este pedido da lista?')) {
      pedidos = pedidos.filter(p => p.id !== pedidoId);
      localStorage.setItem('pedidos', JSON.stringify(pedidos));
      this.renderizar();
    }
  }

  limparPedidosEntregues() {
    const entregues = pedidos.filter(p => p.status === 'entregue');
    
    if (entregues.length === 0) {
      alert('Não há pedidos entregues para limpar.');
      return;
    }

    if (confirm(`Deseja remover ${entregues.length} pedido(s) entregue(s) da lista?`)) {
      pedidos = pedidos.filter(p => p.status !== 'entregue');
      localStorage.setItem('pedidos', JSON.stringify(pedidos));
      alert(`${entregues.length} pedido(s) removido(s) com sucesso!`);
      this.renderizar();
    }
  }

  getStatusLabel(status) {
    const labels = {
      'pendente': 'Pendente',
      'preparo': 'Em Preparo',
      'pronto': 'Pronto',
      'entregue': 'Entregue'
    };
    return labels[status] || status;
  }
}

// Estoque Manager
class EstoqueManager {
  constructor() {
    this.filtroAtual = 'todos';
    this.paginaAtual = 1;
    this.itensPorPagina = 9;
    this.editando = false;
    
    this.init();
  }

  init() {
    document.getElementById('addEstoqueBtn').addEventListener('click', () => this.abrirModal());
    document.getElementById('closeEstoqueModal').addEventListener('click', () => this.fecharModal());
    document.getElementById('cancelEstoqueBtn').addEventListener('click', () => this.fecharModal());
    document.getElementById('estoqueForm').addEventListener('submit', (e) => this.salvarItem(e));

    document.getElementById('prevPageEstoque').addEventListener('click', () => this.paginaAnterior());
    document.getElementById('nextPageEstoque').addEventListener('click', () => this.proximaPagina());

    this.atualizarFiltros();
    this.renderizar();
  }

  abrirModal(id = null) {
    this.editando = false;
    document.getElementById('estoqueModalTitulo').textContent = 'Adicionar Item ao Estoque';
    document.getElementById('estoqueForm').reset();
    document.getElementById('estoqueEditId').value = '';
    document.getElementById('estoqueQuantidadeMinima').value = '10'; // Valor padrão

    if (id) {
      const item = estoque.find(e => e.id === id);
      if (item) {
        this.editando = true;
        document.getElementById('estoqueModalTitulo').textContent = 'Editar Item do Estoque';
        document.getElementById('estoqueEditId').value = item.id;
        document.getElementById('estoqueNome').value = item.nome;
        document.getElementById('estoqueCategoria').value = item.categoria;
        document.getElementById('estoqueQuantidade').value = item.quantidade;
        document.getElementById('estoqueUnidade').value = item.unidade;
        document.getElementById('estoqueQuantidadeMinima').value = item.quantidadeMinima || 10;
        document.getElementById('estoqueDescricao').value = item.descricao || '';
      }
    }

    document.getElementById('estoqueModal').classList.add('active');
  }

  fecharModal() {
    document.getElementById('estoqueModal').classList.remove('active');
  }

  salvarItem(e) {
    e.preventDefault();
    
    const editId = document.getElementById('estoqueEditId').value;

    if (editId) {
      const item = estoque.find(e => e.id === parseInt(editId));
      if (item) {
        item.nome = document.getElementById('estoqueNome').value;
        item.categoria = document.getElementById('estoqueCategoria').value;
        item.quantidade = parseFloat(document.getElementById('estoqueQuantidade').value);
        item.unidade = document.getElementById('estoqueUnidade').value;
        item.quantidadeMinima = parseFloat(document.getElementById('estoqueQuantidadeMinima').value);
        item.descricao = document.getElementById('estoqueDescricao').value;
      }
    } else {
      const item = {
        id: Date.now(),
        nome: document.getElementById('estoqueNome').value,
        categoria: document.getElementById('estoqueCategoria').value,
        quantidade: parseFloat(document.getElementById('estoqueQuantidade').value),
        unidade: document.getElementById('estoqueUnidade').value,
        quantidadeMinima: parseFloat(document.getElementById('estoqueQuantidadeMinima').value) || 10,
        descricao: document.getElementById('estoqueDescricao').value
      };
      estoque.push(item);
    }

    localStorage.setItem('estoque', JSON.stringify(estoque));
    
    this.fecharModal();
    this.atualizarFiltros();
    this.renderizar();
  }

  deletarItem(id) {
    if (confirm('Deseja realmente excluir este item?')) {
      estoque = estoque.filter(i => i.id !== id);
      localStorage.setItem('estoque', JSON.stringify(estoque));
      this.atualizarFiltros();
      this.renderizar();
    }
  }

  atualizarFiltros() {
    const categorias = [...new Set(estoque.map(i => i.categoria))];
    
    let filtrosHTML = '<button class="filtro-btn active" data-filtro="todos" data-tipo="estoque">Todos</button>';
    
    categorias.forEach(cat => {
      filtrosHTML += `<button class="filtro-btn" data-filtro="${cat}" data-tipo="estoque">${this.getCategoriaLabel(cat)}</button>`;
    });
    
    document.getElementById('filtrosEstoque').innerHTML = filtrosHTML;
    
    document.querySelectorAll('.filtro-btn[data-tipo="estoque"]').forEach(btn => {
      btn.addEventListener('click', (e) => this.filtrar(e));
    });
  }

  filtrar(e) {
    document.querySelectorAll('.filtro-btn[data-tipo="estoque"]').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    this.filtroAtual = e.target.getAttribute('data-filtro');
    this.paginaAtual = 1;
    this.renderizar();
  }

  getItensFiltrados() {
    if (this.filtroAtual === 'todos') {
      return estoque;
    }
    return estoque.filter(i => i.categoria === this.filtroAtual);
  }

  paginaAnterior() {
    if (this.paginaAtual > 1) {
      this.paginaAtual--;
      this.renderizar();
    }
  }

  proximaPagina() {
    const itensFiltrados = this.getItensFiltrados();
    const totalPaginas = Math.ceil(itensFiltrados.length / this.itensPorPagina);
    
    if (this.paginaAtual < totalPaginas) {
      this.paginaAtual++;
      this.renderizar();
    }
  }

  renderizar() {
    const itensFiltrados = this.getItensFiltrados();
    const totalPaginas = Math.max(1, Math.ceil(itensFiltrados.length / this.itensPorPagina));
    
    if (this.paginaAtual > totalPaginas) {
      this.paginaAtual = totalPaginas;
    }

    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;
    const itensParaMostrar = itensFiltrados.slice(inicio, fim);

    const grid = document.getElementById('estoqueGrid');
    if (itensParaMostrar.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>Nenhum item no estoque</h3>
          <p>Adicione novos itens ou altere os filtros.</p>
        </div>
      `;
    } else {
      grid.innerHTML = itensParaMostrar.map(item => `
        <div class="item-card">
          <button class="item-edit" onclick="estoqueManager.abrirModal(${item.id})">✏️</button>
          <button class="item-delete" onclick="estoqueManager.deletarItem(${item.id})">×</button>
          <div class="estoque-nome">${item.nome}</div>
          <div class="estoque-categoria">${this.getCategoriaLabel(item.categoria)}</div>
          <div class="estoque-quantidade">${item.quantidade} ${item.unidade}</div>
          ${item.quantidade <= (item.quantidadeMinima || 10) ? 
            `<div style="color: var(--status-limpando); font-weight: 600; margin-top: 0.5rem;">⚠️ Estoque baixo!</div>` : 
            ''}
          <div style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 0.5rem;">
            Alerta quando ≤ ${item.quantidadeMinima || 10} ${item.unidade}
          </div>
          ${item.descricao ? `<div style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.5rem;">${item.descricao}</div>` : ''}
        </div>
      `).join('');
    }

    document.getElementById('currentPageEstoque').textContent = this.paginaAtual;
    document.getElementById('totalPagesEstoque').textContent = totalPaginas;
    
    document.getElementById('prevPageEstoque').disabled = this.paginaAtual === 1;
    document.getElementById('nextPageEstoque').disabled = this.paginaAtual === totalPaginas;
  }

  getCategoriaLabel(categoria) {
    const labels = {
      'carnes': 'Carnes',
      'congelados': 'Congelados',
      'bebidas': 'Bebidas',
      'bebidas-alcoolicas': 'Bebidas Alcoólicas',
      'laticinios': 'Laticínios',
      'hortifruti': 'Hortifruti',
      'padaria': 'Padaria',
      'limpeza': 'Limpeza',
      'higiene': 'Higiene',
      'outros': 'Outros'
    };
    return labels[categoria] || categoria;
  }
}

// Inicializar
const themeManager = new ThemeManager();
const sidebar = new Sidebar();
sidebar.init();

const dashboardManager = new DashboardManager();
const quartosManager = new QuartosManager();
const cozinhaManager = new CozinhaManager();
const estoqueManager = new EstoqueManager();

// Atualizar dashboard inicial
dashboardManager.iniciar();