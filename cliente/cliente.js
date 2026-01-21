// Cliente Portal - MontBlanc
class ClientePortal {
  constructor() {
    this.quartoAtual = null;
    this.pratoSelecionado = null;
    this.updateInterval = null;
    this.init();
  }

  init() {
    console.log('🚀 Inicializando Portal do Cliente...');
    
    // Event Listeners
    document.getElementById('loginForm').addEventListener('submit', (e) => this.fazerLogin(e));
    document.getElementById('btnLogout').addEventListener('click', () => this.fazerLogout());
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.mudarTab(e));
    });

    // Modal
    document.getElementById('closeModal').addEventListener('click', () => this.fecharModal());
    document.getElementById('btnCancelarPedido').addEventListener('click', () => this.fecharModal());
    document.getElementById('btnConfirmarPedido').addEventListener('click', () => this.confirmarPedido());

    // Search
    document.getElementById('searchPrato').addEventListener('input', (e) => this.buscarPrato(e.target.value));

    // Fechar conta
    document.getElementById('btnSolicitarFechamento').addEventListener('click', () => this.solicitarFechamento());

    // Verificar se já está logado
    const quartoLogado = localStorage.getItem('clienteQuarto');
    console.log('Verificando login anterior:', quartoLogado ? 'Encontrado' : 'Não encontrado');
    
    if (quartoLogado) {
      this.quartoAtual = JSON.parse(quartoLogado);
      console.log('✅ Login restaurado:', this.quartoAtual);
      this.mostrarTelaMain();
    } else {
      console.log('ℹ️ Nenhum login anterior. Mostrando tela de login.');
    }
  }

  fazerLogin(e) {
    e.preventDefault();
    
    const numeroQuarto = document.getElementById('numeroQuarto').value.trim();
    const errorDiv = document.getElementById('errorMessage');
    
    // Buscar quartos do sistema principal
    const quartos = JSON.parse(localStorage.getItem('quartos')) || [];
    
    console.log('🔍 DEBUG LOGIN:');
    console.log('Número digitado:', numeroQuarto, '(tipo:', typeof numeroQuarto, ')');
    console.log('Total de quartos:', quartos.length);
    console.log('Quartos disponíveis:', quartos.map(q => ({
      numero: q.numero,
      tipo: typeof q.numero,
      status: q.status,
      nome: q.nome
    })));
    
    // Comparar como string para evitar problemas de tipo
    const quarto = quartos.find(q => String(q.numero) === String(numeroQuarto) && q.status === 'ocupado');
    
    console.log('Quarto encontrado:', quarto);
    
    if (!quarto) {
      // Verificar se o quarto existe mas não está ocupado
      const quartoExiste = quartos.find(q => String(q.numero) === String(numeroQuarto));
      
      if (quartoExiste) {
        errorDiv.textContent = `Suíte #${numeroQuarto} encontrada, mas não está ocupada. Status atual: ${quartoExiste.status}`;
      } else {
        errorDiv.textContent = 'Suíte não encontrada. Verifique o número digitado.';
      }
      errorDiv.classList.add('show');
      return;
    }

    this.quartoAtual = quarto;
    localStorage.setItem('clienteQuarto', JSON.stringify(quarto));
    
    console.log('✅ Login aprovado!');
    this.mostrarTelaMain();
  }

  fazerLogout() {
    if (confirm('Deseja realmente sair?')) {
      localStorage.removeItem('clienteQuarto');
      this.quartoAtual = null;
      
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }

      document.getElementById('loginScreen').classList.add('active');
      document.getElementById('mainScreen').classList.remove('active');
      document.getElementById('numeroQuarto').value = '';
      document.getElementById('errorMessage').classList.remove('show');
    }
  }

  mostrarTelaMain() {
    console.log('✅ Mostrando tela principal para quarto:', this.quartoAtual);
    
    const loginScreen = document.getElementById('loginScreen');
    const mainScreen = document.getElementById('mainScreen');
    
    if (!loginScreen) {
      console.error('❌ ERRO: Elemento loginScreen não encontrado!');
      return;
    }
    
    if (!mainScreen) {
      console.error('❌ ERRO: Elemento mainScreen não encontrado!');
      return;
    }
    
    console.log('🔍 Estado ANTES da troca:');
    console.log('- loginScreen classes:', loginScreen.className);
    console.log('- mainScreen classes:', mainScreen.className);
    console.log('- loginScreen display:', getComputedStyle(loginScreen).display);
    console.log('- mainScreen display:', getComputedStyle(mainScreen).display);
    
    loginScreen.classList.remove('active');
    mainScreen.classList.add('active');
    
    console.log('🔍 Estado DEPOIS da troca:');
    console.log('- loginScreen classes:', loginScreen.className);
    console.log('- mainScreen classes:', mainScreen.className);
    console.log('- loginScreen display:', getComputedStyle(loginScreen).display);
    console.log('- mainScreen display:', getComputedStyle(mainScreen).display);
    
    // Forçar mudança direta no style
    loginScreen.style.display = 'none';
    mainScreen.style.display = 'block';
    
    console.log('🔍 Estado DEPOIS do forçamento:');
    console.log('- loginScreen display:', loginScreen.style.display);
    console.log('- mainScreen display:', mainScreen.style.display);
    
    // Atualizar informações do quarto
    const quartoNumeroEl = document.getElementById('quartoNumero');
    if (quartoNumeroEl) {
      quartoNumeroEl.textContent = `#${this.quartoAtual.numero}`;
    } else {
      console.error('❌ ERRO: Elemento quartoNumero não encontrado!');
    }
    
    // Carregar dados
    this.carregarCardapio();
    this.carregarPedidos();
    this.atualizarConta();
    
    // Atualizar a cada 30 segundos
    this.updateInterval = setInterval(() => {
      console.log('🔄 Atualizando dados...');
      this.carregarPedidos();
      this.atualizarConta();
    }, 30000);
    
    console.log('✅ Troca de tela CONCLUÍDA!');
  }

  mudarTab(e) {
    // Remover active de todos
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Adicionar active no clicado
    e.target.classList.add('active');
    const tabId = e.target.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
    
    // Recarregar dados da aba
    if (tabId === 'pedidos') {
      this.carregarPedidos();
    } else if (tabId === 'conta') {
      this.atualizarConta();
    }
  }

  carregarCardapio() {
    const pratos = JSON.parse(localStorage.getItem('pratos')) || [];
    const grid = document.getElementById('cardapioGrid');
    
    console.log('🍽️ Carregando cardápio:', pratos.length, 'pratos');
    
    if (pratos.length === 0) {
      grid.innerHTML = '<div class="empty-message"><h3>Nenhum prato disponível no momento</h3></div>';
      return;
    }

    grid.innerHTML = pratos.map(prato => `
      <div class="prato-card" onclick="clientePortal.abrirModalPedido(${prato.id})">
        <div class="prato-nome">${prato.nome}</div>
        <div class="prato-valor">R$ ${prato.valor.toFixed(2)}</div>
        <div class="prato-ingredientes">
          <strong>Ingredientes:</strong><br>
          ${prato.ingredientes.map(ing => ing.nome).join(', ')}
        </div>
      </div>
    `).join('');
  }

  buscarPrato(termo) {
    const pratos = JSON.parse(localStorage.getItem('pratos')) || [];
    const pratosFiltrados = pratos.filter(p => 
      p.nome.toLowerCase().includes(termo.toLowerCase())
    );
    
    const grid = document.getElementById('cardapioGrid');
    
    if (pratosFiltrados.length === 0) {
      grid.innerHTML = '<div class="empty-message"><h3>Nenhum prato encontrado</h3></div>';
      return;
    }

    grid.innerHTML = pratosFiltrados.map(prato => `
      <div class="prato-card" onclick="clientePortal.abrirModalPedido(${prato.id})">
        <div class="prato-nome">${prato.nome}</div>
        <div class="prato-valor">R$ ${prato.valor.toFixed(2)}</div>
        <div class="prato-ingredientes">
          <strong>Ingredientes:</strong><br>
          ${prato.ingredientes.map(ing => ing.nome).join(', ')}
        </div>
      </div>
    `).join('');
  }

  abrirModalPedido(pratoId) {
    const pratos = JSON.parse(localStorage.getItem('pratos')) || [];
    const prato = pratos.find(p => p.id === pratoId);
    
    if (!prato) return;
    
    this.pratoSelecionado = prato;
    
    const modalInfo = document.getElementById('modalPratoInfo');
    modalInfo.innerHTML = `
      <div class="prato-nome">${prato.nome}</div>
      <div class="prato-valor">R$ ${prato.valor.toFixed(2)}</div>
      <div class="prato-ingredientes">
        <strong>Ingredientes:</strong><br>
        ${prato.ingredientes.map(ing => `${ing.nome} (${ing.quantidade} ${ing.unidade})`).join(', ')}
      </div>
    `;
    
    document.getElementById('modalConfirmar').classList.add('active');
  }

  fecharModal() {
    document.getElementById('modalConfirmar').classList.remove('active');
    this.pratoSelecionado = null;
  }

  confirmarPedido() {
    if (!this.pratoSelecionado) return;

    console.log('🛒 Confirmando pedido:', this.pratoSelecionado.nome);

    const estoque = JSON.parse(localStorage.getItem('estoque')) || [];
    
    // Verificar estoque
    let estoqueOk = true;
    this.pratoSelecionado.ingredientes.forEach(ing => {
      const item = estoque.find(e => e.id === ing.estoqueId);
      if (!item || item.quantidade < ing.quantidade) {
        estoqueOk = false;
        console.error('❌ Estoque insuficiente:', ing.nome);
        alert(`Desculpe, ${item ? item.nome : 'ingrediente'} está em falta no momento.`);
      }
    });

    if (!estoqueOk) {
      this.fecharModal();
      return;
    }

    // Dar baixa no estoque
    this.pratoSelecionado.ingredientes.forEach(ing => {
      const item = estoque.find(e => e.id === ing.estoqueId);
      if (item) {
        item.quantidade -= ing.quantidade;
        console.log(`📦 Baixa no estoque: ${item.nome} - ${ing.quantidade} ${ing.unidade}`);
      }
    });
    localStorage.setItem('estoque', JSON.stringify(estoque));

    // Criar pedido
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    const pedido = {
      id: Date.now(),
      quartoId: this.quartoAtual.id,
      quartoNome: `${this.quartoAtual.nome} #${this.quartoAtual.numero}`,
      pratoId: this.pratoSelecionado.id,
      prato: this.pratoSelecionado.nome,
      valor: this.pratoSelecionado.valor,
      status: 'pendente',
      timestamp: new Date().toISOString()
    };

    pedidos.push(pedido);
    localStorage.setItem('pedidos', JSON.stringify(pedidos));

    console.log('✅ Pedido criado:', pedido);

    alert('Pedido enviado com sucesso! Acompanhe o status na aba "Meus Pedidos".');
    this.fecharModal();
    this.carregarPedidos();
  }

  carregarPedidos() {
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    const pedidosQuarto = pedidos.filter(p => p.quartoId === this.quartoAtual.id);
    
    console.log('📋 Carregando pedidos:', {
      totalPedidos: pedidos.length,
      pedidosDoQuarto: pedidosQuarto.length,
      quartoAtualId: this.quartoAtual.id
    });
    
    const lista = document.getElementById('pedidosLista');
    
    if (pedidosQuarto.length === 0) {
      lista.innerHTML = '<div class="empty-message"><h3>Você ainda não fez nenhum pedido</h3></div>';
      return;
    }

    lista.innerHTML = pedidosQuarto.reverse().map(pedido => {
      const statusLabels = {
        'pendente': 'Pendente',
        'preparo': 'Em Preparo',
        'pronto': 'Pronto para Retirada',
        'entregue': 'Entregue'
      };

      const data = new Date(pedido.timestamp);
      const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      return `
        <div class="pedido-card ${pedido.status}">
          <div class="pedido-header">
            <div class="pedido-prato">${pedido.prato}</div>
            <span class="pedido-status ${pedido.status}">${statusLabels[pedido.status]}</span>
          </div>
          <div class="pedido-valor">R$ ${pedido.valor.toFixed(2)}</div>
          <div class="pedido-timestamp">Pedido feito às ${horaFormatada}</div>
        </div>
      `;
    }).join('');
  }

  atualizarConta() {
    const quartos = JSON.parse(localStorage.getItem('quartos')) || [];
    const quarto = quartos.find(q => q.id === this.quartoAtual.id);
    
    if (!quarto) {
      console.error('❌ Quarto não encontrado! ID:', this.quartoAtual.id);
      return;
    }

    console.log('📊 Atualizando conta do quarto:', quarto.numero);

    // Calcular tempo
    if (quarto.inicioUso) {
      const inicio = new Date(quarto.inicioUso);
      const agora = new Date();
      const diffMs = agora - inicio;
      const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      document.getElementById('tempoHospedagem').textContent = `${diffHoras}h ${diffMinutos}min`;
      
      // Calcular valor do quarto
      let valorQuarto = quarto.valorHora || 0;
      if (diffHoras > 0) {
        const horasExtras = diffHoras;
        valorQuarto = (quarto.valorHora || 0) + (horasExtras * (quarto.valorExtra || 0));
      }
      
      document.getElementById('valorSuite').textContent = `R$ ${valorQuarto.toFixed(2)}`;
    } else {
      document.getElementById('tempoHospedagem').textContent = '--';
      document.getElementById('valorSuite').textContent = 'R$ 0,00';
    }

    // Calcular valor dos pedidos
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    const pedidosQuarto = pedidos.filter(p => p.quartoId === this.quartoAtual.id);
    const valorPedidos = pedidosQuarto.reduce((sum, p) => sum + p.valor, 0);
    
    console.log('💰 Pedidos do quarto:', pedidosQuarto.length, '- Total:', valorPedidos);
    
    document.getElementById('valorPedidos').textContent = `R$ ${valorPedidos.toFixed(2)}`;

    // Total
    const valorSuiteText = document.getElementById('valorSuite').textContent.replace('R$ ', '').replace(',', '.');
    const valorSuite = parseFloat(valorSuiteText) || 0;
    const total = valorSuite + valorPedidos;
    document.getElementById('totalPagar').textContent = `R$ ${total.toFixed(2)}`;

    // Detalhamento
    const detalhamentoDiv = document.getElementById('detalhamentoPedidos');
    if (pedidosQuarto.length === 0) {
      detalhamentoDiv.innerHTML = '<p style="color: var(--text-secondary);">Nenhum pedido realizado</p>';
    } else {
      detalhamentoDiv.innerHTML = pedidosQuarto.map(p => `
        <div class="detalhamento-item">
          <span>${p.prato}</span>
          <strong>R$ ${p.valor.toFixed(2)}</strong>
        </div>
      `).join('');
    }
  }

  solicitarFechamento() {
    const confirmacao = confirm(
      'Deseja solicitar o fechamento da sua conta?\n\n' +
      'Um funcionário virá até sua suíte para processar o pagamento.\n\n' +
      'Total a pagar: ' + document.getElementById('totalPagar').textContent
    );

    if (confirmacao) {
      // Criar notificação para o sistema principal
      const notificacoes = JSON.parse(localStorage.getItem('notificacoes')) || [];
      notificacoes.push({
        id: Date.now(),
        tipo: 'fechamento_conta',
        quartoId: this.quartoAtual.id,
        quartoNome: `${this.quartoAtual.nome} #${this.quartoAtual.numero}`,
        valor: document.getElementById('totalPagar').textContent,
        timestamp: new Date().toISOString(),
        lida: false
      });
      localStorage.setItem('notificacoes', JSON.stringify(notificacoes));

      alert(
        '✅ Solicitação enviada com sucesso!\n\n' +
        'Um funcionário estará em sua suíte em breve para processar o pagamento.\n\n' +
        'Obrigado por escolher o MontBlanc!'
      );
    }
  }
}

// Inicializar
const clientePortal = new ClientePortal();